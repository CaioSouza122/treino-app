"""A API de IA dorme no Render: o backend tenta de novo enquanto ela acorda."""

import httpx
import pytest

from services import ia_service


def _cliente_falso(respostas: list):
    """AsyncClient que devolve (ou levanta) cada item de `respostas`, na ordem."""
    chamadas = []

    class Falso:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, json=None, headers=None):
            chamadas.append(url)
            item = respostas[len(chamadas) - 1]
            if isinstance(item, Exception):
                raise item
            return httpx.Response(item, json={"treino_gerado": "Treino A: Peito\n- Supino"})

    return Falso, chamadas


@pytest.mark.asyncio
@pytest.mark.parametrize("acordando", [502, 503, 504])
async def test_tenta_de_novo_quando_a_api_esta_acordando(monkeypatch, acordando):
    falso, chamadas = _cliente_falso([acordando, 201])
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", falso)

    resposta = await ia_service._postar("http://ia/treino", {}, {})

    assert resposta.status_code == 201
    assert len(chamadas) == 2


@pytest.mark.asyncio
async def test_tenta_de_novo_quando_a_conexao_e_recusada(monkeypatch):
    falso, chamadas = _cliente_falso([httpx.ConnectError("acordando"), 201])
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", falso)

    resposta = await ia_service._postar("http://ia/treino", {}, {})

    assert resposta.status_code == 201
    assert len(chamadas) == 2


@pytest.mark.asyncio
@pytest.mark.parametrize("status", [401, 429, 500])
async def test_nao_repete_erros_que_nao_sao_de_cold_start(monkeypatch, status):
    falso, chamadas = _cliente_falso([status, 201])
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", falso)

    resposta = await ia_service._postar("http://ia/treino", {}, {})

    assert resposta.status_code == status
    assert len(chamadas) == 1


@pytest.mark.asyncio
async def test_desiste_depois_de_duas_tentativas(monkeypatch):
    falso, chamadas = _cliente_falso([503, 503, 201])
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", falso)

    resposta = await ia_service._postar("http://ia/treino", {}, {})

    assert resposta.status_code == 503
    assert len(chamadas) == 2
