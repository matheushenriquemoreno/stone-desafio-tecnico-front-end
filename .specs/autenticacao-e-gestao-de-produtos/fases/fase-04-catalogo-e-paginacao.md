# Fase 04 — Catálogo e paginação sequencial

| Status       | Em execução |
| ------------ | ----------- |
| Created      | 2026-09-05  |
| Last Updated | 2026-09-05  |

**Objetivo e resultado esperado:** completar a página inicial protegida com apresentação responsiva do catálogo, estados explícitos e navegação anterior/próxima por cursor opaco.
**Capacidade ou fluxo coberto:** primeira página → vazio ou itens → próxima por `nextCursor` → retorno por cursor visitado → reinício seguro quando a sequência é perdida.
**Requisitos relacionados:** `AGP-17` a `AGP-25`, `AGP-37`, `AGP-39` a `AGP-44`, `EXPECT-01` a `EXPECT-09`.
**Dependências externas:** Fase 03 aprovada; endpoint de listagem compatível; origens de imagem conhecidas por ambiente.

## Tarefa T17 — Completar os estados observáveis da listagem

Evoluir a tela inicial para representar carregamento, primeira página vazia, sucesso, erro recuperável e sessão inválida como estados mutuamente exclusivos. Apresentar `items` e `total` recebidos sem inferir total de páginas ou ordenação global; o vazio oferece a ação de criar produto.

- **Requisitos relacionados:** `AGP-17` a `AGP-19`, `AGP-37`, `AGP-39` a `AGP-43`.
- **Referência ao design:** `DEC-03`, `DEC-04`, `DEC-07`, `DEC-10`; componente “Controladores de tela de produtos”.
- **Dependências:** `T06`, `T14`.
- **Parte do sistema afetada:** controlador da listagem, `ProductList`, estados de loading/empty/error e componentes de apresentação.
- **Testes e verificações:** testar cada variante discriminada, retry manual, total independente do número de itens, vazio apenas na primeira página e respostas atrasadas/abortadas.
- **Critérios de conclusão:** somente um estado é renderizado por vez; erro relevante permanece visível; retry de leitura é manual; não existe cálculo de total de páginas.
- **Riscos ou premissas:** uma página posterior vazia por alteração concorrente deve permitir retorno/reinício, não fingir que o catálogo inteiro está vazio.

## Tarefa T18 — Implementar a pilha de cursores e os controles sequenciais

Criar o estado de paginação em memória com cursor de requisição por índice, página corrente e `nextCursor` recebido. `Próxima` só avança quando existe continuidade; `Anterior` só retorna a posições visitadas; nenhum cursor é decodificado, persistido ou reconstruído.

- **Requisitos relacionados:** `AGP-18`, `AGP-20` a `AGP-24`, `AGP-37`, `AGP-42`.
- **Referência ao design:** `DEC-04`, `DEC-06`, `DEC-08`; fluxo “Listagem e paginação”.
- **Dependências:** `T17`.
- **Parte do sistema afetada:** estado/hook de paginação da feature, controles de paginação e gateway de listagem.
- **Testes e verificações:** testar primeira página, avanço, retorno, fim, cliques rápidos, erro/aborto, cursor reenviado byte a byte e impossibilidade de saltar para posição inédita.
- **Critérios de conclusão:** botões respeitam disponibilidade; posição visitada é correta; cursor nunca aparece como dado interpretado; resposta obsoleta não substitui página mais recente.
- **Riscos ou premissas:** um cursor inválido ou expirado recebe `400`, descarta a sequência e oferece retorno seguro à primeira página.

## Tarefa T19 — Sincronizar somente a posição pública com a URL

Representar na URL apenas o índice humano da página visitada, mantendo cursores exclusivamente em memória. Em reload, deep link impossível ou divergência entre URL e pilha, canonicalizar a navegação para a primeira página sem cursor.

- **Requisitos relacionados:** `AGP-23` a `AGP-25`.
- **Referência ao design:** `DEC-06`; seções “Navegação e URL” e “Listagem e paginação”.
- **Dependências:** `T18`.
- **Parte do sistema afetada:** controlador de paginação, integração com `next/navigation` e testes da URL.
- **Testes e verificações:** cobrir reload na primeira e em página posterior, URL inválida, botão voltar/avançar do navegador e descarte intencional da sequência; verificar que nenhum cursor entra na URL ou storage.
- **Critérios de conclusão:** URL indica posição sem prometer acesso aleatório; estado perdido retorna à primeira página; sequência reiniciada solicita listagem sem cursor.
- **Riscos ou premissas:** a canonicalização não deve criar loop de navegação nem chamada duplicada em desenvolvimento.

## Tarefa T20 — Entregar cartões e imagens de produto com fallback seguro

Criar a apresentação reutilizável dos itens com nome, descrição, preço e imagem. Configurar `next/image` apenas para origens explicitamente autorizadas por ambiente, com dimensões e `sizes` coerentes; URL fora da allowlist ou falha de carregamento usa fallback acessível sem proxy.

- **Requisitos relacionados:** `AGP-17`, `AGP-18`, `AGP-37`, `AGP-42`, `AGP-44`, `EXPECT-01` a `EXPECT-06`, `EXPECT-10`.
- **Referência ao design:** `DEC-10`, `DEC-11`; componente “Boundary de imagens de produto”.
- **Dependências:** `T02`, `T17`.
- **Parte do sistema afetada:** `ProductCard`, formatador determinístico de preço, boundary/fallback de imagem e configuração segura do Next.js.
- **Testes e verificações:** testar URL permitida, origem bloqueada, erro de imagem, texto alternativo, formatação monetária, grade responsiva, zoom/reflow e ausência de wildcard amplo.
- **Critérios de conclusão:** todos os itens permanecem compreensíveis sem imagem; a allowlist é explícita; cartões usam tokens e chave estável; ação essencial não depende de hover.
- **Riscos ou premissas:** as origens concretas precisam ser fornecidas por ambiente; uma origem nova exige mudança de configuração revisada, não liberação genérica.

## Registro de T19

- `pagination.ts` valida `page` como posição humana positiva e serializa a posição visitada sem inserir cursores na URL.
- `ProductsScreen` publica `/?page=N` ao avançar ou retornar, restaura apenas posições existentes na pilha em memória e trata reload/deep link impossível ou divergência com canonicalização para `/` e nova leitura sem cursor.
- O boundary `Suspense` mantém a leitura de `useSearchParams` compatível com o build do App Router; a pilha continua efêmera e nenhuma posição/cursor é persistida em storage.
- Verificação: `npm test -- --run 'src/features/products/pagination.spec.ts' 'src/features/products/components/products-screen.spec.tsx'` (18 testes), `npm run typecheck`, `npm run lint` e `git diff --check` — todos passaram.

## Tarefa T21 — Provar paginação e estados do catálogo

Consolidar testes de componente e E2E para lista vazia, múltiplas páginas, retorno, fim da sequência, reload, cursor inválido, retry e sessão expirada durante navegação.

- **Requisitos relacionados:** `AGP-17` a `AGP-25`, `AGP-37`, `AGP-39` a `AGP-44`, `EXPECT-07`, `EXPECT-09`.
- **Referência ao design:** `DEC-05`, `DEC-06`, `DEC-07`, `DEC-08`, `DEC-11`, `DEC-12`.
- **Dependências:** `T17` a `T20`.
- **Parte do sistema afetada:** testes da feature e `e2e/product-pagination.spec.ts`.
- **Testes e verificações:** controlar dataset com mais de uma página; observar requests e confirmar o cursor opaco; executar gates completos e revisar responsividade/teclado dos controles.
- **Critérios de conclusão:** cenários provam anterior/próxima sem salto, posição atual, fim, reinício e fallback; cursores não vazam; sessão inválida retorna ao login.
- **Riscos ou premissas:** o ambiente E2E precisa oferecer dados determinísticos suficientes para mais de uma página.

## Orientações de implementação

- Usar união discriminada para o estado da leitura e manter paginação próxima da tela que a consome.
- Não persistir cursor em query string, storage, cookie ou estado global.
- Separar `ProductList`, `ProductCard` e estados quando cada responsabilidade existir; evitar wrappers sem semântica.

## Registro de T17

- `ProductsViewState` agora representa explicitamente `loading`, `empty`, `success`, `error` e `unauthorized`; somente o estado correspondente é renderizado por vez.
- `ProductsEmpty` diferencia catálogo vazio de erro e oferece o link acessível `Criar produto` para a rota planejada.
- A listagem preserva `items` e `total` recebidos, sem calcular páginas ou inferir ordenação; falha de rede/resposta inválida mantém retry manual e `401` usa a política da Fase 03.
- Verificação: `npm test -- --run 'src/features/products/components/products-screen.spec.tsx'` (6 testes), `npm run typecheck`, `npm run lint`, `npx prettier --check` nos arquivos alterados e `git diff --check` — todos passaram.

## Registro de T18

- `src/features/products/pagination.ts` modela a sequência em memória: primeira posição sem cursor, cursores recebidos por índice, avanço somente com `nextCursor`, retorno somente a índice visitado e substituição de ramos futuros obsoletos.
- `ProductsScreen` envia o cursor opaco byte a byte, desabilita controles enquanto carrega, cancela/ignora respostas obsoletas e trata `400` de cursor inválido ou página posterior vazia reiniciando sem cursor.
- `pagination.spec.ts` cobre início, avanço, retorno, fim, ramo obsoleto e opacidade; `products-screen.spec.tsx` cobre três páginas, controles, retorno e reinício após `400`.
- Verificação: `npm test -- --run 'src/features/products/pagination.spec.ts' 'src/features/products/components/products-screen.spec.tsx'` (12 testes), `npm run typecheck`, `npm run lint`, `npx prettier --check` nos arquivos alterados e `git diff --check` — todos passaram.

## Testes e verificações da fase

Executar unitários de paginação e formatação, componentes da lista, E2E paginado, lint, tipos e build. Validar manualmente teclado, foco, zoom de 200% e breakpoints pequeno, médio e grande.

## Critérios de aceitação da fase

1. A primeira página apresenta itens e total ou um vazio acionável.
2. Próxima e Anterior funcionam somente sobre cursores recebidos e posições visitadas.
3. A posição pública é indicada sem expor cursor nem inferir total de páginas.
4. Perda ou invalidação da sequência reinicia de forma segura.
5. Cartões e imagens preservam acessibilidade, segurança e responsividade.

## Riscos, premissas e dependências externas da fase

- Cursores e dataset são controlados pela API e podem mudar entre leituras; a interface não promete snapshot global.
- Origens de imagem devem ser governadas antes do ambiente publicado.
- A conclusão exige `review`; não iniciar a Fase 05 automaticamente.
