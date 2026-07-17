from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TreinoRequest(BaseModel):
    user_id: Optional[str] = None  # Opcional, gerado pelo app
    altura: float
    peso: float
    idade: int
    vezes_por_semana: int
    objetivo: str
    tempo: int  # Tempo em minutos por treino
    nivel: Optional[str] = "intermediario"
    
    class Config:
        json_schema_extra = {
            "example": {
                "user_id": "abc-123-uuid",
                "altura": 1.75,
                "peso": 80,
                "idade": 28,
                "vezes_por_semana": 4,
                "objetivo": "emagrecimento e hipertrofia",
                "tempo": 30,
                "nivel": "intermediario"
            }
        }

class WorkoutDayResponse(BaseModel):
    dia: str
    foco: str
    exercicios: str

    class Config:
        from_attributes = True

class WorkoutResponse(BaseModel):
    id: str
    user_id: str
    created_at: datetime
    days: List[WorkoutDayResponse]

    class Config:
        from_attributes = True