# ── Treino.AI — Makefile ────────────────────────────────────────────────────
# Atalhos para tarefas comuns no desenvolvimento.
# Uso: make <target>
#
# Requisitos: Python 3.12+, Node.js 18+, pnpm (mobile), Docker (opcional)

.PHONY: help install backend mobile test lint format docker-up docker-down clean

# ── Padrão: exibe ajuda ───────────────────────────────────────────────────
help:
	@echo ""
	@echo "  🏋️  Treino.AI — Comandos Disponíveis"
	@echo ""
	@echo "  make install      Instala todas as dependências (backend + mobile)"
	@echo "  make backend      Inicia o servidor FastAPI com hot-reload"
	@echo "  make mobile       Inicia o app Expo"
	@echo "  make test         Executa os testes do backend"
	@echo "  make lint         Verifica o código com Ruff"
	@echo "  make format       Formata o código com Ruff"
	@echo "  make docker-up    Sobe o ambiente Docker (backend + PostgreSQL)"
	@echo "  make docker-down  Para e remove os containers Docker"
	@echo "  make clean        Remove caches e arquivos temporários"
	@echo ""

# ── Instalação ────────────────────────────────────────────────────────────
install:
	@echo "📦 Instalando dependências do backend..."
	cd backend && pip install -r requirements.txt -r requirements-dev.txt
	@echo "📦 Instalando dependências do mobile..."
	cd mobile && npm install
	@echo "✅ Instalação concluída!"

# ── Desenvolvimento ───────────────────────────────────────────────────────
backend:
	@echo "🚀 Iniciando backend FastAPI em http://localhost:8000 ..."
	cd backend && uvicorn app.main:app \
		--reload \
		--reload-dir app \
		--reload-dir routes \
		--reload-dir services \
		--reload-dir database \
		--reload-dir models \
		--reload-dir schemas \
		--host 0.0.0.0 \
		--port 8000

mobile:
	@echo "📱 Iniciando app Expo..."
	cd mobile && npx expo start

# ── Testes ────────────────────────────────────────────────────────────────
test:
	@echo "🧪 Executando testes..."
	cd backend && pytest -v

# ── Qualidade de Código ───────────────────────────────────────────────────
lint:
	@echo "🔍 Verificando código com Ruff..."
	cd backend && ruff check .

format:
	@echo "✨ Formatando código com Ruff..."
	cd backend && ruff format .

# ── Docker ────────────────────────────────────────────────────────────────
docker-up:
	@echo "🐳 Subindo containers Docker..."
	docker compose up --build

docker-down:
	@echo "🛑 Parando containers Docker..."
	docker compose down

# ── Limpeza ───────────────────────────────────────────────────────────────
clean:
	@echo "🧹 Limpando arquivos temporários..."
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.log" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Limpeza concluída!"
