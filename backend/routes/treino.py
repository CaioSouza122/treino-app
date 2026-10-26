from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.connection import get_db
from models.user import Conta, User, Workout, WorkoutDay
from routes.auth import conta_atual
from schemas.treino_schema import TreinoRequest, WorkoutResponse
from services.ia_service import gerar_treino_ia, motivo_reserva
from services.limite import LimitePorCliente

router = APIRouter()

# Cada geração custa uma chamada ao Gemini; sem limite, uma única conta esgota a cota
# da API de IA para todos os usuários.
limite_geracoes = LimitePorCliente(
    limite=5,
    janela=60,
    mensagem="Muitos treinos gerados em pouco tempo. Aguarde um minuto e tente de novo.",
)


async def _gravar_perfil(db: AsyncSession, user_id: str, dados: TreinoRequest) -> User:
    """Cria ou atualiza os dados físicos da conta (sem commit)."""
    result = await db.execute(select(User).where(User.id == user_id))
    usuario = result.scalar_one_or_none()
    if usuario is None:
        usuario = User(id=user_id)
        db.add(usuario)
    usuario.altura = dados.altura
    usuario.peso = dados.peso
    usuario.idade = dados.idade
    usuario.vezes_por_semana = dados.vezes_por_semana
    usuario.objetivo = dados.objetivo
    usuario.nivel = dados.nivel
    usuario.tempo = dados.tempo
    await db.flush()
    return usuario


@router.get("/perfil", response_model=TreinoRequest | None)
async def obter_perfil(conta: Conta = Depends(conta_atual), db: AsyncSession = Depends(get_db)):
    """
    Perfil de treino guardado na conta (altura, peso, objetivo...), ou null se ainda não há.
    Assim os dados sobrevivem a desinstalar o app ou entrar em outro celular.
    """
    result = await db.execute(select(User).where(User.id == conta.id))
    usuario = result.scalar_one_or_none()
    if usuario is None:
        return None
    try:
        return TreinoRequest(
            altura=usuario.altura,
            peso=usuario.peso,
            idade=usuario.idade,
            vezes_por_semana=usuario.vezes_por_semana,
            objetivo=usuario.objetivo,
            tempo=usuario.tempo or 30,
            nivel=usuario.nivel,
        )
    except ValidationError:
        # Linha antiga, de antes dos limites atuais: o app volta a pedir os dados
        return None


@router.put("/perfil", status_code=204)
async def salvar_perfil(
    dados: TreinoRequest,
    conta: Conta = Depends(conta_atual),
    db: AsyncSession = Depends(get_db),
):
    """Guarda o perfil de treino na conta, sem gerar treino."""
    await _gravar_perfil(db, conta.id, dados)
    await db.commit()


@router.post("/gerar-treino-ia")
async def gerar_treino(
    dados: TreinoRequest,
    request: Request,
    response: Response,
    conta: Conta = Depends(conta_atual),
    db: AsyncSession = Depends(get_db),
):
    """
    Gera treino personalizado usando IA (com fallback automático) e salva no banco de dados.
    """
    limite_geracoes(request, chave=conta.id)

    # 1. Gera o treino via IA ou fallback local
    try:
        resultado, fonte = await gerar_treino_ia(dados)
    except Exception as e:
        print(f"[ERRO] Falha ao gerar treino: {type(e).__name__}: {e}")
        resultado = None
    if not resultado:
        raise HTTPException(
            status_code=500, detail="Não foi possível gerar o treino. Tente novamente."
        )
    if fonte == "reserva":
        # Só um código (ex.: api_recusou_a_chave_http_401): diagnostica a produção sem o log
        response.headers["X-Motivo-Reserva"] = motivo_reserva.get() or "desconhecido"

    # 2. Tenta salvar no PostgreSQL de forma resiliente
    try:
        # O dono do treino vem do token, nunca do corpo da requisição
        usuario = await _gravar_perfil(db, conta.id, dados)

        # Cria a sessão de Treino
        novo_treino = Workout(user_id=usuario.id, fonte=fonte)
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


@router.get("/historico", response_model=list[WorkoutResponse])
async def obter_historico(conta: Conta = Depends(conta_atual), db: AsyncSession = Depends(get_db)):
    """
    Recupera os 50 treinos mais recentes da conta logada, do mais novo para o mais antigo.
    """
    try:
        result = await db.execute(
            select(Workout)
            .where(Workout.user_id == conta.id)
            .options(selectinload(Workout.days))
            .order_by(Workout.created_at.desc())
            .limit(50)
        )
        return result.scalars().all()
    except Exception as e:
        print(f"[ERRO] Falha ao buscar histórico: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar o histórico.") from None
