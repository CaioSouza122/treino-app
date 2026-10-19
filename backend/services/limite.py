import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class LimitePorCliente:
    """Permite até `limite` chamadas por cliente (IP ou chave) a cada `janela` segundos.

    shortcut: contador em memória, por processo. Serve para 1 instância no Render;
    com várias instâncias, mover para Redis.
    """

    def __init__(self, limite: int, janela: float, mensagem: str):
        self.limite = limite
        self.janela = janela
        self.mensagem = mensagem
        self.chamadas: dict[str, deque] = defaultdict(deque)

    def __call__(self, request: Request, chave: str | None = None) -> None:
        """`chave` troca o IP por outro identificador (ex.: o id da conta logada)."""
        cliente = chave or (request.client.host if request.client else "desconhecido")
        agora = time.monotonic()
        historico = self.chamadas[cliente]
        while historico and agora - historico[0] > self.janela:
            historico.popleft()
        if len(historico) >= self.limite:
            raise HTTPException(status_code=429, detail=self.mensagem)
        historico.append(agora)
        # Não deixa o dicionário crescer com clientes que já pararam de usar
        if len(self.chamadas) > 10_000:
            for chave in [
                c for c, h in self.chamadas.items() if not h or agora - h[-1] > self.janela
            ]:
                del self.chamadas[chave]
