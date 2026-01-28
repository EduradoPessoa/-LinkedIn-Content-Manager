# Setup (Local)

## Pré-requisitos
- Node.js 18+
- PostgreSQL 14+

## 1) Instalação
- `pnpm install`

## 2) Variáveis de ambiente
- Copie `.env.example` para `.env`
- Preencha:
  - `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`
  - `JWT_SECRET`, `ENCRYPTION_KEY`

## 3) Banco de dados (PostgreSQL local)
- Crie o database:
  - `pnpm db:create`
- Rode migrations:
  - `pnpm db:migrate`

## 4) Rodar em desenvolvimento
- `pnpm dev`

## URLs
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Health: `http://localhost:3001/api/health`
