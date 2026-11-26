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

O **HIPERTROF.IA** é um app mobile com um **Coach IA** (Google Gemini) que conversa como um
personal trainer: monta treinos, ajusta o plano e tira dúvidas sobre exercícios, alimentação,
sono e recuperação. A IA só responde sobre treino e saúde; outros assuntos ela recusa.

Quando o Coach entrega um plano (Treino A, B, C...), ele é salvo na aba **Treinos**, onde o
usuário marca os exercícios conforme avança e anota a carga de cada um. Se o Gemini estiver
sobrecarregado, o chat avisa e pede para tentar de novo em 1 minuto.

### Como as peças se ligam

```
App (Expo) ──POST /chat──▶ Backend FastAPI ──▶ Google Gemini
     ▲                         │
     └── resposta + treino_id ─┤
                               └──▶ Neon / SQLite: contas + treinos
```

---

## Funcionalidades

| Funcionalidade | Status |
|---|---|
| 💬 Chat com o Coach IA (treino e saúde, outros assuntos recusados) | ✅ |
| 🏋️ Plano montado no chat salvo na aba Treinos | ✅ |
| ✅ Checklist de exercícios e registro de carga | ✅ |
| 🔐 Login com e-mail e senha (cadastro, sessão de 30 dias, sair) | ✅ |
| ⚙️ Configurações: editar nome, trocar senha, excluir conta, tela ligada no treino, vibração, apagar progresso, status do servidor | ✅ |
| ☁️ Histórico de treinos no PostgreSQL (Neon), por conta | ✅ |

---

## Estrutura

```
treino-app/
├── backend/                  # API REST (FastAPI)
│   ├── app/main.py           # Aplicação, CORS e ciclo de vida
│   ├── routes/auth.py        # /auth/cadastro, /auth/login, /auth/me
│   ├── routes/treino.py      # /chat e /historico (exigem login)
│   ├── services/auth_service.py # Hash de senha (scrypt) e tokens JWT
│   ├── services/ia.py        # Conversa com o Gemini (regras do Coach) e recorte do plano em dias
│   ├── models/user.py        # Tabelas app_usuarios, app_treinos, app_treino_dias
│   ├── schemas/              # Validação de entrada e formato de saída (Pydantic v2)
│   ├── database/connection.py# Engine async (Neon via asyncpg ou SQLite)
│   ├── migrations/           # Migrations versionadas (Alembic)
│   └── tests/                # Pytest (a IA é sempre simulada)
├── mobile/                   # App (Expo + Expo Router)
│   ├── app/                  # Telas: login, coach (chat), treinos, detalhe, configurações
│   ├── components/           # Componentes de interface
│   ├── constants/brand.ts    # Tokens de design (cores, fontes, raios)
│   └── lib/                  # Cliente da API, sessão (token), conversa, progresso
├── render.yaml               # Blueprint de deploy (backend + app web)
├── docker-compose.yml        # Backend + Postgres local para desenvolvimento
└── Makefile                  # Atalhos (install, backend, mobile, migrate, test, lint)
```

---

## Stack

- **Backend:** FastAPI, SQLAlchemy 2 async, asyncpg, Alembic, Pydantic v2, httpx
- **Mobile:** Expo, React Native, Expo Router, AsyncStorage, Chakra Petch (Expo Google Fonts)
- **Infra:** Neon (PostgreSQL serverless), Render (backend e app web), Docker (opcional)

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
cp .env.example .env             # preencha GEMINI_API_KEY
alembic upgrade head             # cria/atualiza as tabelas
uvicorn app.main:app --reload --port 8000
```

API em `http://localhost:8000`, documentação interativa em `http://localhost:8000/docs`.

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `GEMINI_API_KEY` | Sim | Chave do Google Gemini usada pelo Coach IA. Sem ela o chat responde "Estou sobrecarregado agora". |
| `GEMINI_MODELOS` | Não | Modelos tentados em ordem, separados por vírgula. Padrão: `gemini-2.5-flash,gemini-3.5-flash-lite`. |
| `DATABASE_URL` | Não | Connection string do Neon. Vazio = SQLite local `treinoapp.db`. |
| `ALLOWED_ORIGINS` | Não | Origens do app web para CORS, separadas por vírgula. Padrão: Expo web local (`:8081`). |
| `JWT_SECRET` | Em produção | Assina os tokens de login. Trocar o valor desloga todo mundo. Sem ele (só em desenvolvimento) o backend usa um segredo temporário. |

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

| Método | Rota | Login | Descrição |
| --- | --- | :---: | --- |
| `GET` | `/` | — | Health check |
| `POST` | `/auth/cadastro` | — | `{nome, email, senha}` → `201 {token, usuario}`; e-mail repetido → `409` |
| `POST` | `/auth/login` | — | `{email, senha}` → `{token, usuario}`; dados errados → `401` |
| `GET` | `/auth/me` | ✔ | Dados da conta logada |
| `PATCH` | `/auth/me` | ✔ | `{nome}` → altera o nome |
| `POST` | `/auth/senha` | ✔ | `{senha_atual, nova_senha}` → `204`; senha atual errada → `400` |
| `DELETE` | `/auth/conta` | ✔ | `{senha}` → `204`; apaga a conta e todo o histórico |
| `POST` | `/chat` | ✔ | Conversa com o Coach IA; se a resposta traz um plano, ele é salvo no histórico |
| `GET` | `/historico` | ✔ | 50 treinos mais recentes da conta |

As rotas com login exigem o cabeçalho `Authorization: Bearer <token>`. O token vale 30 dias;
vencido ou inválido, a resposta é `401` e o app volta para a tela de login.
Senhas têm no mínimo 8 caracteres e são guardadas só como hash `scrypt` com sal. O login responde
igual para senha errada e e-mail inexistente, e aceita no máximo 10 tentativas por minuto por IP.

`POST /chat`:

```json
{ "mensagens": [{ "papel": "usuario", "texto": "Monta um treino de 4 dias para hipertrofia" }] }
```

- `papel` é `usuario` ou `ia`; cada texto tem até 4000 caracteres. O backend usa as últimas 20.
- Resposta: `{ "resposta": "...", "treino_id": "..." | null }`. `treino_id` vem quando a IA
  entregou um plano no formato `Treino A: ...` + `- exercício — 3x10`, já salvo no histórico.
- Gemini fora do ar ou sobrecarregado: `503` com `{"detail": "Estou sobrecarregado agora. Tente de novo em 1 minuto."}`.
- No máximo 10 mensagens por minuto por conta (`429` acima disso).

---

## Testes e qualidade

```bash
make test        # testes do backend (o Gemini é sempre simulado)
make lint        # Ruff + ESLint + TypeScript
```

O CI roda lint, formatação, verificação das migrations e testes do backend, além do type-check
do mobile, a cada push e pull request.

---

## Deploy no Render + Neon

1. **Neon:** crie o banco e copie a connection string (`postgresql://...?sslmode=require`).
2. **Render:** *New → Blueprint* com este repositório. O `render.yaml` cria:
   - `hipertrofia-backend` — Python, `rootDir: backend`, start `alembic upgrade head && uvicorn ...`
   - `hipertrofia-web` — site estático gerado com `npx expo export -p web`
3. Preencha no painel:
   - backend: `DATABASE_URL`, `GEMINI_API_KEY` e `ALLOWED_ORIGINS` (= URL do `hipertrofia-web`).
     O `JWT_SECRET` é gerado pelo Render; se criar o serviço à mão, defina um valor longo e aleatório.
   - web: `EXPO_PUBLIC_API_BASE_URL` (= URL do `hipertrofia-backend`). O valor é embutido no
     build, então mudar a variável exige um novo deploy do site.
4. Para os apps nativos, gere o build com EAS usando o mesmo `EXPO_PUBLIC_API_BASE_URL`.

A migration inicial só cria as tabelas que ainda não existem, então um banco que já estava em uso
é adotado sem perder dados. O controle de versão fica em `alembic_version_backend`, separado do da
API_Treino caso os dois usem o mesmo banco Neon.

> No plano gratuito o Render desliga serviços parados: a primeira mensagem depois disso pode levar
> perto de 60s (o backend acorda e o Gemini responde). O app espera até 150s.

---

## Limitações conhecidas

- **Login:** só e-mail e senha. Google, Apple e "esqueci a senha" aparecem como "em breve" — exigem
  credenciais dos provedores e um serviço de envio de e-mail. O e-mail não é confirmado no cadastro.
- **Dados no aparelho:** perfil, checklist e cargas ficam no aparelho (não sincronizam entre
  aparelhos) e são apagados ao sair da conta.
- **Coach IA:** o chat pergunta o objetivo (atalhos ou texto livre, enviado à IA como foi escrito);
  ainda não é uma conversa aberta com a IA.
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
