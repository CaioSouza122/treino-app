# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

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
