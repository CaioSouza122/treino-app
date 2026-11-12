"""Com GEMINI_API_KEY, o treino vem direto do Google, sem a borda do Render no caminho."""

import httpx
import pytest

from services import gemini_direto, ia_service
from tests.conftest import cadastrar, cliente

PERFIL = {
    "altura": 175,
    "peso": 80,
    "idade": 28,
    "vezes_por_semana": 2,
    "objetivo": "quero pular mais alto",
    "tempo": 60,
    "nivel": "intermediario",
}
TEXTO = "Treino A: Pernas e Explosão\n- Agachamento com salto — 4x6\nTreino B: Superiores\n- Supino — 4x8"


def _google(respostas: list):
    """AsyncClient falso: cada item é um status (200 devolve TEXTO)."""
    chamadas = []

    class Falso:
        def __init__(self, *args, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def post(self, url, json=None, headers=None):
            chamadas.append((url, headers))
            status = respostas[len(chamadas) - 1]
            corpo = {"candidates": [{"content": {"parts": [{"text": TEXTO}]}}]}
            return httpx.Response(status, json=corpo if status == 200 else {"error": {}})

    return Falso, chamadas


@pytest.fixture
def com_chave(monkeypatch):
    monkeypatch.setattr(gemini_direto, "GEMINI_API_KEY", "chave-falsa")


async def _gerar():
    async with cliente() as c:
        h = await cadastrar(c)
        return await c.post("/gerar-treino-ia", json=PERFIL, headers=h)


@pytest.mark.asyncio
async def test_treino_vem_do_gemini_direto(monkeypatch, com_chave):
    falso, chamadas = _google([200])
    monkeypatch.setattr(gemini_direto.httpx, "AsyncClient", falso)

    async def api_nao_deve_ser_chamada(*args):
        raise AssertionError("a API_Treino não devia ser chamada")

    monkeypatch.setattr(ia_service, "_postar", api_nao_deve_ser_chamada)

    r = await _gerar()

    assert r.status_code == 200
    assert "X-Motivo-Reserva" not in r.headers
    assert [d["foco"] for d in r.json()] == ["Pernas e Explosão", "Superiores"]
    assert chamadas[0][1] == {"x-goog-api-key": "chave-falsa"}
    assert "chave-falsa" not in chamadas[0][0]


@pytest.mark.asyncio
async def test_modelo_sobrecarregado_tenta_o_proximo(monkeypatch, com_chave):
    falso, chamadas = _google([503, 200])
    monkeypatch.setattr(gemini_direto.httpx, "AsyncClient", falso)

    texto, motivo = await gemini_direto.gerar(ia_service.montar_payload_ia(_Dados()))

    assert texto == TEXTO and motivo == ""
    assert "gemini-2.5-flash:" in chamadas[0][0]
    assert "gemini-3.5-flash-lite:" in chamadas[1][0]


@pytest.mark.asyncio
async def test_chave_recusada_nao_tenta_outro_modelo(monkeypatch, com_chave):
    falso, chamadas = _google([403, 200])
    monkeypatch.setattr(gemini_direto.httpx, "AsyncClient", falso)

    texto, motivo = await gemini_direto.gerar(ia_service.montar_payload_ia(_Dados()))

    assert texto == "" and motivo == "gemini_http_403"
    assert len(chamadas) == 1


@pytest.mark.asyncio
async def test_gemini_falha_e_usa_a_api_treino(monkeypatch, com_chave):
    falso, _ = _google([429, 429])
    monkeypatch.setattr(gemini_direto.httpx, "AsyncClient", falso)

    async def api(url, payload, headers, prazo=None):
        return httpx.Response(
            201, json={"treino_gerado": TEXTO}, request=httpx.Request("POST", url)
        )

    monkeypatch.setattr(ia_service, "_postar", api)

    r = await _gerar()

    assert "X-Motivo-Reserva" not in r.headers
    assert r.json()[0]["foco"] == "Pernas e Explosão"


@pytest.mark.asyncio
async def test_os_dois_falham_e_o_motivo_mostra_ambos(monkeypatch, com_chave):
    falso, _ = _google([503, 503])
    monkeypatch.setattr(gemini_direto.httpx, "AsyncClient", falso)

    async def api(url, payload, headers, prazo=None):
        return httpx.Response(429, text="Too Many Requests", request=httpx.Request("POST", url))

    monkeypatch.setattr(ia_service, "_postar", api)

    r = await _gerar()

    assert r.headers["X-Motivo-Reserva"].startswith(
        "gemini_http_503 + api_com_limite_de_uso_http_429"
    )


class _Dados:
    objetivo = "quero pular mais alto"
    nivel = "intermediario"
    altura = 175.0
    peso = 80.0
    idade = 28
    vezes_por_semana = 2
    tempo = 60
