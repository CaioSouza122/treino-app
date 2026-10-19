# ── Treino.AI — Backend Dockerfile ─────────────────────────────────────────
FROM python:3.12-slim

# Metadados
LABEL maintainer="Treino.AI Team"
LABEL description="Backend FastAPI + IA para geração de treinos personalizados"

# Diretório de trabalho
WORKDIR /app

# Instala dependências do sistema (necessárias para asyncpg/psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala dependências Python primeiro (cache de layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Expõe a porta da API
EXPOSE 8000

# Comando de produção. O Render define $PORT; --proxy-headers faz o uvicorn ler o IP real
# do cliente no X-Forwarded-For (usado pelo limite de gerações). Hot-reload: docker-compose.yml.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips "*"
