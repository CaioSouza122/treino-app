"""O app chama /acordar ao abrir para a API de IA já estar de pé ao gerar o treino."""

import httpx
import pytest

from app import main
from services import ia_service
from tests.conftest import cliente


@pytest.mark.asyncio
async def test_acordar_responde_e_chama_a_api_de_ia(monkeypatch):
    chamadas = []

    async def acordar():
        chamadas.append(True)

    monkeypatch.setattr(main, "acordar_api_ia", acordar)

    async with cliente() as c:
        r = await c.get("/acordar")

    assert r.status_code == 200
    assert chamadas == [True]


@pytest.mark.asyncio
async def test_acordar_api_ia_usa_a_raiz_e_ignora_falhas(monkeypatch):
    urls = []

    class Falso:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def get(self, url):
            urls.append(url)
            raise httpx.ConnectError("dormindo")

    monkeypatch.setattr(ia_service, "TREINO_API_URL", "https://ia.exemplo/api/v1")
    monkeypatch.setattr(ia_service.httpx, "AsyncClient", Falso)

    await ia_service.acordar_api_ia()

    assert urls == ["https://ia.exemplo"]
