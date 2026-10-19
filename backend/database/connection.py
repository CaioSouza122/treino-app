import os
import ssl
from urllib.parse import parse_qs, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

# Carrega variáveis de ambiente
load_dotenv()


def normalizar_url(url: str) -> tuple[str, dict]:
    """Converte DATABASE_URL para o driver async e devolve (url, connect_args)."""
    if not url:
        # Fallback SQLite para desenvolvimento local sem banco configurado
        return "sqlite+aiosqlite:///./treinoapp.db", {}

    # Normaliza o prefixo da URL para asyncpg
    for prefixo in ("postgresql://", "postgres://"):
        if url.startswith(prefixo):
            url = "postgresql+asyncpg://" + url[len(prefixo) :]

    # Só para Postgres: urlunsplit encurta 'sqlite:///C:/...' para 'sqlite:/C:/...'
    if not url.startswith("postgresql+asyncpg://"):
        return url, {}

    # O asyncpg não aceita 'sslmode' nem 'channel_binding' (que o Neon põe na URL):
    # remove da query string e liga o SSL via connect_args, verificando o certificado.
    partes = urlsplit(url)
    query = parse_qs(partes.query)
    sslmode = query.pop("sslmode", [None])[0]
    query.pop("channel_binding", None)
    url = urlunsplit(partes._replace(query=urlencode(query, doseq=True)))
    args = {"ssl": ssl.create_default_context()} if sslmode and sslmode != "disable" else {}
    return url, args


DATABASE_URL, connect_args = normalizar_url(os.getenv("DATABASE_URL", ""))

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
