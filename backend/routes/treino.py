from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession
try:
    from sqlalchemy import select
except ImportError:
    from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from database.connection import get_db
from schemas.treino_schema import TreinoRequest, WorkoutResponse
from services.ia_service import gerar_treino_ia, testar_conexao_flask
from models.user import User, Workout, WorkoutDay
from typing import List, Optional
import uuid

router = APIRouter()

@router.get("/testar-api-flask")
async def testar_api_flask(x_treino_key: Optional[str] = Header(None)):
    """
    Diagnóstico: testa a conexão com a API Flask externa e retorna o resultado detalhado.
    Acesse http://localhost:8000/testar-api-flask no navegador para verificar.
    """
    resultado = await testar_conexao_flask(api_key_override=x_treino_key)
    return resultado


@router.post("/gerar-treino-ia")
async def gerar_treino(
    dados: TreinoRequest, 
    db: AsyncSession = Depends(get_db),
    x_treino_key: Optional[str] = Header(None)
):
    """
    Gera treino personalizado usando IA (com fallback automático) e salva no banco de dados.
    """
    # 1. Gera o treino via IA ou fallback local
    try:
        resultado = gerar_treino_ia(dados, api_key_override=x_treino_key)
        if not resultado:
            raise HTTPException(status_code=500, detail="Não foi possível gerar o treino")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # 2. Tenta salvar no PostgreSQL de forma resiliente
    try:
        user_id = dados.user_id or str(uuid.uuid4())
        
        # Busca se o usuário já existe
        result = await db.execute(select(User).where(User.id == user_id))
        usuario = result.scalar_one_or_none()

        if usuario:
            # Atualiza os dados físicos do usuário
            usuario.altura = dados.altura
            usuario.peso = dados.peso
            usuario.idade = dados.idade
            usuario.vezes_por_semana = dados.vezes_por_semana
            usuario.objetivo = dados.objetivo
            usuario.nivel = dados.nivel or "intermediario"
            usuario.tempo = dados.tempo
        else:
            # Cria novo usuário
            usuario = User(
                id=user_id,
                altura=dados.altura,
                peso=dados.peso,
                idade=dados.idade,
                vezes_por_semana=dados.vezes_por_semana,
                objetivo=dados.objetivo,
                nivel=dados.nivel or "intermediario",
                tempo=dados.tempo
            )
            db.add(usuario)
            await db.flush()

        # Cria a sessão de Treino
        novo_treino = Workout(user_id=usuario.id)
        db.add(novo_treino)
        await db.flush()

        # Salva cada dia do treino
        for dia_treino in resultado:
            db_dia = WorkoutDay(
                workout_id=novo_treino.id,
                dia=dia_treino.get("dia", "Treino"),
                foco=dia_treino.get("foco", "Geral"),
                exercicios=dia_treino.get("exercicios", "")
            )
            db.add(db_dia)
        
        await db.commit()
    except Exception as db_err:
        print(f"⚠️ Erro ao salvar treino no banco de dados: {db_err}")
        try:
            await db.rollback()
        except:
            pass

    return resultado

@router.get("/historico/{user_id}", response_model=List[WorkoutResponse])
async def obter_historico(user_id: str, db: AsyncSession = Depends(get_db)):
    """
    Recupera o histórico de treinos do usuário ordenado por data de criação decrescente.
    """
    try:
        result = await db.execute(
            select(Workout)
            .where(Workout.user_id == user_id)
            .options(selectinload(Workout.days))
            .order_by(Workout.created_at.desc())
        )
        treinos = result.scalars().all()
        return treinos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar histórico: {str(e)}")