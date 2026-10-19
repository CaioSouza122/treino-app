"""Origem de cada treino: "ia" ou "reserva".

Revision ID: 0003_fonte_do_treino
Revises: 0002_contas
Create Date: 2026-10-19
"""

import sqlalchemy as sa
from alembic import op

revision = "0003_fonte_do_treino"
down_revision = "0002_contas"
branch_labels = None
depends_on = None


def upgrade() -> None:
    colunas = {c["name"] for c in sa.inspect(op.get_bind()).get_columns("app_treinos")}
    if "fonte" in colunas:
        return
    # Treinos antigos não têm essa informação: ficam como "ia", o que o app já mostrava
    with op.batch_alter_table("app_treinos") as tabela:
        tabela.add_column(
            sa.Column("fonte", sa.String(length=20), nullable=False, server_default="ia")
        )


def downgrade() -> None:
    with op.batch_alter_table("app_treinos") as tabela:
        tabela.drop_column("fonte")
