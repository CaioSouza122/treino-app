"""Banco SQLite temporário e helpers de autenticação para todos os testes."""

import asyncio
import os
import tempfile
import uuid

# Antes de importar o app: o engine lê DATABASE_URL na importação
_db = os.path.join(tempfile.mkdtemp(), "teste.db")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_db}"
os.environ.setdefault("JWT_SECRET", "segredo-de-teste")

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

import models.user  # noqa: E402,F401
from app.main import app  # noqa: E402
from database.connection import Base, engine  # noqa: E402
from routes import auth as auth_routes  # noqa: E402
from routes import treino as treino_routes  # noqa: E402


async def _criar_tabelas():
    async with engine.begin() as conexao:
        await conexao.run_sync(Base.metadata.create_all)


asyncio.run(_criar_tabelas())


@pytest.fixture(autouse=True)
def zerar_limites():
    treino_routes.limite_geracoes.chamadas.clear()
    auth_routes.limite_auth.chamadas.clear()


def cliente() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def cadastrar(
    c: AsyncClient, email: str | None = None, senha: str = "senha-forte-123"
) -> dict:
    """Cria uma conta e devolve os cabeçalhos com o token."""
    email = email or f"{uuid.uuid4().hex[:8]}@teste.com"
    resposta = await c.post(
        "/auth/cadastro", json={"nome": "Teste", "email": email, "senha": senha}
    )
    assert resposta.status_code == 201, resposta.text
    return {"Authorization": f"Bearer {resposta.json()['token']}"}
