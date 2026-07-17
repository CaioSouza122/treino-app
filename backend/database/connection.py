import os
import ssl
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")

# Configurações extras de conexão (connect_args)
connect_args = {}

# Garante que o driver asyncpg é usado para PostgreSQL e trata o SSL corretamente
if DATABASE_URL:
    # Normaliza o prefixo da URL para asyncpg
    if DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

    # O asyncpg não aceita '?sslmode=require' na URL — remove e configura via connect_args
    if "sslmode=require" in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("?sslmode=require", "").replace("&sslmode=require", "")
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE
        connect_args["ssl"] = ssl_ctx

else:
    # Fallback SQLite para desenvolvimento local sem banco configurado
    DATABASE_URL = "sqlite+aiosqlite:///./treinoapp.db"

# Cria o engine assíncrono
engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

# Dependência do FastAPI para obter a sessão do BD
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
