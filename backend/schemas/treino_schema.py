from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class Mensagem(BaseModel):
    papel: Literal["usuario", "ia"]
    texto: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    # O app manda a conversa inteira; o backend usa só as últimas mensagens
    mensagens: list[Mensagem] = Field(min_length=1, max_length=200)


class ChatResponse(BaseModel):
    resposta: str
    # Presente quando a resposta trouxe um plano de treino, já salvo no histórico
    treino_id: str | None = None


class WorkoutDayResponse(BaseModel):
    dia: str
    foco: str
    exercicios: str

    model_config = ConfigDict(from_attributes=True)


class WorkoutResponse(BaseModel):
    id: str
    user_id: str
    created_at: datetime
    days: list[WorkoutDayResponse]

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at")
    def serializar_utc(self, valor: datetime) -> str:
        """O banco guarda UTC sem fuso; sem o "Z" o celular lê como hora local e erra o dia."""
        if valor.tzinfo is None:
            valor = valor.replace(tzinfo=UTC)
        return valor.isoformat().replace("+00:00", "Z")
