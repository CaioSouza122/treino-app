"""Perfil físico opcional: o treino agora nasce no chat, sem formulário de perfil.

Revision ID: 0005_perfil_opcional
Revises: 0004_motivo_da_reserva
Create Date: 2026-11-26
"""

import sqlalchemy as sa
from alembic import op

revision = "0005_perfil_opcional"
down_revision = "0004_motivo_da_reserva"
branch_labels = None
depends_on = None

_COLUNAS = {
    "altura": sa.Float(),
    "peso": sa.Float(),
    "idade": sa.Integer(),
    "vezes_por_semana": sa.Integer(),
    "objetivo": sa.String(),
}


def upgrade() -> None:
    with op.batch_alter_table("app_usuarios") as tabela:
        for nome, tipo in _COLUNAS.items():
            tabela.alter_column(nome, existing_type=tipo, nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("app_usuarios") as tabela:
        for nome, tipo in _COLUNAS.items():
            tabela.alter_column(nome, existing_type=tipo, nullable=False)
