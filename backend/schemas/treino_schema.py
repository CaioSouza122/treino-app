from pydantic import BaseModel
from typing import Optional

class TreinoRequest(BaseModel):
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
                "altura": 1.75,
                "peso": 80,
                "idade": 28,
                "vezes_por_semana": 4,
                "objetivo": "emagrecimento e hipertrofia",
                "tempo": 30,
                "nivel": "intermediario"
            }
        }