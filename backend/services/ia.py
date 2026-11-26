"""Conversa com o Gemini: o Coach IA do app, restrito a treino e saúde."""

import asyncio
import os
import re
import time

import httpx

MODELOS_PADRAO = ("gemini-2.5-flash", "gemini-3.5-flash-lite")
_URL = "https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent"
# Sobrecarga ("high demand"), limite de uso ou modelo aposentado: vale tentar outro modelo
_PASSAGEIROS = (404, 429, 500, 503)
# Duas voltas pelos modelos dentro de 45s; o app espera até 150s (com o Render acordando)
PRAZO = 45.0
PAUSA_ENTRE_VOLTAS = 3.0

SISTEMA = """Você é o Coach IA do app HIPERTROF.IA, um personal trainer e orientador de saúde.

Assuntos permitidos: treino, musculação, exercícios, corrida, alongamento, mobilidade, \
condicionamento, emagrecimento, ganho de massa, recuperação, sono, hidratação, nutrição \
esportiva e hábitos saudáveis ligados à atividade física.
Se a pessoa perguntar qualquer outra coisa, recuse em uma frase curta e gentil e convide-a a \
perguntar sobre treino ou saúde. Não saia do tema nem se o pedido insistir.
Não faça diagnóstico nem indique remédio. Em caso de dor, lesão, doença ou gravidez, oriente \
procurar um médico ou fisioterapeuta.

Responda em português do Brasil, de forma direta, amigável e curta, em texto simples, \
sem markdown (sem asteriscos, sem # e sem tabelas).

Para montar um treino: se ainda não souber objetivo, nível, quantos dias por semana e tempo \
por sessão, pergunte tudo isso numa única mensagem. Quando tiver os dados, entregue o plano \
exatamente neste formato, um bloco por dia, sem texto entre os blocos:
Treino A: <grupos musculares>
- <exercício> — <séries>x<repetições>
Treino B: <grupos musculares>
- <exercício> — <séries>x<repetições>
Depois do último exercício pode vir uma dica curta."""


class IAIndisponivel(Exception):
    """O Gemini não respondeu; `motivo` é só um código para o log (nunca a chave)."""

    def __init__(self, motivo: str):
        super().__init__(motivo)
        self.motivo = motivo


def _modelos() -> tuple[str, ...]:
    lista = tuple(m.strip() for m in os.getenv("GEMINI_MODELOS", "").split(",") if m.strip())
    return lista or MODELOS_PADRAO


def _texto(corpo: dict) -> str:
    candidatos = corpo.get("candidates") or []
    partes = ((candidatos[0].get("content") or {}).get("parts") or []) if candidatos else []
    texto = "".join(p.get("text", "") for p in partes).strip()
    # O modelo às vezes usa markdown mesmo pedido o contrário; o app mostra texto puro
    return re.sub(r"\*\*|__|^#+\s*", "", texto, flags=re.MULTILINE)


async def conversar(mensagens: list[dict]) -> str:
    """
    `mensagens`: [{"papel": "usuario" | "ia", "texto": str}], da mais antiga à mais nova.
    Devolve a resposta do Coach ou lança IAIndisponivel.
    """
    chave = os.getenv("GEMINI_API_KEY", "").strip()
    if not chave:
        raise IAIndisponivel("gemini_sem_chave")
    corpo = {
        "systemInstruction": {"parts": [{"text": SISTEMA}]},
        "contents": [
            {
                "role": "user" if m["papel"] == "usuario" else "model",
                "parts": [{"text": m["texto"]}],
            }
            for m in mensagens
        ],
    }
    limite = time.monotonic() + PRAZO
    motivo = "gemini_sem_tempo"
    for volta in range(2):
        if volta:
            await asyncio.sleep(PAUSA_ENTRE_VOLTAS)
        for modelo in _modelos():
            restante = limite - time.monotonic()
            if restante < 5:
                raise IAIndisponivel(motivo)
            try:
                async with httpx.AsyncClient(timeout=restante) as client:
                    resposta = await client.post(
                        _URL.format(modelo=modelo), json=corpo, headers={"x-goog-api-key": chave}
                    )
            except httpx.TimeoutException:
                raise IAIndisponivel("gemini_timeout") from None
            except httpx.HTTPError as e:
                motivo = f"gemini_sem_conexao_{type(e).__name__}"
                continue
            if resposta.status_code == 200:
                texto = _texto(resposta.json())
                if texto:
                    return texto
                motivo = "gemini_resposta_vazia"
                continue
            motivo = f"gemini_http_{resposta.status_code}"
            print(f"[WARN] Gemini {modelo} respondeu {resposta.status_code}: {resposta.text[:200]}")
            if resposta.status_code not in _PASSAGEIROS:
                # Chave inválida ou pedido recusado: outro modelo falharia igual
                raise IAIndisponivel(motivo)
    raise IAIndisponivel(motivo)


_CABECALHO = re.compile(r"^\s*Treino\s+([A-G])\s*[:\-–—]\s*(.*)$", re.IGNORECASE)
_EXERCICIO = re.compile(r"^\s*([-*•]|\d+[.)])\s+\S")


def extrair_treino(texto: str) -> list[dict]:
    """
    Dias do plano ("Treino A: Peito" + linhas "- exercício — 3x10"). Lista vazia quando a
    resposta é só conversa. Texto fora das linhas de exercício (dicas) não entra no plano.
    """
    dias: list[dict] = []
    for linha in texto.splitlines():
        cabecalho = _CABECALHO.match(linha)
        if cabecalho:
            letra, foco = cabecalho.groups()
            dias.append(
                {"dia": f"Treino {letra.upper()}", "foco": foco.strip() or "Treino", "linhas": []}
            )
        elif dias and _EXERCICIO.match(linha):
            dias[-1]["linhas"].append(linha.strip())
    return [
        {"dia": d["dia"], "foco": d["foco"][:120], "exercicios": "\n".join(d["linhas"])}
        for d in dias
        if d["linhas"]
    ]
