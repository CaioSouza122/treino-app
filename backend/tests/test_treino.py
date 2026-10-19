import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from routes import treino as treino_routes
from schemas.treino_schema import TreinoRequest
from services import ia_service

# Referência à função real, guardada antes do fixture substituí-la.
chamar_api_externa_real = ia_service._chamar_api_externa

PAYLOAD = {
    "altura": 1.75,
    "peso": 80,
    "idade": 28,
    "vezes_por_semana": 3,
    "objetivo": "hipertrofia",
    "tempo": 60,
    "nivel": "intermediario",
}


@pytest.fixture(autouse=True)
def api_externa_offline(monkeypatch):
    """Evita chamadas reais à API no Render: por padrão ela "não responde" e o fallback local entra."""

    async def offline(dados):
        return None

    monkeypatch.setattr(ia_service, "_chamar_api_externa", offline)
    treino_routes._geracoes_por_cliente.clear()


@pytest.mark.asyncio
async def test_home():
    """Verifica que a rota raiz retorna status 200."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


@pytest.mark.asyncio
async def test_gerar_treino_payload_invalido():
    """Verifica que dados incompletos retornam 422 (Unprocessable Entity)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/gerar-treino-ia", json={})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_gerar_treino_basico():
    """Verifica que um request válido retorna uma lista de treinos (via fallback local)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/gerar-treino-ia", json=PAYLOAD)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "dia" in data[0]
    assert "foco" in data[0]
    assert "exercicios" in data[0]


def test_payload_ia_envia_perfil_completo():
    """A IA precisa receber corpo, frequência e tempo, não só objetivo e nível."""
    payload = ia_service.montar_payload_ia(TreinoRequest(**PAYLOAD))
    assert payload == PAYLOAD


@pytest.mark.asyncio
async def test_gerar_treino_usa_resposta_da_api(monkeypatch):
    """Quando a API externa responde, o resultado dela é usado no lugar do fallback."""
    dias = [{"dia": "Treino A", "foco": "Peito", "exercicios": "Supino reto — 4x8"}]

    async def online(dados):
        return dias

    monkeypatch.setattr(ia_service, "_chamar_api_externa", online)
    assert await ia_service.gerar_treino_ia(TreinoRequest(**PAYLOAD)) == dias


@pytest.mark.asyncio
async def test_chamada_externa_envia_perfil(monkeypatch):
    """A chamada HTTP real (assíncrona) leva o perfil completo no corpo."""
    enviado = {}

    class FakeResponse:
        status_code = 200

        def raise_for_status(self):
            pass

        def json(self):
            return {"treino_gerado": "Treino A\nSupino reto — 4x8\nTreino B\nRemada — 4x10"}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def post(self, url, json, headers):
            enviado.update(json)
            return FakeResponse()

    monkeypatch.setattr(ia_service.httpx, "AsyncClient", FakeClient)

    dias = await chamar_api_externa_real(TreinoRequest(**PAYLOAD))
    assert enviado == PAYLOAD
    assert len(dias) == PAYLOAD["vezes_por_semana"]
