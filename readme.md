# LinkedIn Content Manager

> Plataforma web para criação, agendamento e gestão inteligente de conteúdo no LinkedIn com integração de IA

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)

---

## 📋 Visão Geral

O **LinkedIn Content Manager** é uma aplicação web desenvolvida para simplificar e otimizar a gestão de conteúdo no LinkedIn. Combinando inteligência artificial e automação, permite criar, agendar e monitorar posts de forma eficiente e estratégica.

### 🎯 Principais Benefícios

- **Criação Inteligente**: Geração de conteúdo assistida por IA  
- **Agendamento Flexível**: Publicação automatizada em horários estratégicos  
- **Gestão Multi-Conta**: Suporte para múltiplos perfis LinkedIn  
- **Analytics Integrado**: Monitoramento de métricas e engajamento  
- **Interface Intuitiva**: UX otimizada para produtividade  

---

## ✨ Funcionalidades

### 📝 Criação de Conteúdo
- Criação de posts com assistência de IA  
- Suporte a múltiplos provedores de IA (OpenAI, Anthropic, outros)  
- Templates personalizáveis para diferentes tipos de conteúdo  
- Preview em tempo real  

### ⏰ Agendamento e Publicação
- Agendamento de posts por data e hora  
- Timezone automático por usuário  
- Fila inteligente respeitando rate limits do LinkedIn  
- Republicação automática (opcional)  

### 🔐 Gestão Multi-Usuário
- Autenticação via LinkedIn SSO  
- Suporte a múltiplas contas LinkedIn por usuário  
- Controle de permissões e acessos  

### 📊 Analytics e Monitoramento
- Métricas de engajamento (likes, comentários, compartilhamentos)  
- Dashboard com insights de performance  
- Histórico de publicações  
- Alertas de novos comentários  

### 🤖 Automação Inteligente
- Monitoramento automático de comentários  
- Respostas sugeridas por IA  
- Detecção de tendências de engajamento  

---

## 🏗️ Arquitetura

### 🧱 Stack Tecnológica

- **Backend**: Node.js + Express + TypeScript  
- **Frontend**: React + Vite + Tailwind CSS  
- **Database**: PostgreSQL + Redis  
- **Queue**: BullMQ (Redis-based)  
- **Deploy**: Docker + Railway / Render  

### 🧩 Arquitetura Modular

```text
src/
├── modules/
│   ├── linkedin-integration/   # LinkedIn API & OAuth
│   ├── content-management/     # Posts & Content CRUD
│   ├── ai-services/            # Integração multi-provedor de IA
│   ├── scheduling/             # Agendamento e filas
│   ├── analytics/              # Métricas e relatórios
│   ├── notifications/          # Monitoramento de comentários
│   └── shared/                 # Utilitários comuns
├── api/                         # Rotas REST
├── web/                         # Frontend React
└── infrastructure/             # Docker, CI/CD, configs
```

## 🚀 Instalação e Setup
Pré-requisitos
Node.js 18+

PostgreSQL 14+

Redis 6+

Conta de desenvolvedor LinkedIn

##Instalação Local
```bash
git clone https://github.com/seu-usuario/linkedin-content-manager.git
cd linkedin-content-manager

npm install

cp .env.example .env
# Edite o .env com suas credenciais

npm run db:migrate
npm run dev
```

## 🐳 Com Docker
```bash 
git clone https://github.com/seu-usuario/linkedin-content-manager.git
cd linkedin-content-manager

cp .env.example .env

docker-compose up -d
```

## ⚙️ Configuração
```text
Variáveis de Ambiente
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/linkedin_manager
REDIS_URL=redis://localhost:6379

# LinkedIn API
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/auth/linkedin/callback

# AI Providers
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key

# Application
NODE_ENV=development
PORT=3000
```

## 📚 API Documentation
```text
Authentication
POST /auth/linkedin
POST /auth/refresh
Content Management
GET    /api/posts
POST   /api/posts
PUT    /api/posts/:id
DELETE /api/posts/:id
AI Services
POST /api/ai/generate
POST /api/ai/improve
Scheduling
GET    /api/schedule
POST   /api/schedule
DELETE /api/schedule/:id
Analytics
GET /api/analytics/posts
GET /api/analytics/overview
🧪 Testes
npm test
npm run test:unit
npm run test:integration
npm run test:coverage
📦 Deploy
Railway (Recomendado)
npm install -g @railway/cli
railway login
railway link
railway deploy
Docker
docker build -t linkedin-content-manager .
docker run -p 3000:3000 --env-file .env linkedin-content-manager
```

## 🤝 Contribuição
Fork o projeto
```bash
Crie uma branch (git checkout -b feature/AmazingFeature)

Commit (git commit -m 'Add AmazingFeature')

Push (git push origin feature/AmazingFeature)

Abra um Pull Request
```

## Convenções
TypeScript obrigatório

ESLint ativo

Testes obrigatórios

Cobertura mínima de 80%

## 📋 Roadmap
Versão 1.0 (MVP)
Autenticação LinkedIn

Criação básica de posts

Integração OpenAI

Agendamento simples

Interface web

Deploy em produção

Versão 1.1
Múltiplos provedores de IA

Analytics avançado

Monitoramento de comentários

Respostas automáticas

Versão 1.2
Templates de conteúdo

Integração com outras redes sociais

API pública

Mobile app

## ⚠️ Limitações Conhecidas
LinkedIn Articles API descontinuada

Rate limit: 250 posts/usuário/dia

Uso comercial requer aprovação do LinkedIn

Comentários apenas leitura

## 🛡️ Segurança
Tokens criptografados

JWT + refresh tokens

Rate limiting por usuário

Logs de auditoria

HTTPS obrigatório

## 📄 Licença
Licenciado sob a MIT License — veja o arquivo LICENSE.

## 📞 Suporte
Issues: GitHub

Discussões: GitHub

Email: eduardo@phoenyx.com.br


Feito com ❤️ para escalar autoridade e presença no LinkedIn.

