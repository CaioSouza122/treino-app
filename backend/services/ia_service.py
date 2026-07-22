import os
import re
import hashlib
import asyncio
import httpx
from datetime import datetime, timedelta
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# URL base da API Flask de treinos
TREINO_API_URL = os.getenv("TREINO_API_URL", "http://localhost:5000/api/v1")
TREINO_API_KEY = os.getenv("TREINO_API_KEY", "")

# Cache simples para evitar chamadas repetidas (1 hora)
_cache = {}
_cache_tempo = {}


def gerar_treino_ia(dados):
    """
    Gera treino personalizado chamando a API Flask externa (que usa o Gemini internamente).
    Faz fallback para gerador local caso a API esteja inacessível.
    Roda em thread pool para não bloquear o event loop do FastAPI.
    """
    try:
        chave = hashlib.md5(str(dados.__dict__).encode()).hexdigest()

        if chave in _cache and datetime.now() < _cache_tempo.get(chave, datetime.min):
            print("📦 Usando resposta do cache")
            return _cache[chave]

        resposta = _chamar_api_externa_sync(dados)

        if resposta:
            _cache[chave] = resposta
            _cache_tempo[chave] = datetime.now() + timedelta(hours=1)
            return resposta

        print("⚠️ API externa não respondeu corretamente.")
        return None

    except Exception as e:
        print(f"❌ Erro geral: {e}")
        return None


def _chamar_api_externa_sync(dados):
    """
    Chama o endpoint POST /api/v1/treino da API Flask do usuário de forma síncrona.
    """
    headers = {"Content-Type": "application/json"}
    chave_api = TREINO_API_KEY
    if chave_api:
        headers["X-API-KEY"] = chave_api

    payload = {
        "objetivo": dados.objetivo,
        "nivel": dados.nivel or "intermediario",
    }

    url = f"{TREINO_API_URL}/treino"
    print(f"🔗 Chamando API Flask: {url}")
    print(f"📤 Payload: {payload}")

    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(url, json=payload, headers=headers)

        print(f"📥 Status: {response.status_code}")

        if response.status_code == 401:
            print(f"🔐 Erro de autenticação! Verifique TREINO_API_KEY no .env")
            print(f"   Resposta: {response.text}")
            return None

        if response.status_code == 429:
            print(f"⏱️ Rate limit atingido na API Flask (5 por minuto). Aguarde.")
            return None

        response.raise_for_status()
        data = response.json()
        print(f"✅ API Flask respondeu: {list(data.keys())}")

        treino_texto = data.get("treino_gerado", "")
        if not treino_texto:
            print(f"❌ Campo 'treino_gerado' vazio na resposta: {data}")
            return None

        return _converter_texto_para_dias(treino_texto, dados)

    except httpx.ConnectError as e:
        print(f"❌ Não conseguiu conectar em {url}: {e}")
        return None
    except httpx.TimeoutException:
        print(f"⏳ Timeout ao chamar {url}")
        return None
    except httpx.HTTPStatusError as e:
        print(f"❌ Erro HTTP {e.response.status_code}: {e.response.text}")
        return None
    except Exception as e:
        print(f"❌ Erro inesperado: {type(e).__name__}: {e}")
        return None


async def testar_conexao_flask():
    """
    Testa a conexão com a API Flask e retorna um diagnóstico detalhado.
    """
    url = f"{TREINO_API_URL}/health"
    chave_api = TREINO_API_KEY
    resultado = {
        "url_configurada": TREINO_API_URL,
        "api_key_configurada": bool(chave_api),
        "health_check": None,
        "teste_treino": None,
        "erro": None,
    }

    try:
        headers = {}
        if chave_api:
            headers["X-API-KEY"] = chave_api

        async with httpx.AsyncClient(timeout=10.0) as client:
            # Testa o health check
            try:
                r = await client.get(url, headers=headers)
                resultado["health_check"] = {
                    "status_code": r.status_code,
                    "resposta": r.json() if r.status_code == 200 else r.text,
                }
            except Exception as e:
                resultado["health_check"] = {"erro": str(e)}

            # Testa criação de treino
            try:
                r2 = await client.post(
                    f"{TREINO_API_URL}/treino",
                    json={"objetivo": "hipertrofia", "nivel": "iniciante"},
                    headers={**headers, "Content-Type": "application/json"},
                )
                resultado["teste_treino"] = {
                    "status_code": r2.status_code,
                    "campos_retornados": list(r2.json().keys()) if r2.status_code in (200, 201) else r2.text,
                }
            except Exception as e:
                resultado["teste_treino"] = {"erro": str(e)}

    except Exception as e:
        resultado["erro"] = str(e)

    return resultado


def _converter_texto_para_dias(treino_texto: str, dados) -> list:
    """
    Converte o texto livre retornado pela API Flask para o formato de array de dias
    que o app mobile espera: [{ "dia", "foco", "exercicios" }]
    """
    frequencia = dados.vezes_por_semana or 3
    objetivo = dados.objetivo or "Treino"
    nivel = dados.nivel or "intermediario"
    tempo = dados.tempo or 30
    letras = ['A', 'B', 'C', 'D', 'E', 'F']

    blocos = re.split(r'\n(?=(?:Treino\s+[A-F]|Dia\s+\d|#{1,3}\s))', treino_texto, flags=re.IGNORECASE)

    if len(blocos) >= 2:
        dias = []
        for i, bloco in enumerate(blocos[:frequencia]):
            bloco = bloco.strip()
            if not bloco:
                continue
            linhas = bloco.split('\n')
            foco_linha = linhas[0].strip().lstrip('#').strip() if linhas else f"{objetivo} - Dia {letras[i]}"
            exercicios = '\n'.join(l for l in linhas[1:] if l.strip())
            exercicios += f"\n\nTempo estimado: {tempo} min"
            dias.append({
                "dia": f"Treino {letras[i]}",
                "foco": foco_linha or f"{objetivo.capitalize()} ({nivel.capitalize()})",
                "exercicios": exercicios,
            })
        while len(dias) < frequencia:
            i = len(dias)
            dias.append({
                "dia": f"Treino {letras[i]}",
                "foco": f"{objetivo.capitalize()} ({nivel.capitalize()})",
                "exercicios": treino_texto.strip() + f"\n\nTempo estimado: {tempo} min",
            })
        return dias
    else:
        exercicios_formatados = treino_texto.strip() + f"\n\nTempo estimado: {tempo} min"
        return [
            {
                "dia": f"Treino {letras[i]}",
                "foco": f"{objetivo.capitalize()} ({nivel.capitalize()})",
                "exercicios": exercicios_formatados,
            }
            for i in range(frequencia)
        ]


def processar_resposta_ia(resposta):
    """Mantida para compatibilidade."""
    return resposta