"""Por que um treino veio da reserva (ex.: api_com_limite_de_uso_http_429).

Revision ID: 0004_motivo_da_reserva
Revises: 0003_fonte_do_treino
Create Date: 2026-11-12
"""

import sqlalchemy as sa
from alembic import op

revision = "0004_motivo_da_reserva"
down_revision = "0003_fonte_do_treino"
branch_labels = None
depends_on = None


def upgrade() -> None:
    colunas = {c["name"] for c in sa.inspect(op.get_bind()).get_columns("app_treinos")}
    if "motivo" in colunas:
        return
    with op.batch_alter_table("app_treinos") as tabela:
        tabela.add_column(sa.Column("motivo", sa.String(length=200), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("app_treinos") as tabela:
        tabela.drop_column("motivo")
