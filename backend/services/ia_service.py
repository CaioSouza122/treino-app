import os
import re
import hashlib
import httpx
from datetime import datetime, timedelta
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

# URL base da API de treinos no Render
TREINO_API_URL = os.getenv("TREINO_API_URL", "https://api-treino-ygh4.onrender.com/api/v1")
TREINO_API_KEY = os.getenv("TREINO_API_KEY", "")

# Cache simples para evitar chamadas repetidas (1 hora)
_cache = {}
_cache_tempo = {}


def gerar_treino_ia(dados):
    """
    Gera treino personalizado chamando a API no Render (que usa o Gemini internamente).
    Faz fallback local caso a API esteja inacessível.
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

        print("⚠️ API externa indisponível — usando fallback local.")
        resposta = _gerar_treino_local(dados)
        if resposta:
            _cache[chave] = resposta
            _cache_tempo[chave] = datetime.now() + timedelta(hours=1)
        return resposta

    except Exception as e:
        print(f"❌ Erro geral: {e}")
        return _gerar_treino_local(dados)


def _gerar_treino_local(dados) -> list:
    """
    Gera um treino estruturado localmente sem depender de API externa.
    Usa templates baseados no objetivo, nível e frequência do usuário.
    """
    objetivo = (dados.objetivo or "hipertrofia").lower()
    nivel = (dados.nivel or "intermediario").lower()
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
            {"dia": "Treino A", "foco": "Corpo Todo (Empurrar)", "grupos": ["peito", "ombros", "triceps", "core"]},
            {"dia": "Treino B", "foco": "Corpo Todo (Puxar + Pernas)", "grupos": ["costas", "biceps", "pernas", "gluteos"]},
        ],
        3: [
            {"dia": "Treino A", "foco": "Peito e Tríceps", "grupos": ["peito", "triceps", "core"]},
            {"dia": "Treino B", "foco": "Costas e Bíceps", "grupos": ["costas", "biceps"]},
            {"dia": "Treino C", "foco": "Pernas e Glúteos", "grupos": ["pernas", "gluteos", "core"]},
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
            {"dia": "Treino E", "foco": "Glúteos e Tríceps", "grupos": ["gluteos", "triceps", "core"]},
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
        "hipertrofia": "Foco em hipertrofia: descanso 60–90s entre séries, progressão de carga semanal.",
        "emagrecimento": "Foco em emagrecimento: intervalos curtos 30–45s, circuitos quando possível.",
        "forca": "Foco em força: descanso 2–3min entre séries, cargas elevadas com menos repetições.",
        "resistencia": "Foco em resistência: repetições altas (15–20), intervalos curtos.",
        "condicionamento": "Foco em condicionamento: combinar exercícios compostos e aeróbicos.",
    }
    obs = obs_objetivo.get(objetivo, f"Objetivo: {objetivo.capitalize()}. Progrida as cargas semanalmente.")

    resultado = []
    for bloco in template:
        linhas = [f"🎯 {obs}", ""]
        for grupo in bloco["grupos"]:
            exercs = exercicios_db.get(grupo, [])
            if exercs:
                linhas.append(f"▸ {grupo.upper()}")
                linhas.extend(f"  • {ex}" for ex in exercs)
                linhas.append("")
        linhas.append(f"⏱ Tempo estimado: {tempo} min")
        resultado.append({
            "dia": bloco["dia"],
            "foco": bloco["foco"],
            "exercicios": "\n".join(linhas).strip(),
        })

    print(f"✅ Treino local gerado com {len(resultado)} dias (fallback)")
    return resultado


def _chamar_api_externa_sync(dados):
    """
    Chama o endpoint POST /api/v1/treino da API no Render de forma síncrona.
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
    print(f"🔗 Chamando API Render: {url}")
    print(f"📤 Payload: {payload}")

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post(url, json=payload, headers=headers)

        print(f"📥 Status: {response.status_code}")

        if response.status_code == 401:
            print(f"🔐 Erro de autenticação! Verifique TREINO_API_KEY no .env")
            print(f"   Resposta: {response.text}")
            return None

        if response.status_code == 429:
            print(f"⏱️ Rate limit atingido. Aguarde.")
            return None

        response.raise_for_status()
        data = response.json()
        print(f"✅ API Render respondeu: {list(data.keys())}")

        treino_texto = data.get("treino_gerado", "")
        if not treino_texto:
            print(f"❌ Campo 'treino_gerado' vazio na resposta: {data}")
            return None

        return _converter_texto_para_dias(treino_texto, dados)

    except httpx.ConnectError as e:
        print(f"❌ Não conseguiu conectar em {url}: {e}")
        return None
    except httpx.TimeoutException:
        print(f"⏳ Timeout ao chamar {url} (API pode estar dormindo no Render free tier)")
        return None
    except httpx.HTTPStatusError as e:
        print(f"❌ Erro HTTP {e.response.status_code}: {e.response.text}")
        return None
    except Exception as e:
        print(f"❌ Erro inesperado: {type(e).__name__}: {e}")
        return None


async def testar_conexao_flask():
    """
    Testa a conexão com a API no Render e retorna um diagnóstico detalhado.
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

        async with httpx.AsyncClient(timeout=60.0) as client:
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
    Converte o texto livre retornado pela API para o formato de array de dias
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