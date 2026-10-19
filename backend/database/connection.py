import os
import ssl
from urllib.parse import parse_qs, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

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

    # O asyncpg não aceita 'sslmode' nem 'channel_binding' (que o Neon põe na URL):
    # remove da query string e liga o SSL via connect_args, verificando o certificado.
    partes = urlsplit(DATABASE_URL)
    query = parse_qs(partes.query)
    sslmode = query.pop("sslmode", [None])[0]
    query.pop("channel_binding", None)
    DATABASE_URL = urlunsplit(partes._replace(query=urlencode(query, doseq=True)))
    if sslmode and sslmode != "disable":
        connect_args["ssl"] = ssl.create_default_context()

else:
    # Fallback SQLite para desenvolvimento local sem banco configurado
    DATABASE_URL = "sqlite+aiosqlite:///./treinoapp.db"

# Cria o engine assíncrono
engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True,
    # O Neon fecha conexões ociosas: testa cada conexão do pool antes de reutilizar
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

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
