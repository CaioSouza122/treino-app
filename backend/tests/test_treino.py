import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_home():
    """Verifica que a rota raiz retorna status 200."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()


@pytest.mark.asyncio
async def test_gerar_treino_payload_invalido():
    """Verifica que dados incompletos retornam 422 (Unprocessable Entity)."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/gerar-treino-ia", json={})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_gerar_treino_basico():
    """Verifica que um request válido retorna uma lista de treinos."""
    payload = {
        "altura": 1.75,
        "peso": 80,
        "idade": 28,
        "vezes_por_semana": 3,
        "objetivo": "hipertrofia",
        "tempo": 60,
        "nivel": "intermediario",
    }
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        response = await client.post("/gerar-treino-ia", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "dia" in data[0]
    assert "foco" in data[0]
    assert "exercicios" in data[0]
