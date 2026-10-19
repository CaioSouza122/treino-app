"""Origem do treino (IA x reserva) e objetivo reconhecido na reserva local."""

import pytest

from schemas.treino_schema import TreinoRequest
from services import ia_service
from tests.conftest import cadastrar, cliente

PERFIL = {
    "altura": 175,
    "peso": 80,
    "idade": 28,
    "vezes_por_semana": 3,
    "objetivo": "emagrecimento",
    "tempo": 60,
    "nivel": "intermediario",
}


@pytest.mark.asyncio
async def test_treino_da_ia_vem_marcado_como_ia(monkeypatch):
    dias = [{"dia": "Treino A", "foco": "Circuito", "exercicios": "Burpee — 3x15"}]

    async def online(dados):
        return dias

    monkeypatch.setattr(ia_service, "_chamar_api_externa", online)
    assert await ia_service.gerar_treino_ia(TreinoRequest(**PERFIL)) == (dias, "ia")


@pytest.mark.asyncio
async def test_treino_de_reserva_vem_marcado_e_aparece_no_historico(monkeypatch):
    async def offline(dados):
        return None

    monkeypatch.setattr(ia_service, "_chamar_api_externa", offline)
    dias, fonte = await ia_service.gerar_treino_ia(TreinoRequest(**PERFIL))
    assert fonte == "reserva" and dias

    async with cliente() as c:
        headers = await cadastrar(c)
        assert (await c.post("/gerar-treino-ia", json=PERFIL, headers=headers)).status_code == 200
        historico = (await c.get("/historico", headers=headers)).json()
    assert historico[0]["fonte"] == "reserva"


@pytest.mark.parametrize(
    "digitado,trecho",
    [
        ("Emagrecimento", "emagrecimento"),
        ("quero emagrecer", "emagrecimento"),
        ("perder peso", "emagrecimento"),
        ("Força", "força"),
        ("Resistência", "resistência"),
        ("ganhar massa", "hipertrofia"),
    ],
)
def test_reserva_reconhece_o_objetivo_com_ou_sem_acento(digitado, trecho):
    dias = ia_service._gerar_treino_local(TreinoRequest(**{**PERFIL, "objetivo": digitado}))
    assert f"Foco em {trecho}" in dias[0]["exercicios"]
