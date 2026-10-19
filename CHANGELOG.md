# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Adicionado
- 🔐 Login real com e-mail e senha: cadastro, entrar, sessão de 30 dias (JWT) e sair; histórico por conta
- 🏋️ Nova identidade visual: preto com verde-lima (ação e progresso) e ciano (IA), fonte Chakra Petch e nova logo — um "H" de dois músculos com uma linha de gráfico subindo no meio
- ✅ Checklist de exercícios salvo no aparelho, com campo para anotar a carga (kg) usada em cada exercício concluído
- 📈 Gráficos na tela inicial: frequência semanal (dias concluídos x planejados) e evolução de força por exercício
- 🧪 Testes do backend para o envio do perfil completo à IA, sem chamar a API real

### Alterado
- 🤖 O backend envia o perfil completo à API de IA (altura, peso, idade, frequência e tempo), não só objetivo e nível
- ⚡ A chamada à API de IA passou a ser assíncrona e não bloqueia mais o servidor durante a geração
- 📱 Telas redesenhadas: início com próximo treino e gráficos, treino em sessões com checklist, chat com os dados do perfil
- 📱 Rolagem corrigida no app web

### Removido
- Menções a exportação para Excel e URL da API configurável dentro do app, que não existem no código atual
- Código não usado do template: fluxo OAuth/Manus, tRPC, Drizzle, `shared/` e componentes de exemplo (~1.250 linhas e 8 dependências)
- Cache de 1 hora das gerações e a rota pública `/testar-api-flask`

### Corrigido
- 🔌 A IA nunca respondia de verdade: faltava `TREINO_API_KEY` (401) e a API_Treino recusava os campos do perfil (400); o app sempre recebia o treino de reserva
- 👥 Todos os aparelhos usavam o mesmo `user_id` e viam o histórico uns dos outros; agora cada aparelho gera um ID anônimo
- 🕙 Datas do histórico saíam sem fuso e o app mostrava o dia seguinte para treinos gerados à noite
- 🧩 O texto da IA era dividido nos lugares errados (a introdução virava o foco do Treino A); 7 treinos por semana quebravam a conversão
- 💬 O app mostra a mensagem de erro real da API em vez do JSON cru, com timeout de 90s

### Segurança
- Conexão com o Neon verifica o certificado TLS (antes usava `CERT_NONE`)
- Validação de limites em todos os campos de entrada e limite de 5 gerações por minuto por cliente
- CORS configurável por `ALLOWED_ORIGINS`; respostas de erro sem texto de exceções
- `.dockerignore` impede que o `.env` entre na imagem; o Dockerfile não roda mais com `--reload`

### Infra
- Migrations versionadas com Alembic (`make migrate`) e `render.yaml` para deploy no Render
- O CI agora falha em erros de lint/formatação e confere se as migrations batem com os models

### Em desenvolvimento
- Autenticação de usuários com JWT
- Notificações push de lembrete de treino
- Modo offline completo no app mobile

---

## [1.0.0] — 2026-09-12

### Adicionado
- 🏋️ Geração de treinos personalizados via IA (Google Gemini)
- 💾 Fallback local automático quando a API externa está indisponível
- ☁️ Histórico de treinos persistido no PostgreSQL (Neon.tech)
- 📱 Interface mobile elegante (Navy Blue & Gold) com React Native + Expo
- ⚙️ URL da API configurável diretamente no app
- 📥 Exportação de treino para Excel (.xlsx)
- 💾 Persistência automática de perfil do usuário (AsyncStorage)
- 🐳 Suporte a Docker para ambiente de desenvolvimento local
- 🧪 Estrutura de testes automatizados com Pytest
- 📝 Documentação completa (README, CONTRIBUTING, CHANGELOG)
- 🔧 Configuração do Ruff (linter/formatter Python)
- ⚡ Makefile com atalhos para tarefas comuns

### Tecnologias
- **Backend**: FastAPI 0.110, SQLAlchemy 2.0, asyncpg, aiosqlite, httpx
- **Mobile**: React Native, Expo, NativeWind (TailwindCSS), Drizzle ORM
- **IA**: Google Gemini via API REST no Render
- **Banco**: PostgreSQL (Neon.tech) com fallback SQLite

---

[Unreleased]: https://github.com/seu-usuario/treino-app/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/seu-usuario/treino-app/releases/tag/v1.0.0
