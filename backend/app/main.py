from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import treino
from database.connection import engine, Base
import models.user  # noqa: F401 — garante que os modelos são importados


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação (startup / shutdown)."""
    # ── Startup ──────────────────────────────────────────────────────────────
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[OK] Tabelas de banco de dados verificadas/criadas com sucesso!")
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(treino.router)


@app.get("/", tags=["Health"])
def home():
    """Verifica se a API está online."""
    return {"status": "ok", "message": "HIPERTROF.IA API funcionando corretamente"}