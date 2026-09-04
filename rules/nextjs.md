# Regras de Next.js

Estas regras adotam App Router e as práticas da skill Next.js Best Practices da Vercel Labs, adaptadas às ADRs do projeto. Confirmar a versão instalada antes de aplicar APIs que mudam entre versões.

## App Router e arquivos especiais

- Rotas vivem em `src/app` e DEVEM usar as convenções do App Router.
- `page.tsx` e `layout.tsx` permanecem pequenos e focados em composição.
- Usar `loading.tsx`, `error.tsx`, `not-found.tsx` e `global-error.tsx` quando a rota possuir esses estados.
- `error.tsx` e `global-error.tsx` são Client Components; `global-error.tsx` inclui `<html>` e `<body>`.
- Grupos como `(public)` e `(protected)` organizam rotas sem alterar a URL.
- Rotas paralelas exigem `default.tsx` em cada slot. Só adotar rotas paralelas/interceptadas quando o fluxo realmente exigir URL compartilhável e comportamento modal.
- `page.tsx` e `route.ts` NÃO podem coexistir no mesmo segmento.

## Server e Client Components

- Componentes são Server Components por padrão.
- Adicionar `'use client'` somente no menor arquivo que precise de hooks, handlers ou APIs do navegador.
- NÃO tornar uma página inteira cliente apenas porque um formulário ou botão é interativo; mover a interatividade para um filho.
- Client Components NÃO podem ser funções `async`.
- Props que atravessam Server → Client DEVEM ser serializáveis. Converter `Date` para ISO, `Map`/`Set` para estruturas simples e instâncias para objetos planos.
- Funções comuns NÃO atravessam essa fronteira.

Neste projeto, dados autenticados são uma exceção importante ao padrão genérico de leitura no servidor: o cookie é host-only da API e a chamada protegida precisa partir do navegador.

```tsx
// Server Component: metadata e composição estática.
export default function HomePage() {
  return <ProductsScreen />
}

// Client Component: chamada autenticada direta à API.
'use client'

export function ProductsScreen() {
  // Usa a API da feature, que delega ao cliente HTTP compartilhado.
  // Renderiza loading, empty, error ou success.
}
```

## Integração: sem BFF

- NÃO usar Server Actions, Route Handlers, Proxy ou Middleware como intermediários da API NestJS.
- NÃO criar `src/app/api` para autenticação ou produtos.
- Funções em `src/features/*/api` chamam o cliente HTTP compartilhado no navegador.
- Um `401` em fluxo protegido limpa apenas estado local sensível e direciona ao login; a API continua sendo autoridade da sessão.
- Não inferir autorização pela visibilidade de uma rota ou botão.

## APIs assíncronas e versão

- Em Next.js 15+, `params`, `searchParams`, `cookies()` e `headers()` são assíncronos; tipar e aguardar conforme a versão instalada.
- NÃO copiar exemplos de outra versão sem conferir a documentação empacotada/official da versão do projeto.
- Usar o runtime Node.js padrão. Adotar Edge somente com requisito mensurável e compatibilidade comprovada.
- Não habilitar `use cache` ou Cache Components sem decisão específica de cache e suporte da versão instalada.

## Dados e desempenho

- Para conteúdo público em Server Components, iniciar operações independentes juntas com `Promise.all` ou separar streaming com `Suspense`; evitar waterfalls acidentais.
- Para dados autenticados deste projeto, concentrar fetch, cancelamento e tratamento de estado em uma fronteira cliente da feature.
- Requisições disparadas por efeito DEVEM lidar com desmontagem/cancelamento e não podem duplicar chamadas em cascata.
- Não adicionar biblioteca de cache cliente sem necessidade comprovada.
- `useSearchParams()` precisa de boundary `Suspense` em rota estática; `usePathname()` também pode exigir em rotas dinâmicas. O fallback deve preservar a geometria essencial.

## Navegação e URL

- Usar `next/link` para navegação interna.
- Usar hooks de `next/navigation`, nunca APIs do Pages Router.
- Paginação mantém na URL apenas parâmetros públicos e estáveis; cursor opaco não deve ser decodificado.
- Ao fechar uma rota interceptada modal, usar `router.back()` para preservar o histórico.

## Imagens

- Usar `next/image` em vez de `<img>` para conteúdo da aplicação.
- Imagens remotas exigem dimensões ou contêiner com `fill`, sempre com `sizes` coerente.
- `remotePatterns` deve permitir somente protocolos, hosts e caminhos necessários. NÃO liberar hosts arbitrários com wildcard amplo.
- Como `imageUrl` vem da API, uma incompatibilidade entre URLs aceitas pelo back-end e os hosts permitidos pelo Next.js deve ser resolvida no contrato, não por uma configuração insegura.
- Somente imagens realmente críticas acima da dobra recebem carregamento prioritário.
- `alt` descreve a função/conteúdo; imagem decorativa usa `alt=""`.

## Fontes, metadata e scripts

- Carregar Inter e Barlow Condensed uma vez com `next/font`, expor variáveis CSS e aplicar os tokens definidos na ADR-004.
- NÃO usar `@import` remoto ou `<link>` manual para Google Fonts.
- Metadata estática ou `generateMetadata` só vive em Server Components. Usar template de título no layout raiz.
- Usar convenções de arquivo para favicon, Open Graph, robots e sitemap quando entrarem no escopo.
- Scripts externos usam `next/script`; scripts inline têm `id`. Analytics do Google, se solicitado, usa `@next/third-parties`.
- Adiar scripts não críticos e não adicionar terceiros sem avaliar privacidade e custo de carregamento.

## Hidratação e bundle

- NÃO renderizar `window`, `localStorage`, valores aleatórios ou datas dependentes de timezone durante a renderização compartilhada.
- Usar `useId` para IDs estáveis e HTML semanticamente válido.
- Uma biblioteca que depende do navegador deve ficar em uma fronteira cliente; `dynamic(..., { ssr: false })` é último recurso e precisa de justificativa.
- Preferir imports específicos e analisar o bundle antes de otimizar por intuição.
- CSS entra por import do projeto, não por `<link>` manual.
- Não adicionar polyfills já fornecidos pelo Next.js.

## Erros e redirecionamentos

- Tratar erros esperados como estado de UI; lançar erros inesperados para a boundary adequada.
- `redirect()`, `notFound()` e APIs equivalentes lançam sinais internos. NÃO capturá-los em `try/catch`; chamar fora do bloco ou relançar pelo mecanismo suportado na versão.
- Mensagens apresentadas ao usuário não expõem stack, payload interno, segredo ou token.
- `correlationId` pode ser exibido como referência de suporte.

## Diagnóstico

- Antes de corrigir um problema, ler o erro completo do terminal e do overlay.
- Confirmar a porta real do dev server; não assumir `3000`.
- Em versões que suportam as ferramentas de desenvolvimento do Next.js, usá-las para inspecionar rotas e erros.
- Validar sempre com build completo antes da entrega, mesmo quando uma rota isolada foi usada durante o diagnóstico.
