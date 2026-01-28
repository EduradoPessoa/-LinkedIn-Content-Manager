# API

## Health
- `GET /api/health`

## Auth
- `GET /auth/linkedin` → `{ url }` (gera `state` e retorna URL do LinkedIn)
- `GET /auth/linkedin/callback` → callback OAuth (redireciona para o frontend)
- `POST /auth/refresh` → renova access token via cookie `refresh_token`
- `POST /auth/logout` → revoga refresh token e limpa cookie
- `GET /auth/accounts` → lista contas (requer Bearer)

## Posts
- `GET /api/posts` (requer Bearer)
- `POST /api/posts` `{ content }` (requer Bearer)
- `PUT /api/posts/:id` `{ content?, status?, scheduledAt? }` (requer Bearer)
- `DELETE /api/posts/:id` (requer Bearer)

## Scheduling
- `GET /api/schedule` (requer Bearer)
- `POST /api/schedule` `{ postId, scheduledAt }` (requer Bearer)
- `DELETE /api/schedule/:id` (requer Bearer)

## AI (stub)
- `POST /api/ai/generate` `{ prompt, provider? }` (requer Bearer)
- `POST /api/ai/improve` `{ content }` (requer Bearer)
