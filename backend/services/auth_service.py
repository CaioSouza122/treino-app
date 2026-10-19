"""Senhas (scrypt da biblioteca padrão) e tokens de sessão (JWT HS256)."""

import base64
import hashlib
import hmac
import os
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from dotenv import load_dotenv

load_dotenv()

# Sem JWT_SECRET (só em desenvolvimento) gera um segredo por processo: os tokens
# deixam de valer quando o servidor reinicia. Em produção o Render gera um valor fixo.
JWT_SECRET = os.getenv("JWT_SECRET") or secrets.token_urlsafe(32)
if not os.getenv("JWT_SECRET"):
    print("[WARN] JWT_SECRET não definido: usando um segredo temporário (só para desenvolvimento).")

JWT_ALGORITMO = "HS256"
VALIDADE_TOKEN = timedelta(days=30)

# Custo do scrypt (~16 MB de memória por hash): caro para força bruta, rápido para um login
_N, _R, _P = 2**14, 8, 1


def gerar_hash_senha(senha: str) -> str:
    sal = os.urandom(16)
    chave = hashlib.scrypt(senha.encode(), salt=sal, n=_N, r=_R, p=_P)
    return "scrypt$" + base64.b64encode(sal).decode() + "$" + base64.b64encode(chave).decode()


def verificar_senha(senha: str, senha_hash: str) -> bool:
    try:
        esquema, sal_b64, chave_b64 = senha_hash.split("$")
    except ValueError:
        return False
    if esquema != "scrypt":
        return False
    chave = hashlib.scrypt(senha.encode(), salt=base64.b64decode(sal_b64), n=_N, r=_R, p=_P)
    return hmac.compare_digest(chave, base64.b64decode(chave_b64))


def criar_token(conta_id: str) -> str:
    agora = datetime.now(UTC)
    payload = {"sub": conta_id, "iat": agora, "exp": agora + VALIDADE_TOKEN}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITMO)


def ler_token(token: str) -> str | None:
    """Devolve o id da conta, ou None se o token for inválido ou estiver vencido."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITMO])
    except jwt.PyJWTError:
        return None
    sub = payload.get("sub")
    return sub if isinstance(sub, str) else None
