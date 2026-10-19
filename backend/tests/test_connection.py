"""Normalização de DATABASE_URL para o engine async (Neon e SQLite)."""

import ssl

from database.connection import normalizar_url


def test_url_do_neon_vira_asyncpg_com_ssl_verificado():
    url, args = normalizar_url(
        "postgresql://u:p@ep-x.neon.tech/neondb?sslmode=require&channel_binding=require"
    )
    assert url == "postgresql+asyncpg://u:p@ep-x.neon.tech/neondb"
    assert args["ssl"].verify_mode == ssl.CERT_REQUIRED and args["ssl"].check_hostname


def test_prefixo_postgres_do_render():
    url, args = normalizar_url("postgres://u:p@host/db")
    assert url == "postgresql+asyncpg://u:p@host/db" and args == {}


def test_url_sqlite_com_caminho_absoluto_fica_intacta():
    """Regressão: urlunsplit transformava 'sqlite+aiosqlite:///C:/x.db' em 'sqlite+aiosqlite:/C:/x.db'."""
    assert normalizar_url("sqlite+aiosqlite:///C:/dados/x.db") == (
        "sqlite+aiosqlite:///C:/dados/x.db",
        {},
    )


def test_sem_url_usa_sqlite_local():
    assert normalizar_url("") == ("sqlite+aiosqlite:///./treinoapp.db", {})
