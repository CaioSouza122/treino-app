"""Startup leva bancos antigos até a última migration."""

import sqlite3

from app.main import aplicar_migrations
from tests.conftest import _db


def _colunas_treinos() -> set[str]:
    with sqlite3.connect(_db) as conexao:
        return {linha[1] for linha in conexao.execute("PRAGMA table_info(app_treinos)")}


def test_banco_sem_coluna_fonte_recebe_a_coluna_no_startup():
    # Banco criado antes da 0003 (pelo create_all antigo): sem fonte, todo treino falhava ao salvar
    with sqlite3.connect(_db) as conexao:
        conexao.execute("ALTER TABLE app_treinos DROP COLUMN fonte")
    assert "fonte" not in _colunas_treinos()

    aplicar_migrations()

    assert "fonte" in _colunas_treinos()


def test_migrations_podem_rodar_de_novo_sem_erro():
    aplicar_migrations()
    aplicar_migrations()
    assert "fonte" in _colunas_treinos()
