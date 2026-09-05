# Fase 05 — Criação de produtos

| Status       | Em execução |
|--------------|------------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

**Objetivo e resultado esperado:** permitir que uma sessão válida crie um produto completo, com validação anterior ao transporte, proteção da rota e confirmação segura.
**Capacidade ou fluxo coberto:** acesso a `/products/new` → probe protegido → formulário → `POST /products` → confirmação → recurso ou catálogo.
**Requisitos relacionados:** `AGP-13`, `AGP-14`, `AGP-26` a `AGP-28`, `AGP-37` a `AGP-44`, `EXPECT-01` a `EXPECT-09`.
**Dependências externas:** Fase 04 aprovada; endpoint de produtos, origem autorizada e configuração de imagens disponíveis.

## Tarefa T22 — Definir e testar o schema reutilizável de dados editáveis do produto

Criar o schema de campos públicos para nome de 2 a 100 caracteres, descrição de 1 a 500, preço positivo com até duas casas decimais e URL HTTP(S) com até 2048 caracteres. Definir normalização e conversão de entrada do formulário sem introduzir regra não publicada.

- **Requisitos relacionados:** `AGP-26`, `AGP-27`.
- **Referência ao design:** `DEC-03`, `DEC-11`; seção “Contratos de API”.
- **Dependências:** `T04`.
- **Parte do sistema afetada:** `src/features/products/schemas/product-input-schema.ts`, tipos e testes unitários.
- **Testes e verificações:** cobrir limites, espaços, descrição vazia, preço zero/negativo/com mais de duas casas, protocolos proibidos, tamanho da URL, `null` e chaves desconhecidas.
- **Critérios de conclusão:** dados válidos produzem a forma pública exata do contrato; inválidos não chegam ao gateway; tipos são derivados do schema e reutilizáveis na futura edição.
- **Riscos ou premissas:** preço segue o número aceito pela API; não introduzir formatação monetária que altere precisão ou locale sem teste determinístico.

## Tarefa T23 — Implementar o gateway de criação de produto

Adicionar `POST /products`, validar o `Product` retornado e mapear validação, sessão inválida, origem rejeitada, rate limit e falha não confiável. A função recebe somente o payload completo aprovado e não executa retry automático.

- **Requisitos relacionados:** `AGP-26` a `AGP-28`, `AGP-38` a `AGP-44`, `EXPECT-09`.
- **Referência ao design:** `DEC-01`, `DEC-03`, `DEC-07`, `DEC-08`, `DEC-11`.
- **Dependências:** `T03`, `T22`.
- **Parte do sistema afetada:** gateway de produtos, schema de resposta e mapeador de erros da criação.
- **Testes e verificações:** provar método/payload, `201`, `400`, `401`, `403`, `429`, `Retry-After`, `correlationId`, resposta inválida e uma única tentativa por chamada.
- **Critérios de conclusão:** sucesso só é retornado com produto válido; erro por campo pode voltar ao formulário; não há cabeçalho CSRF, Bearer, retry ou leitura de cookie.
- **Riscos ou premissas:** uma URL válida para a API pode usar origem não autorizada pelo front-end; isso não invalida a criação, mas exige fallback visual.

## Tarefa T24 — Proteger a rota de criação pelo probe mínimo aprovado

Antes de liberar o formulário de `/products/new`, executar uma única `GET /products?limit=1` no navegador. Mostrar loading durante a confirmação, redirecionar em `401` e oferecer retry manual para falha recuperável, sem reaproveitar o resultado como catálogo ou criar endpoint de sessão.

- **Requisitos relacionados:** `AGP-13`, `AGP-14`, `AGP-37`, `AGP-39` a `AGP-43`.
- **Referência ao design:** `DEC-01`, `DEC-04`, `DEC-05`, `DEC-07`, `DEC-08`.
- **Dependências:** `T14`, `T17`.
- **Parte do sistema afetada:** `src/app/(protected)/products/new/page.tsx` e controlador de proteção da tela de criação.
- **Testes e verificações:** testar sucesso, `401`, erro recuperável, aborto e React Strict Mode; observar que o request usa exatamente `limit=1` e não duplica por efeito encadeado.
- **Critérios de conclusão:** formulário não aparece antes da confirmação; `401` volta ao login; o probe não interpreta sessão nem persiste seu resultado; chamadas obsoletas são ignoradas.
- **Riscos ou premissas:** o probe consome uma unidade do rate limit e só pode ser executado quando a rota realmente precisa confirmar sessão.

## Tarefa T25 — Entregar o formulário de criação com feedback persistente

Compor o formulário acessível usando o schema e as primitivas existentes. Manter validação por campo, erro geral e referência de suporte na área afetada; desabilitar o envio durante a mutação; no `201` validado, navegar para `/products/[id]` e exibir ali uma confirmação persistente usando sinal transitório público.

- **Requisitos relacionados:** `AGP-26` a `AGP-28`, `AGP-37` a `AGP-44`, `EXPECT-01` a `EXPECT-06`.
- **Referência ao design:** `DEC-04`, `DEC-07` a `DEC-11`.
- **Dependências:** `T02`, `T23`, `T24`.
- **Parte do sistema afetada:** componentes de formulário em `src/features/products/components`, rota de criação e destino do feedback.
- **Testes e verificações:** testar labels, teclado, foco, validações, preservação de dados corrigíveis, disabled/loading, duplo clique, todos os erros contratados, sucesso, fallback de imagem e sinal sem PII.
- **Critérios de conclusão:** um usuário autenticado cria produto com uma requisição; feedback não depende somente de toast/cor; falha não apaga dados corrigíveis; sucesso só ocorre após resposta validada e termina no detalhe do produto criado.
- **Riscos ou premissas:** o sinal transitório contém apenas um valor enumerado de sucesso; o identificador da rota vem da resposta validada do produto.

## Tarefa T26 — Provar a criação de produto de ponta a ponta

Adicionar testes integrados para proteção da rota, validação, criação bem-sucedida, origem rejeitada, rate limit, sessão expirada, resposta inesperada e presença do novo produto por leitura coerente.

- **Requisitos relacionados:** `AGP-13`, `AGP-14`, `AGP-26` a `AGP-28`, `AGP-37` a `AGP-44`, `EXPECT-07`, `EXPECT-09`.
- **Referência ao design:** `DEC-01`, `DEC-05`, `DEC-08`, `DEC-09`, `DEC-11`, `DEC-12`.
- **Dependências:** `T22` a `T25`.
- **Parte do sistema afetada:** testes unitários/componentes da criação e `e2e/product-create.spec.ts`.
- **Testes e verificações:** criar dados isoláveis, observar a única mutação e confirmar o produto por `GET`; executar gates da fase e buscas por valores sensíveis/cabeçalhos proibidos.
- **Critérios de conclusão:** criação válida é reproduzível; inválida não chama a API; reenvio e retry automático não ocorrem; proteção e feedback possuem evidência objetiva.
- **Riscos ou premissas:** limpeza de dados E2E precisa usar mecanismo autorizado do ambiente e não pode ampliar o escopo da interface.

## Orientações de implementação

## Estado da execução

- T22 — **Concluída**. O schema compartilhado de entrada e o schema de formulário foram adicionados; a resposta de produto reutiliza os mesmos limites dos campos editáveis. Evidências: `npm test -- --run src/features/products/schemas/product-input-schema.spec.ts` (9 testes), `npm run typecheck`, `npm run lint`, `npx prettier --check` nos arquivos alterados e `git diff --check` — todos passaram.
- T23 — **Concluída**. `createProduct` valida o payload, chama `POST /products` uma única vez, valida `201` e mapeia os erros contratados sem cabeçalhos proibidos ou retry. Evidências: `npm test -- --run src/features/products/api/products-gateway.spec.ts` (10 testes), `npm run typecheck`, `npm run lint`, `npx prettier --check` nos arquivos alterados e `git diff --check` — todos passaram.
- T24 — **Concluída**. A rota `/products/new` executa um probe único de `GET /products?limit=1`, trata `401`, erro recuperável, retry manual, aborto e Strict Mode sem duplicação. Evidências: `npm test -- --run src/features/products/components/product-creation-gate.spec.tsx src/features/products/api/products-gateway.spec.ts` (15 testes), `npm run typecheck`, `npm run lint`, `npx prettier --check` nos arquivos alterados e `git diff --check` — todos passaram.
- T25 — **Concluída**. O formulário reutilizável valida todos os campos antes do transporte, foca o primeiro erro, preserva dados corrigíveis, bloqueia duplo envio e exibe erro de campo, erro geral e referência de suporte. A criação bem-sucedida navega para o detalhe validado com o sinal público enumerado `created=success`; a leitura detalhada mínima foi criada como suporte necessário da confirmação, sem antecipar edição ou exclusão. Evidências: `npm test -- --run src/features/products/api/products-gateway.spec.ts src/features/products/schemas/product-input-schema.spec.ts src/features/products/components/product-creation-screen.spec.tsx src/features/products/components/product-detail-screen.spec.tsx` (28 testes), `npm run typecheck`, `npm run lint`, `npx prettier --check` nos arquivos alterados e `git diff --check` — todos passaram.
- T26 — **Concluída**. O E2E determinístico cobre probe protegido com `limit=1`, validação sem mutação, criação única com payload exato, leitura posterior do produto, sessão expirada, origem rejeitada, rate limit e resposta inesperada; os mocks aceitam somente requisições `fetch` da API para não interferir na navegação do Next. Evidência: `npm run test:e2e -- e2e/product-create.spec.ts` (6 testes) — todos passaram.

- Reutilizar o conceito de campos de produto na edição futura, sem criar formulário universal orientado por configuração.
- O probe é uma leitura de autorização, não cache nem carregamento antecipado do catálogo.
- Não tratar falha de renderização da imagem como falha de criação do domínio.

## Testes e verificações da fase

Executar unitários do schema/gateway, testes do formulário, E2E de criação, lint, tipos e build. Validar teclado, foco, zoom, breakpoints e movimento reduzido da rota.

## Critérios de aceitação da fase

1. A rota de criação só libera o formulário depois de uma leitura protegida válida.
2. Todos os campos obedecem aos limites do contrato antes do envio.
3. A mutação ocorre uma única vez, sem retry automático, e trata os status contratados.
4. Sucesso apresenta confirmação segura e o produto pode ser observado por leitura posterior.
5. O fluxo possui cobertura automatizada reproduzível.

## Riscos, premissas e dependências externas da fase

- O probe e o E2E dependem de rate limit e origem corretamente configurados.
- A renderização da imagem depende da allowlist, mas sempre deve existir fallback.
- A conclusão exige `review`; não iniciar a Fase 06 automaticamente.
