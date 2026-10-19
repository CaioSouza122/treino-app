"""Contas de login (e-mail + hash de senha).

Revision ID: 0002_contas
Revises: 0001_baseline
Create Date: 2026-10-19
"""

import sqlalchemy as sa
from alembic import op

revision = "0002_contas"
down_revision = "0001_baseline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Idempotente como a baseline: o create_all do startup pode ter criado a tabela antes
    if sa.inspect(op.get_bind()).has_table("app_contas"):
        return
    op.create_table(
        "app_contas",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("nome", sa.String(length=80), nullable=False),
        sa.Column("senha_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_app_contas_email", "app_contas", ["email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_app_contas_email", table_name="app_contas")
    op.drop_table("app_contas")
