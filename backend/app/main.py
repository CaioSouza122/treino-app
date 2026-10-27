import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi import BackgroundTasks, FastAPI
from fastapi.middleware.cors import CORSMiddleware

import models.user  # noqa: F401 — garante que os modelos são importados
from database.connection import engine
from routes import auth, treino
from services.ia_service import acordar_api_ia

_BACKEND = Path(__file__).resolve().parent.parent


def aplicar_migrations() -> None:
    """
    Leva o banco até a última migration. O create_all antigo só criava tabelas novas e
    nunca adicionava colunas: um banco anterior à 0003 ficava sem app_treinos.fonte e
    todo treino gerado falhava ao salvar. As migrations são idempotentes.
    """
    config = Config(str(_BACKEND / "alembic.ini"))
    config.set_main_option("script_location", str(_BACKEND / "migrations"))
    command.upgrade(config, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação (startup / shutdown)."""
    # ── Startup ──────────────────────────────────────────────────────────────
    try:
        # O env.py do Alembic roda o próprio event loop: fica numa thread separada
        await asyncio.to_thread(aplicar_migrations)
        print("[OK] Banco de dados atualizado (migrations aplicadas).")
    except Exception as e:
        print(f"[ERRO] Erro ao inicializar o banco de dados: {e}")

    yield  # A aplicação roda aqui

    # ── Shutdown ─────────────────────────────────────────────────────────────
    await engine.dispose()


app = FastAPI(
    title="HIPERTROF.IA — API",
    description="Backend de geração de treinos personalizados com Inteligência Artificial.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Origens separadas por vírgula (ex: https://hipertrofia.onrender.com).
# Só o app web precisa disso; o app nativo não passa por CORS.
ORIGENS_PADRAO = "http://localhost:8081,http://127.0.0.1:8081"
origens_permitidas = [
    origem.strip()
    for origem in os.getenv("ALLOWED_ORIGINS", ORIGENS_PADRAO).split(",")
    if origem.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origens_permitidas,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    # O app web lê o motivo da reserva na resposta de /gerar-treino-ia
    expose_headers=["X-Motivo-Reserva"],
)

app.include_router(auth.router)
app.include_router(treino.router)


@app.get("/", tags=["Health"])
def home():
    """Verifica se a API está online."""
    return {"status": "ok", "message": "HIPERTROF.IA API funcionando corretamente"}


@app.get("/acordar", tags=["Health"])
async def acordar(tarefas: BackgroundTasks):
    """
    O app chama ao abrir: este backend já acordou para responder, e a API de IA acorda em
    segundo plano. Responde na hora, sem esperar a IA.
    """
    tarefas.add_task(acordar_api_ia)
    return {"status": "ok"}
