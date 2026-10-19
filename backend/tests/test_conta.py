"""Configurações da conta: editar nome, trocar senha e excluir conta."""

import pytest

from services import ia_service
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
SENHA = "senha-forte-123"


@pytest.fixture(autouse=True)
def api_externa_offline(monkeypatch):
    async def offline(dados):
        return None

    monkeypatch.setattr(ia_service, "_chamar_api_externa", offline)


@pytest.mark.asyncio
async def test_editar_nome():
    async with cliente() as c:
        headers = await cadastrar(c)
        resposta = await c.patch("/auth/me", json={"nome": "  Novo   Nome "}, headers=headers)
        me = await c.get("/auth/me", headers=headers)
    assert resposta.status_code == 200 and resposta.json()["nome"] == "Novo Nome"
    assert me.json()["nome"] == "Novo Nome"


@pytest.mark.asyncio
async def test_trocar_senha_exige_a_senha_atual():
    async with cliente() as c:
        headers = await cadastrar(c, email="troca@teste.com", senha=SENHA)
        errada = await c.post(
            "/auth/senha",
            json={"senha_atual": "errada-123", "nova_senha": "nova-senha-456"},
            headers=headers,
        )
        certa = await c.post(
            "/auth/senha",
            json={"senha_atual": SENHA, "nova_senha": "nova-senha-456"},
            headers=headers,
        )
        login_antigo = await c.post(
            "/auth/login", json={"email": "troca@teste.com", "senha": SENHA}
        )
        login_novo = await c.post(
            "/auth/login", json={"email": "troca@teste.com", "senha": "nova-senha-456"}
        )
    # 400 e não 401: um 401 faria o app encerrar a sessão por causa de um erro de digitação
    assert errada.status_code == 400
    assert certa.status_code == 204
    assert login_antigo.status_code == 401
    assert login_novo.status_code == 200


@pytest.mark.asyncio
async def test_nova_senha_curta_e_recusada():
    async with cliente() as c:
        headers = await cadastrar(c, senha=SENHA)
        resposta = await c.post(
            "/auth/senha", json={"senha_atual": SENHA, "nova_senha": "curta"}, headers=headers
        )
    assert resposta.status_code == 422


@pytest.mark.asyncio
async def test_excluir_conta_apaga_conta_e_historico():
    async with cliente() as c:
        headers = await cadastrar(c, email="sai@teste.com", senha=SENHA)
        assert (await c.post("/gerar-treino-ia", json=PERFIL, headers=headers)).status_code == 200

        errada = await c.request(
            "DELETE", "/auth/conta", json={"senha": "errada-123"}, headers=headers
        )
        assert errada.status_code == 400

        excluir = await c.request("DELETE", "/auth/conta", json={"senha": SENHA}, headers=headers)
        assert excluir.status_code == 204

        assert (await c.get("/historico", headers=headers)).status_code == 401
        login = await c.post("/auth/login", json={"email": "sai@teste.com", "senha": SENHA})
        assert login.status_code == 401
        # O mesmo e-mail pode criar uma conta nova, sem herdar o histórico antigo
        nova = await cadastrar(c, email="sai@teste.com", senha=SENHA)
        assert (await c.get("/historico", headers=nova)).json() == []


@pytest.mark.asyncio
async def test_rotas_de_conta_exigem_login():
    async with cliente() as c:
        nome = await c.patch("/auth/me", json={"nome": "X Y"})
        senha = await c.post("/auth/senha", json={"senha_atual": "a", "nova_senha": "12345678"})
        excluir = await c.request("DELETE", "/auth/conta", json={"senha": "a"})
    assert nome.status_code == senha.status_code == excluir.status_code == 401
