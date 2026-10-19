from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from database.connection import get_db
from models.user import Conta, User, Workout, WorkoutDay
from schemas.auth_schema import (
    AtualizarContaRequest,
    CadastroRequest,
    ExcluirContaRequest,
    LoginRequest,
    SessaoResponse,
    TrocarSenhaRequest,
    UsuarioResponse,
)
from services.auth_service import criar_token, gerar_hash_senha, ler_token, verificar_senha
from services.limite import LimitePorCliente

router = APIRouter(prefix="/auth", tags=["Autenticação"])

# Freia tentativas de adivinhar senhas (força bruta) e criação de contas em massa
limite_auth = LimitePorCliente(
    limite=10, janela=60, mensagem="Muitas tentativas. Aguarde um minuto e tente de novo."
)

# Hash de uma senha qualquer: login com e-mail inexistente gasta o mesmo tempo,
# para não revelar quais e-mails têm conta
_HASH_FALSO = gerar_hash_senha("senha-que-nao-existe")


def _sessao(conta: Conta) -> SessaoResponse:
    return SessaoResponse(
        token=criar_token(conta.id),
        usuario=UsuarioResponse(id=conta.id, nome=conta.nome, email=conta.email),
    )


async def conta_atual(
    authorization: str | None = Header(default=None), db: AsyncSession = Depends(get_db)
) -> Conta:
    """Dependência das rotas protegidas: exige 'Authorization: Bearer <token>' válido."""
    esquema, _, token = (authorization or "").partition(" ")
    conta_id = ler_token(token) if esquema.lower() == "bearer" and token else None
    conta = await db.get(Conta, conta_id) if conta_id else None
    if not conta:
        raise HTTPException(
            status_code=401,
            detail="Sessão expirada. Entre novamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return conta


@router.post("/cadastro", response_model=SessaoResponse, status_code=201)
async def cadastrar(dados: CadastroRequest, request: Request, db: AsyncSession = Depends(get_db)):
    limite_auth(request)
    conta = Conta(email=dados.email, nome=dados.nome, senha_hash=gerar_hash_senha(dados.senha))
    db.add(conta)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=409, detail="Já existe uma conta com este e-mail."
        ) from None
    return _sessao(conta)


@router.post("/login", response_model=SessaoResponse)
async def entrar(dados: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    limite_auth(request)
    resultado = await db.execute(select(Conta).where(Conta.email == dados.email))
    conta = resultado.scalar_one_or_none()
    senha_ok = verificar_senha(dados.senha, conta.senha_hash if conta else _HASH_FALSO)
    if not conta or not senha_ok:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")
    return _sessao(conta)


@router.get("/me", response_model=UsuarioResponse)
async def quem_sou_eu(conta: Conta = Depends(conta_atual)):
    return UsuarioResponse(id=conta.id, nome=conta.nome, email=conta.email)


def _conferir_senha(conta: Conta, senha: str) -> None:
    # 400 e não 401: o app trata 401 como sessão vencida e sairia da conta por um erro de digitação
    if not verificar_senha(senha, conta.senha_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta.")


@router.patch("/me", response_model=UsuarioResponse)
async def atualizar_conta(
    dados: AtualizarContaRequest,
    conta: Conta = Depends(conta_atual),
    db: AsyncSession = Depends(get_db),
):
    conta.nome = dados.nome
    await db.commit()
    return UsuarioResponse(id=conta.id, nome=conta.nome, email=conta.email)


@router.post("/senha", status_code=204)
async def trocar_senha(
    dados: TrocarSenhaRequest,
    request: Request,
    conta: Conta = Depends(conta_atual),
    db: AsyncSession = Depends(get_db),
):
    limite_auth(request)
    _conferir_senha(conta, dados.senha_atual)
    conta.senha_hash = gerar_hash_senha(dados.nova_senha)
    await db.commit()
    return Response(status_code=204)


@router.delete("/conta", status_code=204)
async def excluir_conta(
    dados: ExcluirContaRequest,
    request: Request,
    conta: Conta = Depends(conta_atual),
    db: AsyncSession = Depends(get_db),
):
    """Apaga a conta e tudo que pertence a ela (perfil, treinos e dias de treino)."""
    limite_auth(request)
    _conferir_senha(conta, dados.senha)
    treinos = select(Workout.id).where(Workout.user_id == conta.id)
    await db.execute(delete(WorkoutDay).where(WorkoutDay.workout_id.in_(treinos)))
    await db.execute(delete(Workout).where(Workout.user_id == conta.id))
    await db.execute(delete(User).where(User.id == conta.id))
    await db.execute(delete(Conta).where(Conta.id == conta.id))
    await db.commit()
    return Response(status_code=204)
