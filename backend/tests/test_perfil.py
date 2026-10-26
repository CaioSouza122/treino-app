"""Perfil de treino guardado na conta: sobrevive a reinstalar o app e a trocar de celular."""

import pytest

from tests.conftest import cadastrar, cliente

PERFIL = {
    "altura": 182,
    "peso": 90,
    "idade": 34,
    "vezes_por_semana": 5,
    "objetivo": "emagrecimento",
    "tempo": 45,
    "nivel": "avancado",
}


@pytest.mark.asyncio
async def test_conta_nova_ainda_nao_tem_perfil():
    async with cliente() as c:
        h = await cadastrar(c)
        r = await c.get("/perfil", headers=h)
    assert r.status_code == 200
    assert r.json() is None


@pytest.mark.asyncio
async def test_perfil_salvo_volta_na_proxima_leitura():
    async with cliente() as c:
        h = await cadastrar(c)
        assert (await c.put("/perfil", json=PERFIL, headers=h)).status_code == 204
        r = await c.get("/perfil", headers=h)
    assert r.json() == PERFIL


@pytest.mark.asyncio
async def test_salvar_de_novo_atualiza_em_vez_de_duplicar():
    async with cliente() as c:
        h = await cadastrar(c)
        await c.put("/perfil", json=PERFIL, headers=h)
        await c.put("/perfil", json={**PERFIL, "peso": 85}, headers=h)
        r = await c.get("/perfil", headers=h)
    assert r.json()["peso"] == 85


@pytest.mark.asyncio
async def test_cada_conta_ve_so_o_proprio_perfil():
    async with cliente() as c:
        a = await cadastrar(c)
        b = await cadastrar(c)
        await c.put("/perfil", json=PERFIL, headers=a)
        r = await c.get("/perfil", headers=b)
    assert r.json() is None


@pytest.mark.asyncio
async def test_perfil_exige_login_e_valida_os_limites():
    async with cliente() as c:
        assert (await c.get("/perfil")).status_code == 401
        assert (await c.put("/perfil", json=PERFIL)).status_code == 401
        h = await cadastrar(c)
        r = await c.put("/perfil", json={**PERFIL, "peso": 5}, headers=h)
    assert r.status_code == 422
