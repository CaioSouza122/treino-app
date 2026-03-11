import google.generativeai as genai
import os
import json
import re
import hashlib
from datetime import datetime, timedelta
from functools import lru_cache
from dotenv import load_dotenv
import concurrent.futures

# Carrega variáveis de ambiente
load_dotenv()

# Configura a API key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("⚠️  Aviso: GEMINI_API_KEY não encontrada. Usando apenas fallback.")
else:
    genai.configure(api_key=api_key)
    # Tenta usar o modelo mais estável
    try:
        model = genai.GenerativeModel('gemini-pro')
    except:
        try:
            model = genai.GenerativeModel('gemini-1.0-pro')
        except:
            print("⚠️  Modelo não disponível, usando apenas fallback.")
            model = None

# Cache simples para evitar chamadas repetidas
_cache = {}
_cache_tempo = {}

def gerar_treino_ia(dados):
    """
    Gera treino personalizado usando IA com fallback automático
    """
    try:
        # Cria uma chave única para os dados (para cache)
        chave = hashlib.md5(str(dados.__dict__).encode()).hexdigest()
        
        # Verifica se tem no cache e ainda é válido (1 hora)
        if chave in _cache and datetime.now() < _cache_tempo.get(chave, datetime.min):
            print("📦 Usando resposta do cache")
            return _cache[chave]
        
        # Tenta gerar com IA
        if model:
            try:
                resposta = _gerar_com_ia(dados)
                if resposta and "erro" not in resposta:
                    # Salva no cache por 1 hora
                    _cache[chave] = resposta
                    _cache_tempo[chave] = datetime.now() + timedelta(hours=1)
                    return resposta
            except Exception as e:
                erro_str = str(e)
                print(f"🤖 Erro na IA: {erro_str[:100]}")
                
                # Se for erro de cota, usa fallback
                if "429" in erro_str or "quota" in erro_str.lower() or "ResourceExhausted" in erro_str:
                    print("⚠️  Limite da API excedido! Usando fallback...")
                    return _gerar_fallback(dados)
        
        # Se não tiver IA ou deu erro, usa fallback
        return _gerar_fallback(dados)
        
    except Exception as e:
        print(f"❌ Erro geral: {e}")
        return _gerar_fallback(dados)

def _gerar_com_ia(dados):
    """Gera treino usando a IA"""
    prompt = f"""
    Crie um treino de academia personalizado estritamente baseado nas seguintes características:
    - Altura: {dados.altura}cm
    - Peso: {dados.peso}kg
    - Idade: {dados.idade} anos
    - Frequência: {dados.vezes_por_semana} dias por semana
    - Tempo MÁXIMO por treino: {dados.tempo} minutos
    - Objetivo Principal: {dados.objetivo}
    - Nível de Experiência: {dados.nivel}
    
    Você DEVE retornar a rotina dividida nos dias da semana exigidos pela frequência informada.
    Calcule a quantidade de exercícios para que o treino caiba EXATAMENTE no tempo solicitado de {dados.tempo} minutos (leve em consideração descansos).
    
    Retorne APENAS um JSON válido, sem NENHUM texto adicional antes ou depois, com esta exata estrutura (substitua os dados de exemplo):
    [
        {{
            "dia": "Treino A",
            "foco": "Peito e Tríceps",
            "exercicios": "Aquecimento: 5 min\\nSupino Reto 3x12\\nCrucifixo 3x10\\nTempo estimado: 30 min"
        }},
        {{
            "dia": "Treino B",
            "foco": "Costas e Bíceps",
            "exercicios": "Aquecimento: 5 min\\nPuxada 3x12\\nRosca 3x10\\nTempo estimado: 30 min"
        }}
    ]
    O campo "exercicios" DEVE ser uma única string contendo todos os exercícios do dia separados por quebra de linha (\\n), e obrigatoriamente terminar com o "Tempo estimado".
    """
    
    def _chamar_api():
        return model.generate_content(prompt, request_options={"timeout": 15.0})
        
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_chamar_api)
            # Timeout forçado de 10 segundos do lado do Python
            response = future.result(timeout=10.0)
    except concurrent.futures.TimeoutError:
        print("⏳ Tempo esgotado! A API da IA demorou muito a responder.")
        return None
    except Exception as e:
        print(f"❌ Erro interno da IA: {e}")
        return None
        
    # Extrai JSON da resposta
    text = response.text
    
    # Remove markdown se houver
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1]
    
    # Pega o array JSON
    json_match = re.search(r'\[.*\]', text, re.DOTALL)
    if not json_match: # Se não achou array, tenta achar objeto avulso e o coloca numa lista
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return [json.loads(json_match.group())]
            
    if json_match:
        return json.loads(json_match.group())
    
    return None

def _gerar_fallback(dados):
    """
    Gera treino baseado em regras quando a IA não está disponível, 
    retornando exatamente no formato que o Frontend espera.
    """
    objetivo = dados.objetivo.lower() if dados.objetivo else "hipertrofia"
    nivel = dados.nivel.lower() if dados.nivel else "intermediario"
    frequencia = dados.vezes_por_semana if dados.vezes_por_semana else 3
    
    # Biblioteca de exercícios por objetivo
    exercicios = {
        "hipertrofia": {
            "iniciante": [
                {"exercicio": "Supino reto", "series": 3, "repeticoes": "10-12", "descanso": "60s"},
                {"exercicio": "Puxada frontal", "series": 3, "repeticoes": "10-12", "descanso": "60s"},
                {"exercicio": "Agachamento", "series": 3, "repeticoes": "12-15", "descanso": "60s"},
                {"exercicio": "Desenvolvimento", "series": 3, "repeticoes": "10-12", "descanso": "60s"},
                {"exercicio": "Rosca direta", "series": 3, "repeticoes": "12-15", "descanso": "45s"}
            ],
            "intermediario": [
                {"exercicio": "Supino inclinado", "series": 4, "repeticoes": "8-10", "descanso": "75s"},
                {"exercicio": "Remada curvada", "series": 4, "repeticoes": "8-10", "descanso": "75s"},
                {"exercicio": "Leg press", "series": 4, "repeticoes": "10-12", "descanso": "75s"},
                {"exercicio": "Elevação lateral", "series": 3, "repeticoes": "12-15", "descanso": "45s"},
                {"exercicio": "Tríceps pulley", "series": 3, "repeticoes": "12-15", "descanso": "45s"}
            ],
            "avancado": [
                {"exercicio": "Supino reto pesado", "series": 5, "repeticoes": "6-8", "descanso": "90s"},
                {"exercicio": "Barra fixa", "series": 5, "repeticoes": "6-8", "descanso": "90s"},
                {"exercicio": "Agachamento livre", "series": 5, "repeticoes": "8-10", "descanso": "90s"},
                {"exercicio": "Desenvolvimento militar", "series": 4, "repeticoes": "8-10", "descanso": "75s"},
                {"exercicio": "Rosca alternada", "series": 4, "repeticoes": "10-12", "descanso": "60s"}
            ]
        },
        "definir": {
            "iniciante": [
                {"exercicio": "Agachamento", "series": 4, "repeticoes": "15-20", "descanso": "45s"},
                {"exercicio": "Flexão de braço", "series": 4, "repeticoes": "12-15", "descanso": "45s"},
                {"exercicio": "Remada baixa", "series": 4, "repeticoes": "15-20", "descanso": "45s"}
            ],
            "intermediario": [
                {"exercicio": "Circuito funcional", "series": 3, "repeticoes": "20", "descanso": "30s"},
                {"exercicio": "Burpee", "series": 3, "repeticoes": "15", "descanso": "30s"},
                {"exercicio": "Kettlebell swing", "series": 3, "repeticoes": "20", "descanso": "30s"}
            ]
        },
        "emagrecer": {
            "iniciante": [
                {"exercicio": "Esteira", "series": 1, "repeticoes": "20min", "descanso": "0s"},
                {"exercicio": "Agachamento", "series": 3, "repeticoes": "15", "descanso": "30s"},
                {"exercicio": "Polichinelo", "series": 3, "repeticoes": "20", "descanso": "30s"}
            ]
        }
    }
    
    # Pega os exercícios do objetivo e nível, ou usa padrão
    objetivo_exercicios = exercicios.get(objetivo, exercicios.get("hipertrofia"))
    treino_exercicios = objetivo_exercicios.get(nivel, objetivo_exercicios.get("iniciante"))
    
    # Formata a string de exercícios
    exercicios_texto = f"Aquecimento: 5 min\n"
    for ex in treino_exercicios:
        exercicios_texto += f"{ex['exercicio']} {ex['series']}x{ex['repeticoes']} (Desc: {ex['descanso']})\n"
    exercicios_texto += f"\nTempo estimado: {dados.tempo} min"

    treino_formatado = []
    letras = ['A', 'B', 'C', 'D', 'E', 'F']
    
    # Cria o array exatamente como a IA geraria
    for i in range(min(frequencia, len(letras))):
        treino_formatado.append({
            "dia": f"Treino {letras[i]}",
            "foco": objetivo.capitalize() + " (" + nivel.capitalize() + ") - Treino Padrão",
            "exercicios": exercicios_texto
        })
    
    return treino_formatado

# Função de compatibilidade com o código existente
def processar_resposta_ia(resposta):
    """Processa a resposta (mantida para compatibilidade)"""
    return resposta