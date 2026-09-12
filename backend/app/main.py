from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import treino
from database.connection import engine, Base
import models.user  # Garante que os modelos são importados para serem criados

app = FastAPI()

# Configuração CORS
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

@app.on_event("startup")
async def startup():
    # Cria as tabelas de forma assíncrona se não existirem
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[OK] Tabelas de banco de dados verificadas/criadas com sucesso!")
    except Exception as e:
        print(f"[ERRO] Erro ao inicializar o banco de dados: {e}")

app.include_router(treino.router)

@app.get("/")
def home():
    return {"message": "API funcionando corretamente"}