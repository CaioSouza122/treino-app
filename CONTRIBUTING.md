# Guia de Contribuição — Treino.AI

Obrigado pelo interesse em contribuir com o **Treino.AI**! 🏋️‍♂️

## Pré-requisitos

- Python 3.12+
- Node.js 18+
- npm ou pnpm
- Docker & Docker Compose (opcional, para ambiente local completo)
- Git

## Setup do Ambiente de Desenvolvimento

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/treino-app.git
cd treino-app

# 2. Configure o backend
cd backend
cp .env.example .env        # Preencha suas chaves no .env
python -m venv venv
source venv/bin/activate    # Linux/Mac
# ou: venv\Scripts\activate  # Windows
pip install -r requirements.txt -r requirements-dev.txt

# 3. Configure o mobile
cd ../mobile
npm install
```

Ou via Make (Linux/Mac):
```bash
make install
```

## Rodando Localmente

```bash
# Backend (FastAPI em http://localhost:8000)
make backend

# Mobile (Expo)
make mobile

# Ou com Docker (backend + PostgreSQL local)
make docker-up
```

## Fluxo de Trabalho com Git

1. **Crie uma branch** a partir de `main`:
   ```bash
   git checkout -b feat/minha-funcionalidade
   ```

2. **Faça commits** seguindo a convenção [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: adiciona exportação de treino em PDF
   fix: corrige timeout na chamada à API Render
   docs: atualiza README com instruções de Docker
   refactor: extrai lógica de fallback para módulo separado
   test: adiciona testes para rota /gerar-treino-ia
   chore: atualiza dependências do backend
   ```

3. **Execute os testes e o linter** antes de abrir um PR:
   ```bash
   make test
   make lint
   ```

4. **Abra um Pull Request** descrevendo as mudanças, motivação e como testar.

## Estrutura do Projeto

```
treino-app/
├── backend/          # API FastAPI (Python)
│   ├── app/          # Entrypoint (main.py)
│   ├── routes/       # Rotas HTTP
│   ├── services/     # Lógica de negócio e integração com IA
│   ├── models/       # Modelos SQLAlchemy
│   ├── schemas/      # Schemas Pydantic (validação)
│   ├── database/     # Configuração de banco de dados
│   └── tests/        # Testes automatizados
└── mobile/           # App React Native (Expo)
```

## Padrões de Código

- **Python**: Siga o PEP8. Use `ruff format` e `ruff check` para manter o padrão.
- **JavaScript/TypeScript**: ESLint está configurado no mobile.
- **Commits**: Sempre em inglês, no formato Conventional Commits.
- **Docstrings**: Funções públicas devem ter docstrings descrevendo o comportamento.

## Reportando Bugs

Use os **Issue Templates** do GitHub:
- 🐛 **Bug Report**: para erros e comportamentos inesperados
- ✨ **Feature Request**: para sugestões de novas funcionalidades

## Dúvidas?

Abra uma Issue com o label `question` e responderemos o mais breve possível.
