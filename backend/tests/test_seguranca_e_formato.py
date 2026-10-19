"""Validação de entrada, limite de gerações, datas em UTC e divisão do texto da IA em dias."""

from datetime import datetime

import pytest

from schemas.treino_schema import TreinoRequest, WorkoutResponse
from services import ia_service
from tests.conftest import cadastrar, cliente

PAYLOAD = {
    "altura": 175,
    "peso": 80,
    "idade": 28,
    "vezes_por_semana": 3,
    "objetivo": "hipertrofia",
    "tempo": 60,
    "nivel": "intermediario",
}


@pytest.fixture(autouse=True)
def api_externa_offline(monkeypatch):
    async def offline(dados):
        return None

    monkeypatch.setattr(ia_service, "_chamar_api_externa", offline)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "campo,valor",
    [
        ("idade", -5),
        ("altura", 99999),
        ("vezes_por_semana", 9),
        ("objetivo", "x" * 1000),
    ],
)
async def test_entrada_fora_dos_limites_retorna_422(campo, valor):
    async with cliente() as c:
        headers = await cadastrar(c)
        response = await c.post("/gerar-treino-ia", json={**PAYLOAD, campo: valor}, headers=headers)
    assert response.status_code == 422


@pytest.mark.parametrize(
    "digitado,esperado",
    [
        ("Avançado", "avancado"),
        ("INICIANTE", "iniciante"),
        ("intermediário", "intermediario"),
        ("pro", "intermediario"),
        (None, "intermediario"),
    ],
)
def test_nivel_livre_e_normalizado(digitado, esperado):
    assert TreinoRequest(**{**PAYLOAD, "nivel": digitado}).nivel == esperado


@pytest.mark.asyncio
async def test_limite_de_geracoes_por_conta():
    async with cliente() as c:
        conta_a = await cadastrar(c)
        conta_b = await cadastrar(c)
        status = [
            (await c.post("/gerar-treino-ia", json=PAYLOAD, headers=conta_a)).status_code
            for _ in range(6)
        ]
        outra_conta = await c.post("/gerar-treino-ia", json=PAYLOAD, headers=conta_b)
    assert status[:5] == [200] * 5
    assert status[5] == 429
    assert outra_conta.status_code == 200  # o limite é por conta, não global


@pytest.mark.asyncio
async def test_rota_de_diagnostico_publica_foi_removida():
    async with cliente() as c:
        response = await c.get("/testar-api-flask")
    assert response.status_code == 404


def test_created_at_sai_em_utc():
    """Sem o 'Z', o celular interpreta a hora como local e um treino das 22h aparece no dia seguinte."""
    resposta = WorkoutResponse(
        id="1", user_id="u", created_at=datetime(2026, 10, 20, 1, 0), days=[]
    )
    assert resposta.model_dump(mode="json")["created_at"] == "2026-10-20T01:00:00Z"


def test_texto_da_ia_ignora_introducao_e_divide_por_dia():
    texto = (
        "Excelente! Vamos montar seu plano.\n\n"
        "### Filosofia do treino\nConsistência é tudo.\n\n"
        "**Treino A: Peito e Tríceps**\n- Supino reto — 4x8\n- Tríceps pulley — 3x12\n\n"
        "Treino B - Costas e Bíceps\n- Remada curvada — 4x10\n\n"
        "Treino C: Pernas\n- Agachamento — 4x8\n"
    )
    dias = ia_service._converter_texto_para_dias(texto, TreinoRequest(**PAYLOAD))
    assert [d["foco"] for d in dias] == ["Peito e Tríceps", "Costas e Bíceps", "Pernas"]
    assert "Supino reto" in dias[0]["exercicios"] and "Excelente" not in dias[0]["exercicios"]
    assert "Remada" in dias[1]["exercicios"] and "Agachamento" not in dias[1]["exercicios"]


def test_sete_dias_por_semana_nao_quebra():
    texto = "\n".join(f"Treino {letra}: Grupo {letra}\n- Exercício — 3x10" for letra in "ABCDEFG")
    dias = ia_service._converter_texto_para_dias(
        texto, TreinoRequest(**{**PAYLOAD, "vezes_por_semana": 7})
    )
    assert [d["dia"] for d in dias] == [f"Treino {letra}" for letra in "ABCDEFG"]
