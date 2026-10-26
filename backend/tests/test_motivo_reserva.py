"""A resposta diz por que o treino veio da reserva (diagnóstico da produção sem o log)."""

import httpx
import pytest

from services import ia_service
from tests.conftest import cadastrar, cliente

PERFIL = {
    "altura": 175,
    "peso": 80,
    "idade": 28,
    "vezes_por_semana": 3,
    "objetivo": "hipertrofia",
    "tempo": 60,
    "nivel": "intermediario",
}


def _api_responde(monkeypatch, status: int, corpo: dict | None = None):
    async def postar(url, payload, headers):
        return httpx.Response(status, json=corpo or {}, request=httpx.Request("POST", url))

    monkeypatch.setattr(ia_service, "_postar", postar)


async def _gerar():
    async with cliente() as c:
        h = await cadastrar(c)
        return await c.post("/gerar-treino-ia", json=PERFIL, headers=h)


@pytest.mark.asyncio
async def test_chave_recusada_aparece_no_cabecalho(monkeypatch):
    monkeypatch.setattr(ia_service, "TREINO_API_KEY", "segredo")
    _api_responde(monkeypatch, 401)

    r = await _gerar()

    assert r.status_code == 200
    assert r.headers["X-Motivo-Reserva"] == "api_recusou_a_chave_http_401 chave_configurada=True"
    assert "segredo" not in r.headers["X-Motivo-Reserva"]


@pytest.mark.asyncio
async def test_chave_ausente_e_informada(monkeypatch):
    monkeypatch.setattr(ia_service, "TREINO_API_KEY", "")
    _api_responde(monkeypatch, 401)

    r = await _gerar()

    assert r.headers["X-Motivo-Reserva"].endswith("chave_configurada=False")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("status", "motivo"),
    [(429, "api_com_limite_de_uso_http_429 retry_after="), (404, "api_respondeu_http_404")],
)
async def test_outros_status_da_api(monkeypatch, status, motivo):
    _api_responde(monkeypatch, status)

    r = await _gerar()

    assert r.headers["X-Motivo-Reserva"] == motivo


@pytest.mark.asyncio
async def test_treino_da_ia_nao_tem_cabecalho_de_motivo(monkeypatch):
    _api_responde(monkeypatch, 201, {"treino_gerado": "Treino A: Peito\n- Supino - 4x10"})

    r = await _gerar()

    assert r.status_code == 200
    assert "X-Motivo-Reserva" not in r.headers
