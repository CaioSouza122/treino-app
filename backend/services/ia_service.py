import asyncio
import os
import re
import unicodedata
from contextvars import ContextVar

import httpx

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# URL base da API de treinos no Render
TREINO_API_URL = os.getenv("TREINO_API_URL", "https://api-treino-ygh4.onrender.com/api/v1")
TREINO_API_KEY = os.getenv("TREINO_API_KEY", "")


# Por que o último treino da requisição atual veio da reserva; a rota devolve isso em um
# cabeçalho para diagnosticar a produção sem depender do log do Render.
motivo_reserva: ContextVar[str] = ContextVar("motivo_reserva", default="")


async def gerar_treino_ia(dados) -> tuple[list, str]:
    """
    Gera treino personalizado chamando a API no Render (que usa o Gemini internamente).
    Faz fallback local caso a API esteja inacessível. Sem cache: "gerar de novo" deve
    trazer um treino novo, e um fallback não pode ficar preso enquanto a IA já voltou.

    Devolve (dias, fonte), com fonte "ia" ou "reserva", para o app avisar quando o
    treino veio dos modelos locais.
    """
    motivo_reserva.set("")
    try:
        resposta = await _chamar_api_externa(dados)
        if resposta:
            return resposta, "ia"

        print("[INFO] API externa indisponivel - usando engine de fallback local.")
    except Exception as e:
        print(f"[ERRO] Erro geral ao gerar treino: {e}")
        motivo_reserva.set(f"erro_geral_{type(e).__name__}")
    return _gerar_treino_local(dados), "reserva"


# Palavras que identificam cada objetivo no texto livre do usuário (sem acento, minúsculo)
_PALAVRAS_OBJETIVO = (
    ("emagrecimento", ("emagrec", "perder peso", "perda de peso", "gordura", "secar", "definir")),
    ("forca", ("forca",)),
    ("resistencia", ("resist",)),
    ("condicionamento", ("condicion", "cardio", "folego")),
    ("hipertrofia", ("hipertrof", "massa", "musculo", "crescer")),
)


def classificar_objetivo(texto: str | None) -> str:
    """'Quero emagrecer' -> 'emagrecimento'; texto sem palavra conhecida -> o próprio texto."""
    bruto = (texto or "hipertrofia").strip()
    normal = unicodedata.normalize("NFKD", bruto).encode("ascii", "ignore").decode().lower()
    for objetivo, palavras in _PALAVRAS_OBJETIVO:
        if any(palavra in normal for palavra in palavras):
            return objetivo
    return bruto.lower()


def _gerar_treino_local(dados) -> list:
    """
    Gera um treino estruturado localmente sem depender de API externa.
    Usa templates baseados no objetivo, nível e frequência do usuário.
    """
    objetivo = classificar_objetivo(dados.objetivo)
    frequencia = dados.vezes_por_semana or 4
    tempo = dados.tempo or 60

    # Banco de exercícios por grupo muscular
    exercicios_db = {
        "peito": [
            "Supino reto com barra — 4x8-12",
            "Supino inclinado com halteres — 3x10-12",
            "Crucifixo na polia — 3x12-15",
            "Flexão de braço — 3x falha",
        ],
        "costas": [
            "Barra fixa (ou puxada alta) — 4x6-10",
            "Remada curvada com barra — 4x8-12",
            "Remada unilateral com haltere — 3x10-12",
            "Pulldown na polia — 3x12-15",
        ],
        "pernas": [
            "Agachamento livre — 4x8-12",
            "Leg press 45° — 3x10-15",
            "Cadeira extensora — 3x12-15",
            "Mesa flexora — 3x12-15",
            "Panturrilha em pé — 4x15-20",
        ],
        "ombros": [
            "Desenvolvimento com barra — 4x8-12",
            "Elevação lateral com halteres — 4x12-15",
            "Elevação frontal — 3x12",
            "Encolhimento de ombros — 3x12-15",
        ],
        "biceps": [
            "Rosca direta com barra — 3x10-12",
            "Rosca alternada com halteres — 3x10-12",
            "Rosca concentrada — 3x12-15",
        ],
        "triceps": [
            "Tríceps testa com barra — 3x10-12",
            "Tríceps pulley — 3x12-15",
            "Mergulho entre bancos — 3x falha",
        ],
        "core": [
            "Prancha frontal — 3x 45s",
            "Abdominal supra — 3x20",
            "Rotação russa — 3x20",
            "Elevação de pernas — 3x15",
        ],
        "gluteos": [
            "Hip thrust com barra — 4x10-12",
            "Agachamento sumô — 3x12-15",
            "Abdução de quadril na polia — 3x15",
        ],
    }

    # Estrutura de divisões por frequência
    divisoes = {
        2: [
            {
                "dia": "Treino A",
                "foco": "Corpo Todo (Empurrar)",
                "grupos": ["peito", "ombros", "triceps", "core"],
            },
            {
                "dia": "Treino B",
                "foco": "Corpo Todo (Puxar + Pernas)",
                "grupos": ["costas", "biceps", "pernas", "gluteos"],
            },
        ],
        3: [
            {"dia": "Treino A", "foco": "Peito e Tríceps", "grupos": ["peito", "triceps", "core"]},
            {"dia": "Treino B", "foco": "Costas e Bíceps", "grupos": ["costas", "biceps"]},
            {
                "dia": "Treino C",
                "foco": "Pernas e Glúteos",
                "grupos": ["pernas", "gluteos", "core"],
            },
        ],
        4: [
            {"dia": "Treino A", "foco": "Peito e Tríceps", "grupos": ["peito", "triceps"]},
            {"dia": "Treino B", "foco": "Costas e Bíceps", "grupos": ["costas", "biceps"]},
            {"dia": "Treino C", "foco": "Pernas e Glúteos", "grupos": ["pernas", "gluteos"]},
            {"dia": "Treino D", "foco": "Ombros e Core", "grupos": ["ombros", "core"]},
        ],
        5: [
            {"dia": "Treino A", "foco": "Peito", "grupos": ["peito", "core"]},
            {"dia": "Treino B", "foco": "Costas", "grupos": ["costas"]},
            {"dia": "Treino C", "foco": "Pernas", "grupos": ["pernas"]},
            {"dia": "Treino D", "foco": "Ombros e Bíceps", "grupos": ["ombros", "biceps"]},
            {
                "dia": "Treino E",
                "foco": "Glúteos e Tríceps",
                "grupos": ["gluteos", "triceps", "core"],
            },
        ],
        6: [
            {"dia": "Treino A", "foco": "Peito e Tríceps", "grupos": ["peito", "triceps"]},
            {"dia": "Treino B", "foco": "Costas e Bíceps", "grupos": ["costas", "biceps"]},
            {"dia": "Treino C", "foco": "Pernas", "grupos": ["pernas"]},
            {"dia": "Treino D", "foco": "Ombros", "grupos": ["ombros", "core"]},
            {"dia": "Treino E", "foco": "Peito e Bíceps", "grupos": ["peito", "biceps"]},
            {"dia": "Treino F", "foco": "Costas e Glúteos", "grupos": ["costas", "gluteos"]},
        ],
    }

    # Ajusta para a frequência mais próxima disponível
    freq_valida = min(divisoes.keys(), key=lambda k: abs(k - frequencia))
    template = divisoes[freq_valida][:frequencia]

    obs_objetivo = {
        "hipertrofia": "Foco em hipertrofia: descanso 60-90s entre séries, progressão de carga semanal.",
        "emagrecimento": "Foco em emagrecimento: intervalos curtos 30-45s, circuitos quando possível.",
        "forca": "Foco em força: descanso 2-3min entre séries, cargas elevadas com menos repetições.",
        "resistencia": "Foco em resistência: repetições altas (15-20), intervalos curtos.",
        "condicionamento": "Foco em condicionamento: combinar exercícios compostos e aeróbicos.",
    }
    obs = obs_objetivo.get(
        objetivo, f"Objetivo: {objetivo.capitalize()}. Progrida as cargas semanalmente."
    )

    resultado = []
    for bloco in template:
        linhas = [f"PROTOCOLO: {obs}", ""]
        for grupo in bloco["grupos"]:
            exercs = exercicios_db.get(grupo, [])
            if exercs:
                linhas.append(f"GROUP: {grupo.upper()}")
                linhas.extend(f"  - {ex}" for ex in exercs)
                linhas.append("")
        linhas.append(f"Tempo estimado: {tempo} min")
        resultado.append(
            {
                "dia": bloco["dia"],
                "foco": bloco["foco"],
                "exercicios": "\n".join(linhas).strip(),
            }
        )

    print(f"[OK] Treino local gerado com {len(resultado)} dias (fallback)")
    return resultado


def montar_payload_ia(dados) -> dict:
    """
    Monta o corpo enviado à API de IA com o perfil completo do usuário,
    para que o treino considere corpo, frequência e tempo disponível.
    """
    return {
        "objetivo": dados.objetivo,
        "nivel": dados.nivel or "intermediario",
        "altura": dados.altura,
        "peso": dados.peso,
        "idade": dados.idade,
        "vezes_por_semana": dados.vezes_por_semana,
        "tempo": dados.tempo,
    }


# A API de IA fica num serviço do Render que dorme quando parado: acordar leva ~30s e a
# geração outros ~25s. Com 60s a conta estourava e o app caía no treino de reserva.
TIMEOUT_API = 100.0
# Enquanto acorda (ou sob limite passageiro), o Render pode responder 429/502/503/504 ou
# recusar a conexão. Segundos de espera entre as tentativas: 4s e depois 8s.
_STATUS_PASSAGEIROS = (429, 502, 503, 504)
_PAUSAS = (4, 8)


async def _postar(url: str, payload: dict, headers: dict) -> httpx.Response:
    """POST na API de IA, tentando de novo (até 3 vezes) enquanto o erro parecer passageiro."""
    for tentativa, pausa in enumerate((*_PAUSAS, None), start=1):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT_API) as client:
                resposta = await client.post(url, json=payload, headers=headers)
        except httpx.ConnectError as e:
            if pausa is None:
                raise
            print(f"[WARN] API externa recusou a conexão ({e}); tentando de novo em {pausa}s")
        else:
            if resposta.status_code not in _STATUS_PASSAGEIROS or pausa is None:
                return resposta
            print(
                f"[WARN] API externa respondeu {resposta.status_code} "
                f"(tentativa {tentativa}); tentando de novo em {pausa}s"
            )
        await asyncio.sleep(pausa)
    raise RuntimeError("inalcançável")  # pragma: no cover


def _falhou(motivo: str) -> None:
    """Guarda por que a IA não respondeu (só códigos, nunca a chave nem a resposta)."""
    motivo_reserva.set(motivo)
    return None


async def _chamar_api_externa(dados):
    """
    Chama o endpoint POST /api/v1/treino da API no Render sem bloquear o event loop.
    """
    headers = {"Content-Type": "application/json"}
    chave_api = TREINO_API_KEY
    if chave_api:
        headers["X-API-KEY"] = chave_api

    payload = montar_payload_ia(dados)

    url = f"{TREINO_API_URL}/treino"
    print(f"[INFO] Chamando API Render: {url}")

    try:
        response = await _postar(url, payload, headers)

        print(f"[INFO] Status da API Externa: {response.status_code}")

        if response.status_code == 401:
            print("[WARN] Erro de autenticação! Verifique TREINO_API_KEY no .env")
            return _falhou(f"api_recusou_a_chave_http_401 chave_configurada={bool(chave_api)}")

        if response.status_code == 429:
            retry_after = re.sub(r"[^0-9A-Za-z ,:-]", "", response.headers.get("retry-after", ""))
            print(
                f"[WARN] Rate limit na API externa (Retry-After={retry_after!r}): {response.text[:300]}"
            )
            return _falhou(f"api_com_limite_de_uso_http_429 retry_after={retry_after[:20]}")

        response.raise_for_status()
        data = response.json()
        print(f"[OK] API Render respondeu com sucesso: {list(data.keys())}")

        treino_texto = data.get("treino_gerado", "")
        if not treino_texto:
            print(f"[ERRO] Campo 'treino_gerado' vazio na resposta: {data}")
            return _falhou("resposta_sem_treino_gerado")

        return _converter_texto_para_dias(treino_texto, dados)

    except httpx.ConnectError as e:
        print(f"[WARN] Nao conseguiu conectar em {url}: {e}")
        return _falhou("sem_conexao_com_a_api")
    except httpx.TimeoutException:
        print(f"[WARN] Timeout ao chamar {url}")
        return _falhou("timeout")
    except httpx.HTTPStatusError as e:
        print(f"[ERRO] Erro HTTP {e.response.status_code}: {e.response.text}")
        return _falhou(f"api_respondeu_http_{e.response.status_code}")
    except Exception as e:
        print(f"[ERRO] Erro inesperado ao chamar API externa: {type(e).__name__}: {e}")
        return _falhou(f"erro_inesperado_{type(e).__name__}")


# Cabeçalho de cada dia: "Treino A: Peito", "**Treino B - Costas**", "### Dia 3: Pernas"
_CABECALHO_DIA = re.compile(
    r"^[#*\s]*(?:Treino\s+[A-G]|Dia\s+\d)\b[^\n]*$", re.IGNORECASE | re.MULTILINE
)
_LETRAS = "ABCDEFG"


def _limpar_foco(cabecalho: str) -> str:
    """'**Treino A: Peito e Tríceps**' -> 'Peito e Tríceps'."""
    texto = cabecalho.strip().strip("#*").strip()
    partes = re.split(r"\s*[:–—]\s*|\s+-\s+", texto, maxsplit=1)
    return partes[-1].strip().strip("*").strip() if len(partes) == 2 else ""


def _converter_texto_para_dias(treino_texto: str, dados) -> list:
    """
    Converte o texto livre retornado pela API para o formato de array de dias
    que o app mobile espera: [{ "dia", "foco", "exercicios" }].
    Divide só nas linhas de cabeçalho de dia; o texto antes do primeiro dia (introdução) é descartado.
    """
    frequencia = min(dados.vezes_por_semana or 3, len(_LETRAS))
    objetivo = dados.objetivo or "Treino"
    nivel = dados.nivel or "intermediario"
    tempo = dados.tempo or 30
    foco_padrao = f"{objetivo.capitalize()} ({nivel.capitalize()})"
    rodape = f"\n\nTempo estimado: {tempo} min"

    cabecalhos = list(_CABECALHO_DIA.finditer(treino_texto))
    dias = []
    for i, cabecalho in enumerate(cabecalhos[:frequencia]):
        fim = cabecalhos[i + 1].start() if i + 1 < len(cabecalhos) else len(treino_texto)
        corpo = treino_texto[cabecalho.end() : fim]
        exercicios = "\n".join(linha for linha in corpo.splitlines() if linha.strip())
        dias.append(
            {
                "dia": f"Treino {_LETRAS[i]}",
                "foco": _limpar_foco(cabecalho.group()) or foco_padrao,
                "exercicios": exercicios + rodape,
            }
        )

    # Sem cabeçalhos (ou menos dias que o pedido): repete o texto inteiro nos dias que faltam
    while len(dias) < frequencia:
        dias.append(
            {
                "dia": f"Treino {_LETRAS[len(dias)]}",
                "foco": foco_padrao,
                "exercicios": treino_texto.strip() + rodape,
            }
        )
    return dias
