# Arquitetura

## Visão geral
- Monólito modular: API em Express organizada por módulos de domínio
- Frontend: React + Vite + Tailwind, consumindo `/api/*` via proxy do Vite

## Pastas
- `api/`: backend (Express)
  - `api/modules/`: módulos (auth, linkedin-integration, content-management, scheduling, ai-services, analytics)
  - `api/shared/`: utilitários compartilhados (env, errors, http middleware, database)
  - `api/database/`: migrations e scripts
- `src/`: frontend (React)

## Autenticação
- Login: OAuth 2.0 do LinkedIn (authorization code)
- Sessão:
  - Access token (JWT) no frontend
  - Refresh token (JWT) em cookie httpOnly (`refresh_token`)

## Banco de dados
- PostgreSQL local via `pg`
- Migrations SQL com runner simples + tabela `schema_migrations`
