"""Cadastro, login, token e isolamento do histórico entre contas."""

import pytest

from services import ia_service
from services.auth_service import criar_token, gerar_hash_senha, ler_token, verificar_senha
from tests.conftest import cadastrar, cliente

PERFIL = {
    "altura": 175,
    "peso": 80,
    "idade": 28,
    "vezes_por_semana": 3,
    "objetivo": "hipertrofia",
    "tempo": 60,
    "nivel": "intermediario",
}


@pytest.fixture(autouse=True)
def api_externa_offline(monkeypatch):
    async def offline(dados):
        return None

    monkeypatch.setattr(ia_service, "_chamar_api_externa", offline)


def test_hash_de_senha_confere_e_nao_guarda_a_senha():
    senha_hash = gerar_hash_senha("minha-senha-123")
    assert "minha-senha-123" not in senha_hash
    assert verificar_senha("minha-senha-123", senha_hash)
    assert not verificar_senha("outra-senha", senha_hash)
    assert gerar_hash_senha("minha-senha-123") != senha_hash  # sal diferente a cada hash


def test_token_valido_e_token_adulterado():
    token = criar_token("conta-1")
    assert ler_token(token) == "conta-1"
    assert ler_token(token[:-2] + "xx") is None
    assert ler_token("lixo") is None


@pytest.mark.asyncio
async def test_cadastro_login_e_me():
    async with cliente() as c:
        cadastro = await c.post(
            "/auth/cadastro",
            json={"nome": "  Ana   Souza ", "email": "Ana@Teste.com", "senha": "senha-forte-1"},
        )
        assert cadastro.status_code == 201
        assert cadastro.json()["usuario"] == {
            "id": cadastro.json()["usuario"]["id"],
            "nome": "Ana Souza",
            "email": "ana@teste.com",
        }

        login = await c.post(
            "/auth/login", json={"email": "ANA@teste.com", "senha": "senha-forte-1"}
        )
        assert login.status_code == 200
        me = await c.get("/auth/me", headers={"Authorization": f"Bearer {login.json()['token']}"})
    assert me.status_code == 200 and me.json()["email"] == "ana@teste.com"


@pytest.mark.asyncio
async def test_senha_errada_e_email_inexistente_dao_a_mesma_resposta():
    async with cliente() as c:
        await cadastrar(c, email="bia@teste.com")
        errada = await c.post("/auth/login", json={"email": "bia@teste.com", "senha": "errada-123"})
        inexistente = await c.post(
            "/auth/login", json={"email": "ninguem@teste.com", "senha": "errada-123"}
        )
    assert errada.status_code == inexistente.status_code == 401
    assert errada.json() == inexistente.json()  # não revela quais e-mails têm conta


@pytest.mark.asyncio
async def test_email_duplicado_retorna_409():
    async with cliente() as c:
        await cadastrar(c, email="caio@teste.com")
        de_novo = await c.post(
            "/auth/cadastro",
            json={"nome": "Outro", "email": "CAIO@teste.com", "senha": "senha-forte-2"},
        )
    assert de_novo.status_code == 409


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "corpo",
    [
        {"nome": "Ana", "email": "sem-arroba", "senha": "senha-forte-1"},
        {"nome": "Ana", "email": "a@b.com", "senha": "curta"},
        {"nome": " ", "email": "a@b.com", "senha": "senha-forte-1"},
    ],
)
async def test_cadastro_invalido_retorna_422(corpo):
    async with cliente() as c:
        resposta = await c.post("/auth/cadastro", json=corpo)
    assert resposta.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "headers", [{}, {"Authorization": "Bearer invalido"}, {"Authorization": "x"}]
)
async def test_rotas_de_treino_exigem_login(headers):
    async with cliente() as c:
        gerar = await c.post("/gerar-treino-ia", json=PERFIL, headers=headers)
        historico = await c.get("/historico", headers=headers)
    assert gerar.status_code == historico.status_code == 401


@pytest.mark.asyncio
async def test_historico_e_separado_por_conta():
    async with cliente() as c:
        conta_a = await cadastrar(c)
        conta_b = await cadastrar(c)
        assert (await c.post("/gerar-treino-ia", json=PERFIL, headers=conta_a)).status_code == 200
        historico_a = (await c.get("/historico", headers=conta_a)).json()
        historico_b = (await c.get("/historico", headers=conta_b)).json()
    assert len(historico_a) == 1
    assert historico_b == []


@pytest.mark.asyncio
async def test_muitas_tentativas_de_login_sao_bloqueadas():
    async with cliente() as c:
        status = [
            (
                await c.post("/auth/login", json={"email": "x@teste.com", "senha": "chute-123"})
            ).status_code
            for _ in range(11)
        ]
    assert status[:10] == [401] * 10
    assert status[10] == 429
