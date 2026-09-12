<div align="center">

# 🏋️‍♂️ HIPERTROF.IA

**Seu personal trainer no bolso, movido a Inteligência Artificial.**

[![Backend CI](https://github.com/CaioSouza122/treino-app/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/CaioSouza122/treino-app/actions/workflows/backend-ci.yml)
[![Mobile CI](https://github.com/CaioSouza122/treino-app/actions/workflows/mobile-ci.yml/badge.svg)](https://github.com/CaioSouza122/treino-app/actions/workflows/mobile-ci.yml)

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React Native](https://img.shields.io/badge/React_Native-Expo-0EA5E9?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![Google Gemini](https://img.shields.io/badge/IA-Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Sobre o Projeto

O **HIPERTROF.IA** é um aplicativo mobile **Full-Stack** que utiliza o **Google Gemini** para gerar protocolos de treino hiperpersonalizados. O usuário informa seus dados físicos (idade, peso, altura, objetivo, frequência semanal e tempo disponível) e a IA monta um plano de treino dividido (A, B, C...) adaptado à sua rotina.

Quando a API de IA está indisponível, o sistema automaticamente usa um **fallback local** inteligente baseado em templates estruturados — garantindo que o usuário sempre receba um treino.

---

## ✨ Funcionalidades

| Funcionalidade | Status |
|---|---|
| 🤖 Geração de treino via IA (Google Gemini) | ✅ Disponível |
| 🔄 Fallback automático (treino local offline) | ✅ Disponível |
| 💾 Persistência de perfil (AsyncStorage) | ✅ Disponível |
| ☁️ Histórico de treinos (PostgreSQL / Neon) | ✅ Disponível |
| 📥 Exportação para Excel (.xlsx) | ✅ Disponível |
| ⚙️ URL da API configurável no app | ✅ Disponível |
| 🔐 Autenticação com JWT | 🔜 Em breve |
| 🔔 Notificações push de lembrete | 🔜 Em breve |

---

## 🏗️ Arquitetura

```
treino-app/                  ← Monorepo
├── backend/                 ← API REST (Python + FastAPI)
│   ├── app/main.py          ← Entrypoint da aplicação
│   ├── routes/              ← Endpoints HTTP
│   ├── services/            ← Lógica de negócio + integração IA
│   ├── models/              ← Modelos SQLAlchemy (User, Workout, WorkoutDay)
│   ├── schemas/             ← Schemas Pydantic (validação de dados)
│   ├── database/            ← Configuração async engine (PostgreSQL / SQLite)
│   └── tests/               ← Testes automatizados (Pytest)
└── mobile/                  ← App React Native (Expo)
    ├── app/                 ← Telas (Expo Router)
    ├── components/          ← Componentes reutilizáveis
    ├── hooks/               ← Custom hooks
    ├── lib/                 ← Utilitários e configurações
    └── shared/              ← Tipos e constantes compartilhadas
```

**Fluxo de dados:**
```
App Mobile → POST /gerar-treino-ia → Backend FastAPI
                                          ↓
                               API Render (Gemini) ──→ Treino Gerado
                                    (falha?)              ↓
                                          ↓         Salvo no PostgreSQL
                               Fallback Local              ↓
                                          ↓         Retorna ao App
                                    Treino Gerado
```

---

## 🚀 Stack Tecnológica

### Backend
- **[FastAPI](https://fastapi.tiangolo.com)** — Framework web async de alta performance
- **[SQLAlchemy 2.0](https://sqlalchemy.org)** — ORM com suporte async completo
- **[asyncpg](https://github.com/MagicStack/asyncpg)** — Driver PostgreSQL async ultrarrápido
- **[Pydantic v2](https://docs.pydantic.dev)** — Validação e serialização de dados
- **[httpx](https://www.python-httpx.org)** — Cliente HTTP async para chamadas à API de IA
- **[python-dotenv](https://github.com/theskumar/python-dotenv)** — Gerenciamento de variáveis de ambiente

### Mobile
- **[React Native](https://reactnative.dev)** + **[Expo](https://expo.dev)** — Framework mobile cross-platform
- **[Expo Router](https://expo.github.io/router)** — Roteamento baseado em arquivos
- **[NativeWind](https://nativewind.dev)** — TailwindCSS para React Native
- **[Drizzle ORM](https://orm.drizzle.team)** — ORM TypeScript para banco local (SQLite)

### Infraestrutura
- **[Neon.tech](https://neon.tech)** — PostgreSQL serverless (produção)
- **[Render](https://render.com)** — Hospedagem da API de IA
- **[Docker](https://docker.com)** — Containerização para desenvolvimento local

---

## 🛠️ Como Rodar Localmente

### Pré-requisitos

- Python 3.12+
- Node.js 18+
- npm (ou pnpm)
- Git

### ⚡ Quick Start (com Make)

```bash
# Clone o repositório
git clone https://github.com/CaioSouza122/treino-app.git
cd treino-app

# Instala todas as dependências
make install

# Terminal 1: inicia o backend
make backend

# Terminal 2: inicia o mobile (dentro de mobile/)
make mobile
```

### 🐳 Alternativa com Docker

```bash
# Sobe o backend + PostgreSQL local
make docker-up

# Em outro terminal, inicia o mobile
make mobile
```

---

### 1️⃣ Backend (FastAPI)

```bash
cd backend

# Crie e ative o ambiente virtual
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux / Mac

# Instale as dependências
pip install -r requirements.txt

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas chaves
```

Edite o `backend/.env`:
```env
# Banco de dados Neon.tech (produção)
DATABASE_URL=postgresql://usuario:senha@host.neon.tech/neondb?sslmode=require

# API de IA no Render
TREINO_API_URL=https://api-treino-ygh4.onrender.com/api/v1
TREINO_API_KEY=sua_chave_opcional
```

> 💡 Sem `DATABASE_URL` configurada, o backend usa **SQLite local** automaticamente.

Inicie o servidor:
```bash
uvicorn app.main:app --reload \
  --reload-dir app --reload-dir routes --reload-dir services \
  --reload-dir database --reload-dir models --reload-dir schemas \
  --host 0.0.0.0 --port 8000
```

A API estará disponível em `http://localhost:8000`.
Documentação interativa (Swagger): `http://localhost:8000/docs`

### 2️⃣ Mobile (Expo)

```bash
cd mobile
npm install
npx expo start
```

Escaneie o QR Code com o **Expo Go** no seu celular, ou pressione `a` para Android / `i` para iOS no simulador.

---

## 🧪 Testes

```bash
# Executa todos os testes do backend
make test

# Ou diretamente com Pytest
cd backend && pytest -v
```

---

## 🔍 Qualidade de Código

```bash
# Verificar problemas de estilo (Ruff)
make lint

# Formatar automaticamente
make format
```

---

## 🔒 Segurança

- O arquivo `.env` está no `.gitignore` — **nunca commite suas chaves de API!**
- Use o `.env.example` como referência para as variáveis necessárias.
- O arquivo `.gitignore` protege `venv/`, `node_modules/`, `*.log` e `*.db`.

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! Leia o [CONTRIBUTING.md](CONTRIBUTING.md) para entender o processo.

---

## 📋 Changelog

Veja o [CHANGELOG.md](CHANGELOG.md) para o histórico de versões.

---

## 📄 Licença

Distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

<div align="center">
Feito com ❤️ e ☕ · Powered by <strong>Google Gemini</strong>
</div>
