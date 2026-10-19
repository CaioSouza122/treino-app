import time
import uuid
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.connection import get_db
from models.user import User, Workout, WorkoutDay
from schemas.treino_schema import TreinoRequest, WorkoutResponse
from services.ia_service import gerar_treino_ia

router = APIRouter()

# ── Limite de geração por cliente ────────────────────────────────────────────
# Cada geração custa uma chamada ao Gemini; sem limite, um único cliente esgota a cota
# da API de IA para todos os usuários.
# shortcut: contador em memória, por processo. Serve para 1 instância no Render;
# com várias instâncias, mover para Redis.
LIMITE_GERACOES = 5
JANELA_SEGUNDOS = 60
_geracoes_por_cliente: dict[str, deque] = defaultdict(deque)


def _verificar_limite(request: Request) -> None:
    cliente = request.client.host if request.client else "desconhecido"
    agora = time.monotonic()
    historico = _geracoes_por_cliente[cliente]
    while historico and agora - historico[0] > JANELA_SEGUNDOS:
        historico.popleft()
    if len(historico) >= LIMITE_GERACOES:
        raise HTTPException(
            status_code=429,
            detail="Muitos treinos gerados em pouco tempo. Aguarde um minuto e tente de novo.",
        )
    historico.append(agora)
    # Não deixa o dicionário crescer com clientes que já pararam de usar
    if len(_geracoes_por_cliente) > 10_000:
        for chave in [
            c for c, h in _geracoes_por_cliente.items() if not h or agora - h[-1] > JANELA_SEGUNDOS
        ]:
            del _geracoes_por_cliente[chave]


@router.post("/gerar-treino-ia")
async def gerar_treino(dados: TreinoRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """
    Gera treino personalizado usando IA (com fallback automático) e salva no banco de dados.
    """
    _verificar_limite(request)

    # 1. Gera o treino via IA ou fallback local
    try:
        resultado = await gerar_treino_ia(dados)
    except Exception as e:
        print(f"[ERRO] Falha ao gerar treino: {type(e).__name__}: {e}")
        resultado = None
    if not resultado:
        raise HTTPException(
            status_code=500, detail="Não foi possível gerar o treino. Tente novamente."
        )

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
            usuario.nivel = dados.nivel
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
                nivel=dados.nivel,
                tempo=dados.tempo,
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
                exercicios=dia_treino.get("exercicios", ""),
            )
            db.add(db_dia)

        await db.commit()
    except Exception as db_err:
        print(f"[WARN] Erro ao salvar treino no banco de dados: {db_err}")
        try:
            await db.rollback()
        except Exception:
            pass

    return resultado


@router.get("/historico/{user_id}", response_model=list[WorkoutResponse])
async def obter_historico(user_id: str, db: AsyncSession = Depends(get_db)):
    """
    Recupera os 50 treinos mais recentes do usuário, do mais novo para o mais antigo.
    """
    try:
        result = await db.execute(
            select(Workout)
            .where(Workout.user_id == user_id)
            .options(selectinload(Workout.days))
            .order_by(Workout.created_at.desc())
            .limit(50)
        )
        return result.scalars().all()
    except Exception as e:
        print(f"[ERRO] Falha ao buscar histórico: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar o histórico.") from None
