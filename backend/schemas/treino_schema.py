import unicodedata
from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

NIVEIS = ("iniciante", "intermediario", "avancado")


class TreinoRequest(BaseModel):
    # Limites iguais aos da API_Treino, que recusa valores fora deles.
    # O dono do treino vem do token de login, não do corpo.
    altura: float = Field(ge=1, le=250)
    peso: float = Field(ge=20, le=400)
    idade: int = Field(ge=10, le=100)
    vezes_por_semana: int = Field(ge=1, le=7)
    objetivo: str = Field(min_length=3, max_length=255)
    tempo: int = Field(ge=10, le=300)  # Tempo em minutos por treino
    nivel: str | None = "intermediario"

    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "altura": 175,
                "peso": 80,
                "idade": 28,
                "vezes_por_semana": 4,
                "objetivo": "emagrecimento e hipertrofia",
                "tempo": 30,
                "nivel": "intermediario",
            }
        },
    )

    @field_validator("nivel")
    @classmethod
    def normalizar_nivel(cls, valor: str | None) -> str:
        """O app aceita texto livre ("Avançado"); a API de IA só aceita os três valores sem acento."""
        texto = (
            unicodedata.normalize("NFKD", valor or "")
            .encode("ascii", "ignore")
            .decode()
            .lower()
            .strip()
        )
        return next((nivel for nivel in NIVEIS if texto.startswith(nivel[:5])), "intermediario")


class WorkoutDayResponse(BaseModel):
    dia: str
    foco: str
    exercicios: str

    model_config = ConfigDict(from_attributes=True)


class WorkoutResponse(BaseModel):
    id: str
    user_id: str
    created_at: datetime
    fonte: str = "ia"
    days: list[WorkoutDayResponse]

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at")
    def serializar_utc(self, valor: datetime) -> str:
        """O banco guarda UTC sem fuso; sem o "Z" o celular lê como hora local e erra o dia."""
        if valor.tzinfo is None:
            valor = valor.replace(tzinfo=UTC)
        return valor.isoformat().replace("+00:00", "Z")
