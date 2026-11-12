"""
Chamada direta ao Gemini, sem passar pela API_Treino.

O backend e a API_Treino ficam no Render free: o pedido de um para o outro sai por um IP
compartilhado com outros apps, e a borda do Render (Cloudflare) às vezes responde 429
antes de chegar à API. Com GEMINI_API_KEY no backend, o treino vem direto do Google e a
API_Treino vira a segunda opção. O prompt é o mesmo da API_Treino (api_academia/services.py).
"""

import os
import time

import httpx

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
# Modelo principal e um mais leve para quando o principal está sobrecarregado; o Google
# aposenta modelos, então GEMINI_MODELOS (separados por vírgula) troca a lista sem deploy
MODELOS_PADRAO = ("gemini-2.5-flash", "gemini-3.5-flash-lite")
_URL = "https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent"
# Sobrecarga ou limite: vale tentar o próximo modelo
_ERROS_TEMPORARIOS = (429, 500, 503)
# A geração leva ~10-25s; sobra prazo para a API_Treino se o Google falhar
PRAZO_GEMINI = 60.0


def ativo() -> bool:
    return bool(GEMINI_API_KEY.strip())


def modelos() -> tuple[str, ...]:
    lista = tuple(m.strip() for m in os.getenv("GEMINI_MODELOS", "").split(",") if m.strip())
    return lista or MODELOS_PADRAO


def montar_prompt(payload: dict) -> str:
    """Mesmo prompt da API_Treino: perfil do aluno e formato 'Treino A: ...' por dia."""
    partes = []
    if payload.get("idade"):
        partes.append(f"{payload['idade']} anos")
    if payload.get("altura"):
        partes.append(f"altura {payload['altura']:g}")
    if payload.get("peso"):
        partes.append(f"peso {payload['peso']:g} kg")
    if payload.get("vezes_por_semana"):
        partes.append(f"treina {payload['vezes_por_semana']} vezes por semana")
    if payload.get("tempo"):
        partes.append(f"tem {payload['tempo']} minutos por sessão")
    perfil = (
        f"Perfil do aluno: {', '.join(partes)}. Adapte volume e divisão a esse perfil. "
        if partes
        else ""
    )
    dias = payload.get("vezes_por_semana")
    divisao = f"Divida o plano em exatamente {dias} treinos. " if dias else ""
    return (
        "Você é um personal trainer altamente qualificado. "
        f"Crie um treino estruturado e objetivo focado em '{payload['objetivo']}' "
        f"para um aluno de nível '{payload.get('nivel') or 'intermediario'}'. "
        f"{perfil}"
        "Inclua nomes de exercícios, número de séries e repetições recomendadas. "
        f"{divisao}Responda sem introdução nem conclusão. Comece cada treino com uma linha "
        "exatamente no formato 'Treino A: <grupos musculares>' (depois Treino B, Treino C...) "
        "e liste abaixo um exercício por linha no formato '- <exercício> — <séries>x<repetições>'."
    )


def _texto(corpo: dict) -> str:
    candidatos = corpo.get("candidates") or []
    if not candidatos:
        return ""
    partes = (candidatos[0].get("content") or {}).get("parts") or []
    return "".join(p.get("text", "") for p in partes).strip()


async def gerar(payload: dict) -> tuple[str, str]:
    """
    Devolve (texto do treino, "") ou ("", motivo da falha). O motivo é só um código
    (ex.: gemini_http_429), nunca a chave.
    """
    prompt = {"contents": [{"parts": [{"text": montar_prompt(payload)}]}]}
    headers = {"x-goog-api-key": GEMINI_API_KEY.strip()}
    limite = time.monotonic() + PRAZO_GEMINI
    motivo = "gemini_sem_modelo"
    for modelo in modelos():
        restante = limite - time.monotonic()
        if restante < 5:
            break
        try:
            async with httpx.AsyncClient(timeout=restante) as client:
                resposta = await client.post(
                    _URL.format(modelo=modelo), json=prompt, headers=headers
                )
        except httpx.TimeoutException:
            motivo = "gemini_timeout"
            break
        except httpx.HTTPError as e:
            motivo = f"gemini_sem_conexao_{type(e).__name__}"
            continue
        if resposta.status_code == 200:
            texto = _texto(resposta.json())
            if texto:
                return texto, ""
            motivo = "gemini_resposta_vazia"
            continue
        motivo = f"gemini_http_{resposta.status_code}"
        print(f"[WARN] Gemini {modelo} respondeu {resposta.status_code}: {resposta.text[:200]}")
        if resposta.status_code not in _ERROS_TEMPORARIOS:
            # Chave inválida ou pedido recusado: outro modelo falharia igual
            break
    return "", motivo
