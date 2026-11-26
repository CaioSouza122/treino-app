from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.connection import get_db
from models.user import Conta, User, Workout, WorkoutDay
from routes.auth import conta_atual
from schemas.treino_schema import ChatRequest, ChatResponse, WorkoutResponse
from services.ia import IAIndisponivel, conversar, extrair_treino
from services.limite import LimitePorCliente

router = APIRouter()

# Cada mensagem custa uma chamada ao Gemini; sem limite, uma conta esgota a cota de todos
limite_geracoes = LimitePorCliente(
    limite=10,
    janela=60,
    mensagem="Muitas mensagens em pouco tempo. Aguarde um minuto e tente de novo.",
)
# Contexto enviado ao Gemini: as últimas mensagens bastam e mantêm a chamada rápida
CONTEXTO = 20


@router.post("/chat", response_model=ChatResponse)
async def chat(
    dados: ChatRequest,
    request: Request,
    conta: Conta = Depends(conta_atual),
    db: AsyncSession = Depends(get_db),
):
    """Conversa com o Coach IA. Quando a resposta traz um plano, ele é salvo no histórico."""
    limite_geracoes(request, chave=conta.id)
    mensagens = [m.model_dump() for m in dados.mensagens[-CONTEXTO:]]
    # O Gemini exige que a conversa comece pelo usuário (a saudação do app é da IA)
    while mensagens and mensagens[0]["papel"] != "usuario":
        mensagens.pop(0)
    if not mensagens:
        raise HTTPException(status_code=422, detail="Envie uma mensagem.")
    try:
        resposta = await conversar(mensagens)
    except IAIndisponivel as e:
        print(f"[WARN] Coach IA indisponível: {e.motivo}")
        raise HTTPException(
            status_code=503,
            detail="Estou sobrecarregado agora. Tente de novo em 1 minuto.",
        ) from None

    dias = extrair_treino(resposta)
    if not dias:
        return ChatResponse(resposta=resposta)

    try:
        # Treino sem perfil físico: a tabela de treinos ainda aponta para app_usuarios
        if await db.get(User, conta.id) is None:
            db.add(User(id=conta.id))
        treino = Workout(user_id=conta.id, fonte="ia")
        db.add(treino)
        await db.flush()
        db.add_all(WorkoutDay(workout_id=treino.id, **dia) for dia in dias)
        await db.commit()
    except Exception as e:
        # A pessoa não perde a resposta; sem treino_id o app não mostra o botão de abrir
        print(f"[ERRO] Treino do chat não foi salvo: {type(e).__name__}: {e}")
        await db.rollback()
        return ChatResponse(resposta=resposta)
    return ChatResponse(resposta=resposta, treino_id=treino.id)


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
