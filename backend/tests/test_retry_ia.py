"""A API de IA dorme no Render: o backend tenta de novo enquanto ela acorda ou limita."""

import httpx
import pytest

from services import ia_service


@pytest.fixture(autouse=True)
def sem_espera(monkeypatch):
    """As pausas entre tentativas (4s e 8s) não podem atrasar a suíte."""
    pausas = []

    async def dormir(segundos):
        pausas.append(segundos)

    monkeypatch.setattr(ia_service.asyncio, "sleep", dormir)
    return pausas


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
@pytest.mark.parametrize("passageiro", [429, 502, 503, 504])
async def test_tenta_de_novo_em_erro_passageiro(monkeypatch, sem_espera, passageiro):
    falso, chamadas = _cliente_falso([passageiro, 201])
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", falso)

    resposta = await ia_service._postar("http://ia/treino", {}, {})

    assert resposta.status_code == 201
    assert len(chamadas) == 2
    assert sem_espera == [4]


@pytest.mark.asyncio
async def test_tenta_de_novo_quando_a_conexao_e_recusada(monkeypatch):
    falso, chamadas = _cliente_falso([httpx.ConnectError("acordando"), 201])
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", falso)

    resposta = await ia_service._postar("http://ia/treino", {}, {})

    assert resposta.status_code == 201
    assert len(chamadas) == 2


@pytest.mark.asyncio
async def test_espera_mais_a_cada_tentativa_e_recupera_na_terceira(monkeypatch, sem_espera):
    falso, chamadas = _cliente_falso([429, 429, 201])
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", falso)

    resposta = await ia_service._postar("http://ia/treino", {}, {})

    assert resposta.status_code == 201
    assert len(chamadas) == 3
    assert sem_espera == [4, 8]


@pytest.mark.asyncio
@pytest.mark.parametrize("status", [401, 404, 500])
async def test_nao_repete_erros_que_nao_sao_passageiros(monkeypatch, status):
    falso, chamadas = _cliente_falso([status, 201])
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", falso)

    resposta = await ia_service._postar("http://ia/treino", {}, {})

    assert resposta.status_code == status
    assert len(chamadas) == 1


@pytest.mark.asyncio
async def test_desiste_depois_de_tres_tentativas(monkeypatch):
    falso, chamadas = _cliente_falso([429, 429, 429, 201])
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", falso)

    resposta = await ia_service._postar("http://ia/treino", {}, {})

    assert resposta.status_code == 429
    assert len(chamadas) == 3


@pytest.mark.asyncio
async def test_conexao_recusada_tres_vezes_levanta_o_erro(monkeypatch):
    erro = httpx.ConnectError("fora do ar")
    falso, chamadas = _cliente_falso([erro, erro, erro])
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", falso)

    with pytest.raises(httpx.ConnectError):
        await ia_service._postar("http://ia/treino", {}, {})

    assert len(chamadas) == 3
