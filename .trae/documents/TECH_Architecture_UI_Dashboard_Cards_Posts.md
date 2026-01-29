## 1.Architecture design
```mermaid
graph TD
  A["User Browser"] --> B["React Frontend Application"]
  B --> C["Posts Data Source (Existing App Service)"]

  subgraph "Frontend Layer"
    B
  end

  subgraph "Service Layer"
    C
  end
```

## 2.Technology Description
- Frontend: React@18 + TypeScript + (CSS/Tailwind ou CSS Modules)
- Backend: Existente (fora do escopo desta melhoria de UI)

## 3.Route definitions
| Route | Purpose |
|-------|---------|
| /dashboard | Dashboard com lista de posts em cards (imagem, prévia 3 linhas, badge de status, data, ações) |
| /posts/:id (opcional) | Tela de detalhes do post (caso não seja modal) |