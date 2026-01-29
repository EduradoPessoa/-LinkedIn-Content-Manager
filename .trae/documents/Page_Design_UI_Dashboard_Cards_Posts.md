# Page Design — Dashboard (Cards de Posts)

## Abordagem
Desktop-first, com grid de cards e leitura rápida (imagem + prévia + status + ações).

## Global Styles (tokens sugeridos)
- Background: #0B0F17 (dark) ou #FFFFFF (light) — manter consistente com o app atual.
- Surface/Card: fundo em alto contraste (ex.: #111827 no dark; #FFFFFF no light) + borda sutil.
- Tipografia: base 14–16px; título do card 16–18px semibold; texto da prévia 14–16px.
- Espaçamento: scale 4/8/12/16/24.
- Botões: primário ("Detalhes") com hover/active; foco visível (outline).
- Links: sublinhado no hover; ícone de "abrir em nova aba" opcional.
- Badge: cores por status (ex.: success/warning/error/neutral) com texto curto.

## Página: Dashboard

### Meta Information
- Title: "Dashboard — Posts"
- Description: "Lista de posts com status e acesso rápido a detalhes e LinkedIn."
- Open Graph: og:title, og:description (espelhando title/description)

### Layout
- Estrutura principal em coluna (header + conteúdo).
- Área de conteúdo com **CSS Grid**:
  - Desktop: 3 colunas (minmax(280px, 1fr)).
  - Tablet: 2 colunas.
  - Mobile: 1 coluna.
- Gaps: 16–24px; largura máxima de conteúdo (ex.: 1200–1440px) com padding lateral.

### Page Structure
1. Header da página
2. Grade de Cards (lista de posts)
3. Estados de lista (carregando / vazio / erro)

### Sections & Components

#### 1) Header da página
- Título: “Posts”
- (Opcional, se já existir no app) Subtítulo curto: “Acompanhe seus posts e status.”

#### 2) Card de Post (componente)
**Container**
- Card clicável (opcional) + ações explícitas no rodapé.
- Elevação leve no hover + borda/outline no focus.

**Topo (imagem)**
- Imagem de capa/preview com proporção fixa (ex.: 16:9) e `object-fit: cover`.
- Fallback quando não houver imagem: bloco com ícone + texto “Sem imagem”.

**Corpo (conteúdo)**
- Prévia do texto: exibir **somente 3 linhas** (line-clamp: 3) com reticências.
- Badge de status: alinhado ao topo direito do corpo ou sobreposto no canto da imagem (manter legibilidade).

**Rodapé**
- Data: alinhada à esquerda (ex.: “28 jan 2026”).
- Ações à direita:
  - Botão primário: “Detalhes”
  - Link secundário: “Ver no LinkedIn” (abre em nova aba, `rel="noopener noreferrer"`).

#### 3) Estados da lista
- Loading: skeleton cards (imagem + linhas + rodapé) mantendo a grade.
- Empty: mensagem “Nenhum post encontrado.”
- Error: mensagem curta + ação de tentar novamente (se o app já tiver padrão).

## Página: Detalhes do Post (página ou modal)

### Meta Information
- Title: “Detalhes do Post”
- Description: “Visualize o conteúdo completo e acesse o LinkedIn.”

### Layout
- Se modal: overlay central, largura 720–900px no desktop; full-screen no mobile.
- Se página: container central com largura máxima e espaçamento confortável.

### Estrutura e componentes
- Cabeçalho: título + badge de status + ação “Fechar/Voltar”.
- Conteúdo: texto completo do post.
- Rodapé: data + link “Ver no LinkedIn” (nova aba).