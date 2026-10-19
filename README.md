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

## Sobre o projeto

O **HIPERTROF.IA** é um app mobile full-stack que gera planos de treino personalizados com o
**Google Gemini**. O usuário informa idade, peso, altura, objetivo, nível, frequência semanal e
tempo por sessão, e recebe um plano dividido em dias (Treino A, B, C...).

No app, o próximo treino aparece em destaque na tela inicial, com gráficos de frequência e de
evolução de força. O usuário marca os exercícios conforme avança e anota a carga de cada um.

Se a IA estiver indisponível, o backend monta um **treino de reserva** a partir de modelos
locais, então o usuário sempre recebe um plano.

### Como as peças se ligam

```
App (Expo) ──POST /gerar-treino-ia──▶ Backend FastAPI ──POST /api/v1/treino──▶ API_Treino (Flask) ──▶ Gemini
     ▲                                   │   (X-API-KEY)                          (repositório próprio)
     └────── dias do treino (JSON) ──────┤
                                         └──▶ Neon / SQLite: perfil + histórico
```

A **[API_Treino](https://github.com/CaioSouza122/API_Treino)** é um serviço separado. Ela só
aceita chamadas com a chave `X-API-KEY`, e o backend envia o mesmo valor configurado em
`TREINO_API_KEY`.

---

## Funcionalidades

| Funcionalidade | Status |
|---|---|
| 🤖 Geração de treino via IA com o perfil completo | ✅ |
| 🔄 Treino de reserva local quando a IA falha | ✅ |
| 🏋️ Próximo treino em destaque e plano da semana | ✅ |
| ✅ Checklist de exercícios com progresso salvo no dia | ✅ |
| 📈 Registro de carga, gráficos de frequência e de evolução de força | ✅ |
| ☁️ Histórico de treinos no PostgreSQL (Neon), separado por aparelho | ✅ |
| 💬 Coach IA em conversa | 🚧 Prévia: respostas ainda são fixas |
| 🔐 Login de verdade | 🔜 A tela de login ainda é só visual |
| ⏱️ Timer de descanso · 🔔 Lembretes | 🔜 |

---

## Estrutura

```
treino-app/
├── backend/                  # API REST (FastAPI)
│   ├── app/main.py           # Aplicação, CORS e ciclo de vida
│   ├── routes/treino.py      # /gerar-treino-ia e /historico/{user_id}
│   ├── services/ia_service.py# Chamada à API_Treino, conversão em dias, treino de reserva
│   ├── models/user.py        # Tabelas app_usuarios, app_treinos, app_treino_dias
│   ├── schemas/              # Validação de entrada e formato de saída (Pydantic v2)
│   ├── database/connection.py# Engine async (Neon via asyncpg ou SQLite)
│   ├── migrations/           # Migrations versionadas (Alembic)
│   └── tests/                # Pytest (a IA é sempre simulada)
├── mobile/                   # App (Expo + Expo Router)
│   ├── app/                  # Telas: início, coach, treinos, detalhe, perfil
│   ├── components/           # Componentes de interface
│   ├── constants/brand.ts    # Tokens de design (cores, fontes, raios)
│   └── lib/                  # Cliente da API, perfil, ID do aparelho, progresso
├── render.yaml               # Blueprint de deploy (backend + app web)
├── docker-compose.yml        # Backend + Postgres local para desenvolvimento
└── Makefile                  # Atalhos (install, backend, mobile, migrate, test, lint)
```

---

## Stack

- **Backend:** FastAPI, SQLAlchemy 2 async, asyncpg, Alembic, Pydantic v2, httpx
- **Mobile:** Expo, React Native, Expo Router, AsyncStorage, Chakra Petch (Expo Google Fonts)
- **Infra:** Neon (PostgreSQL serverless), Render (backend, app web e API_Treino), Docker (opcional)

---

## Rodando localmente

Pré-requisitos: **Python 3.12+**, **Node.js 18+**, npm e Git.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
source venv/bin/activate         # Linux / Mac

pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env             # preencha TREINO_API_KEY
alembic upgrade head             # cria/atualiza as tabelas
uvicorn app.main:app --reload --port 8000
```

API em `http://localhost:8000`, documentação interativa em `http://localhost:8000/docs`.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `TREINO_API_KEY` | Sim | Mesmo valor de `API_AUTH_KEY` na API_Treino. Sem ela, toda geração cai no treino de reserva. |
| `TREINO_API_URL` | Não | URL da API_Treino. Padrão: `https://api-treino-ygh4.onrender.com/api/v1`. |
| `DATABASE_URL` | Não | Connection string do Neon. Vazio = SQLite local `treinoapp.db`. |
| `ALLOWED_ORIGINS` | Não | Origens do app web para CORS, separadas por vírgula. Padrão: Expo web local (`:8081`). |

### Mobile

```bash
cd mobile
npm install
cp .env.example .env             # aponte EXPO_PUBLIC_API_BASE_URL para o backend
npx expo start                   # QR Code no Expo Go · "w" abre no navegador
```

| Variável | Descrição |
| --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | URL do backend. No celular físico use o IP da máquina (`http://192.168.x.x:8000`), não `localhost`. |
| `EXPO_PUBLIC_TREINO_USER_ID` | Só para desenvolvimento: força um ID fixo. Sem ela, cada aparelho gera um ID anônimo próprio. |

### Com Docker

```bash
make docker-up                   # backend com hot-reload + Postgres local
```

### Comandos

| Comando | O que faz |
| --- | --- |
| `make install` | Instala dependências do backend e do mobile |
| `make backend` / `make mobile` | Sobe o backend / o app |
| `make migrate` | Aplica as migrations (`alembic upgrade head`) |
| `make test` | Testes do backend |
| `make lint` | Ruff (backend) + ESLint e TypeScript (mobile) |
| `make format` | Formata o backend com Ruff |

---

## Endpoints do backend

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/` | Health check |
| `POST` | `/gerar-treino-ia` | Gera o treino, salva no histórico e devolve os dias |
| `GET` | `/historico/{user_id}` | 50 treinos mais recentes daquele aparelho |

`POST /gerar-treino-ia`:

```json
{
  "user_id": "8f14e45f-...",
  "altura": 178, "peso": 80, "idade": 28,
  "vezes_por_semana": 4, "tempo": 60,
  "objetivo": "hipertrofia", "nivel": "Intermediário"
}
```

- Limites: altura 1–250, peso 20–400, idade 10–100, frequência 1–7, tempo 10–300 min,
  objetivo 3–255 caracteres. Fora disso a resposta é `422`.
- `nivel` aceita texto livre ("Avançado", "INICIANTE") e é convertido para o formato da API de IA.
- No máximo 5 gerações por minuto por cliente (`429` acima disso).
- A resposta é uma lista `[{ "dia": "Treino A", "foco": "Peito e Tríceps", "exercicios": "..." }]`.
- Erros vêm como `{"detail": "mensagem"}`, e o app mostra essa mensagem ao usuário.

---

## Testes e qualidade

```bash
make test        # 25 testes do backend
make lint        # Ruff + ESLint + TypeScript
```

O CI roda lint, formatação, verificação das migrations e testes do backend, além do type-check
do mobile, a cada push e pull request.

---

## Deploy no Render + Neon

1. **API_Treino:** faça o deploy primeiro (instruções no README dela) e anote o `API_AUTH_KEY`.
2. **Neon:** crie o banco e copie a connection string (`postgresql://...?sslmode=require`).
3. **Render:** *New → Blueprint* com este repositório. O `render.yaml` cria:
   - `hipertrofia-backend` — Python, `rootDir: backend`, start `alembic upgrade head && uvicorn ...`
   - `hipertrofia-web` — site estático gerado com `npx expo export -p web`
4. Preencha no painel:
   - backend: `DATABASE_URL`, `TREINO_API_KEY` e `ALLOWED_ORIGINS` (= URL do `hipertrofia-web`)
   - web: `EXPO_PUBLIC_API_BASE_URL` (= URL do `hipertrofia-backend`). O valor é embutido no
     build, então mudar a variável exige um novo deploy do site.
5. Para os apps nativos, gere o build com EAS usando o mesmo `EXPO_PUBLIC_API_BASE_URL`.

A migration inicial só cria as tabelas que ainda não existem, então um banco que já estava em uso
é adotado sem perder dados. O controle de versão fica em `alembic_version_backend`, separado do da
API_Treino caso os dois usem o mesmo banco Neon.

> No plano gratuito o Render desliga serviços parados: a primeira geração depois disso pode levar
> perto de 40s (o backend acorda, a API_Treino acorda e o Gemini responde). O app espera até 90s.

---

## Limitações conhecidas

- **Login apenas visual:** os botões de entrar abrem o app direto. O histórico é separado por um
  ID anônimo gerado no aparelho; quem souber esse ID consegue ler o histórico dele.
- **Coach IA:** o chat ainda responde com mensagens fixas; "Gerar treino" usa o perfil, não a conversa.
- **NativeWind:** instalado, mas o `global.css` não é importado. As telas usam `StyleSheet`.
- **Limites de geração em memória:** valem por instância. Com mais de uma instância no Render,
  é preciso movê-los para um armazenamento compartilhado (Redis).

---

## Segurança

- Segredos só em `.env` (ignorado pelo git e pelo Docker) ou no painel do Render.
- Conexão com o Neon por TLS com certificado verificado.
- Entradas validadas com Pydantic; banco acessado só pelo ORM.
- CORS restrito às origens configuradas; respostas de erro sem detalhes internos.

---

## Contribuindo · Changelog · Licença

[CONTRIBUTING.md](CONTRIBUTING.md) · [CHANGELOG.md](CHANGELOG.md) · [MIT](LICENSE)

<div align="center">
Feito com ❤️ e ☕ · Powered by <strong>Google Gemini</strong>
</div>
