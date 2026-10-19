"""Baseline: tabelas de usuários, treinos e dias de treino.

Idempotente: bancos que já tinham as tabelas (criadas pelo create_all antigo)
passam a ser versionados sem erro e sem perder dados.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-10-19
"""

import sqlalchemy as sa
from alembic import op

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def _existe(tabela: str) -> bool:
    return sa.inspect(op.get_bind()).has_table(tabela)


def upgrade() -> None:
    if not _existe("app_usuarios"):
        op.create_table(
            "app_usuarios",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("altura", sa.Float(), nullable=False),
            sa.Column("peso", sa.Float(), nullable=False),
            sa.Column("idade", sa.Integer(), nullable=False),
            sa.Column("vezes_por_semana", sa.Integer(), nullable=False),
            sa.Column("objetivo", sa.String(), nullable=False),
            sa.Column("nivel", sa.String(), nullable=True),
            sa.Column("tempo", sa.Integer(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
    if not _existe("app_treinos"):
        op.create_table(
            "app_treinos",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column(
                "user_id",
                sa.String(),
                sa.ForeignKey("app_usuarios.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("created_at", sa.DateTime(), nullable=True),
        )
    if not _existe("app_treino_dias"):
        op.create_table(
            "app_treino_dias",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column(
                "workout_id",
                sa.String(),
                sa.ForeignKey("app_treinos.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("dia", sa.String(), nullable=False),
            sa.Column("foco", sa.String(), nullable=False),
            sa.Column("exercicios", sa.String(), nullable=False),
        )


def downgrade() -> None:
    op.drop_table("app_treino_dias")
    op.drop_table("app_treinos")
    op.drop_table("app_usuarios")
