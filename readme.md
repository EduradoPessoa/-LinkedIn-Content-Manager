# LinkedIn Content Manager

Plataforma web para criação, agendamento e gestão inteligente de conteúdo no LinkedIn com integração de IA.

> Status: base funcional de desenvolvimento (auth LinkedIn + JWT, migrations PostgreSQL, API REST e frontend).

## 📋 Visão Geral

O **LinkedIn Content Manager** é uma aplicação web para simplificar e otimizar a gestão de conteúdo no LinkedIn. Combina automação + IA para ajudar a criar, organizar e acompanhar posts com uma operação leve (projeto solo, custo-otimizado).

## 🎯 Principais Benefícios

- **Criação inteligente**: geração/reescrita assistida por IA (multi-provedor)
- **Agendamento flexível**: fila de publicações e execução em horários estratégicos (base pronta; fila avançada planejada)
- **Gestão multi-conta**: suporte a múltiplos perfis LinkedIn por usuário (estrutura pronta)
- **Analytics integrado**: armazenamento de métricas e visão histórica (estrutura/migrations prontas; coleta avançada planejada)
- **UX produtiva**: fluxo simples de login, criação e listagem de posts

## ✨ Funcionalidades

### 📝 Criação de Conteúdo

- Criação e edição de posts
- Preview e edição rápida no painel
- Integração IA (stub) com múltiplos provedores (OpenAI, Anthropic, Gemini, Groq)

### ⏰ Agendamento e Publicação

- Criação de agendamentos e listagem (base)
- Estrutura para fila inteligente e rate limiting (planejado: BullMQ/Redis)

### 🔐 Autenticação e Segurança

- Login via LinkedIn OAuth (SSO)
- Sessão via **JWT (access token)** + **refresh token em cookie httpOnly**
- `state` de OAuth validado via cookie
- Tokens do LinkedIn armazenados **criptografados (AES-256-GCM)** no banco

## 🏗️ Arquitetura

### 🧱 Stack Tecnológica

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL (local)
- **Redis/Queue**: Redis + BullMQ (planejado)
- **Deploy**: Docker + Railway/Render (planejado)

### 🧩 Estrutura do Repositório

> Nota: a estrutura atual é um monólito modular com backend em `api/` e frontend na raiz.

```
.
├── api/                      # Backend (Express + TypeScript)
│   ├── modules/              # Módulos de domínio
│   ├── shared/               # Utilitários comuns (env, errors, crypto, auth)
│   └── database/             # Migrations e scripts de DB
├── src/                      # Frontend (React)
├── .github/workflows/        # CI
└── .trae/documents/          # Docs (setup, API, arquitetura)
```

## 🚀 Instalação e Setup (Desenvolvimento)

### Pré-requisitos

- Node.js 18+
- pnpm
- PostgreSQL 14+
- (Opcional) Redis 6+ (somente quando fila BullMQ for ativada)
- Conta de desenvolvedor LinkedIn (OAuth)

### Instalação local

```bash
git clone https://github.com/EduradoPessoa/-LinkedIn-Content-Manager.git
cd -LinkedIn-Content-Manager

pnpm install

cp .env.example .env
```

Edite o `.env` com suas credenciais (nunca commite chaves). Depois:

```bash
pnpm db:create
pnpm db:migrate

pnpm dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Healthcheck: `http://localhost:3001/api/health`

## ⚙️ Configuração

As variáveis estão em `.env.example`. Principais:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/linkedin-content-manager

# LinkedIn API
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
LINKEDIN_REDIRECT_URI=http://localhost:3001/auth/linkedin/callback
LINKEDIN_SCOPES=openid profile email w_member_social
LINKEDIN_ORG_POSTING_ENABLED=false

# Alguns endpoints do LinkedIn podem exigir header de versão.
LINKEDIN_VERSION=202401

# Para publicar no feed (necessário para o botão "Publicar no LinkedIn"):
# LINKEDIN_SCOPES=openid profile email w_member_social

# AI Providers (opcional)
GOOGLE_API_KEY=
GROQ_API_KEY=

# Scheduler (publicação automática)
SCHEDULER_ENABLED=true
SCHEDULER_POLL_MS=60000
SCHEDULER_BATCH_SIZE=5
SCHEDULER_SECRET=

# Em ambiente local (api/server.ts) o scheduler roda por polling.
# Em produção na Vercel, um Cron (vercel.json) chama /api/scheduler/tick a cada minuto.
# Se você definir SCHEDULER_SECRET em produção, o endpoint passa a exigir o secret via header/query.

# Security
JWT_SECRET=
ENCRYPTION_KEY=
```

Regras:

- `JWT_SECRET` deve ter pelo menos 16 caracteres
- `ENCRYPTION_KEY` deve ter pelo menos 32 caracteres

Sobre os escopos do LinkedIn:

- Fluxo recomendado: **OpenID Connect** (`LINKEDIN_SCOPES=openid profile email w_member_social`)
- Escopos legados (ex.: `r_liteprofile`, `r_emailaddress`, `w_member_social`) podem exigir permissões específicas no Developer Portal
- Para publicar no feed: habilite o produto/permissões de publicação no LinkedIn e inclua `w_member_social` em `LINKEDIN_SCOPES`.
- Para publicar como **Organização/Página**: inclua `w_organization_social` e a permissão de admin (`rw_organization_admin`) para listar as organizações administradas e validar permissão.

## 📚 API (resumo)

### Health

- `GET /api/health`

### Autenticação

- `GET /auth/linkedin` (gera URL)
- `GET /auth/linkedin/callback` (callback OAuth)
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/accounts`

### Posts

- `GET /api/posts`
- `POST /api/posts`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`
- `POST /api/posts/:id/publish`

### Agendamento

- `GET /api/schedule`
- `POST /api/schedule`
- `DELETE /api/schedule/:id`

### IA / Analytics

- `POST /api/ai/generate` (stub)
- `POST /api/ai/improve`
- `GET /api/analytics/*` (stub)

Documentação detalhada:

- `.trae/documents/API.md`
- `.trae/documents/SETUP.md`
- `.trae/documents/ARCHITECTURE.md`

## 🧪 Testes

```bash
pnpm test
pnpm test:coverage
```

## 📦 Deploy

Planejado:

- Docker (compose para API + Postgres + Redis)
- Railway/Render (custo-otimizado)

## 📋 Roadmap (alto nível)

- v1.0 (MVP): login LinkedIn, CRUD posts, agendamento simples, UI base
- v1.1: multi-provedor de IA real, analytics avançado, monitoramento de comentários
- v1.2: templates, integrações adicionais, API pública

## ⚠️ Limitações Conhecidas

- APIs do LinkedIn têm restrições e exigências de aprovação para uso comercial
- Rate limits variam por endpoint e aplicação (modelagem para fila/rate limiting está planejada)

## 🛡️ Segurança

- Tokens do LinkedIn criptografados no banco
- JWT + refresh token (cookie httpOnly)
- Validação de payload com Zod

## 📄 Licença

MIT — veja o arquivo `LICENSE`.
