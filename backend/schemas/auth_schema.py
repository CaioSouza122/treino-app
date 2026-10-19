import re

from pydantic import BaseModel, Field, field_validator

# Validação simples de formato; a confirmação de que o e-mail existe fica para depois
_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalizar_email(valor: str) -> str:
    email = valor.strip().lower()
    if not _EMAIL.match(email):
        raise ValueError("E-mail inválido.")
    return email


def _limpar_nome(valor: str) -> str:
    nome = " ".join(valor.split())
    if len(nome) < 2:
        raise ValueError("Informe seu nome.")
    return nome


class LoginRequest(BaseModel):
    email: str = Field(max_length=255)
    senha: str = Field(min_length=1, max_length=128)

    _email = field_validator("email")(_normalizar_email)


class CadastroRequest(BaseModel):
    nome: str = Field(min_length=2, max_length=80)
    email: str = Field(max_length=255)
    senha: str = Field(min_length=8, max_length=128)

    _email = field_validator("email")(_normalizar_email)
    _nome = field_validator("nome")(_limpar_nome)


class UsuarioResponse(BaseModel):
    id: str
    nome: str
    email: str


class SessaoResponse(BaseModel):
    token: str
    usuario: UsuarioResponse


class AtualizarContaRequest(BaseModel):
    nome: str = Field(min_length=2, max_length=80)

    _nome = field_validator("nome")(_limpar_nome)


class TrocarSenhaRequest(BaseModel):
    senha_atual: str = Field(min_length=1, max_length=128)
    nova_senha: str = Field(min_length=8, max_length=128)


class ExcluirContaRequest(BaseModel):
    senha: str = Field(min_length=1, max_length=128)
