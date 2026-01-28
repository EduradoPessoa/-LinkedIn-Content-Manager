# Desenvolvimento

## Scripts
- `pnpm dev`: frontend + backend
- `pnpm db:create`: cria o database local
- `pnpm db:migrate`: aplica migrations
- `pnpm lint`: lint
- `pnpm check`: typecheck
- `pnpm test`: testes

## Convenções
- ESM + TypeScript
- Rotas usam `asyncHandler` e erros padronizados via `AppError`
- Módulos ficam em `api/modules/*`

## Primeiro login (LinkedIn)
- Configure `LINKEDIN_CLIENT_ID/SECRET` e `LINKEDIN_REDIRECT_URI`
- Use a tela de login no frontend
