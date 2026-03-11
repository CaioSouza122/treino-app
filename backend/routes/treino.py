from fastapi import APIRouter, HTTPException
from schemas.treino_schema import TreinoRequest
from services.ia_service import gerar_treino_ia

router = APIRouter()

@router.post("/gerar-treino-ia")
async def gerar_treino(dados: TreinoRequest):
    """
    Gera treino personalizado usando IA (com fallback automático)
    """
    try:
        resultado = gerar_treino_ia(dados)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))