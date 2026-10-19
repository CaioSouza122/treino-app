"""Ambiente do Alembic: reaproveita o engine async de database/connection.py (mesma URL e SSL)."""

import asyncio

from alembic import context

import models.user  # noqa: F401 — registra as tabelas no metadata
from database.connection import Base, engine

# Tabela de versão própria: o banco Neon pode ser compartilhado com a API_Treino
VERSION_TABLE = "alembic_version_backend"


def _rodar(connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=Base.metadata,
        version_table=VERSION_TABLE,
        render_as_batch=connection.dialect.name == "sqlite",
    )
    with context.begin_transaction():
        context.run_migrations()


async def _rodar_online() -> None:
    async with engine.connect() as connection:
        await connection.run_sync(_rodar)
    await engine.dispose()


if context.is_offline_mode():
    context.configure(
        url=str(engine.url), target_metadata=Base.metadata, version_table=VERSION_TABLE
    )
    with context.begin_transaction():
        context.run_migrations()
else:
    asyncio.run(_rodar_online())
