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

# Comando para iniciar o servidor
CMD ["uvicorn", "app.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--reload", \
     "--reload-dir", "app", \
     "--reload-dir", "routes", \
     "--reload-dir", "services", \
     "--reload-dir", "database", \
     "--reload-dir", "models", \
     "--reload-dir", "schemas"]
