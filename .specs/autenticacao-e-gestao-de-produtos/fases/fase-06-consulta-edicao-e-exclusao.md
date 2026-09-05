# Fase 06 — Consulta, edição e exclusão

| Status       | Pronta para review |
|--------------|------------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

**Objetivo e resultado esperado:** completar o CRUD com consulta protegida, patch mínimo, confirmação destrutiva e atualização coerente do catálogo.
**Capacidade ou fluxo coberto:** `/products/[id]` → consulta → edição parcial ou confirmação de exclusão → sucesso, não encontrado ou retorno seguro ao catálogo.
**Requisitos relacionados:** `AGP-14`, `AGP-29` a `AGP-44`, `EXPECT-01` a `EXPECT-09`.
**Dependências externas:** Fase 05 aprovada; endpoints de item compatíveis e dados E2E isoláveis.

## Tarefa T27 — Implementar consulta e estado de detalhe do produto

Adicionar `GET /products/:id` ao gateway e compor `/products/[id]` para validar a sessão pela própria leitura. Representar loading, sucesso, erro recuperável, `401` e `404`; o estado não encontrado substitui o conteúdo anterior e oferece retorno ao catálogo.

- **Requisitos relacionados:** `AGP-14`, `AGP-29`, `AGP-36`, `AGP-37`, `AGP-39` a `AGP-44`.
- **Referência ao design:** `DEC-01`, `DEC-03` a `DEC-05`, `DEC-07`, `DEC-10`, `DEC-11`.
- **Dependências:** `T14`, `T20`, `T23`.
- **Parte do sistema afetada:** gateway de produtos, `src/app/(protected)/products/[id]/page.tsx` e controlador/tela de detalhe.
- **Testes e verificações:** testar ID da rota, `200`, `401`, `404`, `429`, rede, schema inválido, retry/aborto, fallback de imagem, foco e retorno ao catálogo.
- **Critérios de conclusão:** produto só aparece após validação; `401` vai ao login; `404` remove ações inválidas; erro recuperável mantém retry manual e `correlationId` seguro.
- **Riscos ou premissas:** APIs assíncronas de `params` devem seguir a versão instalada do Next.js; a fronteira cliente recebe somente valores serializáveis.

## Tarefa T28 — Produzir somente o patch correspondente a campos alterados

Derivar do schema de produto um contrato de edição que compare valores iniciais e atuais, aceite qualquer subconjunto válido e gere payload apenas com os campos efetivamente alterados. Bloquear patch vazio, `null` e propriedades desconhecidas antes do transporte.

- **Requisitos relacionados:** `AGP-30` a `AGP-32`.
- **Referência ao design:** `DEC-03`; seções “Criação, edição e exclusão” e “Contratos de API”.
- **Dependências:** `T22`, `T27`.
- **Parte do sistema afetada:** schema/mapeador de patch e testes unitários em `src/features/products`.
- **Testes e verificações:** cobrir alteração individual de cada campo, múltiplas alterações, nenhuma alteração, retorno ao valor original, omissão, `null`, desconhecidos e normalização consistente.
- **Critérios de conclusão:** payload vazio nunca é enviado; omitidos permanecem ausentes; somente campos públicos e alterados compõem o patch; testes provam que demais valores não são modificados.
- **Riscos ou premissas:** comparação deve ocorrer sobre a forma normalizada para não enviar mudança semântica inexistente.

## Tarefa T29 — Entregar a edição com confirmação e estados seguros

Preencher o formulário com o produto validado, permitir alterar um ou mais campos, aplicar o patch mínimo e bloquear reenvio. Em `200`, atualizar a visão com a resposta validada e manter confirmação persistente; em `404`, substituir o formulário pelo estado não encontrado.

- **Requisitos relacionados:** `AGP-30` a `AGP-33`, `AGP-36` a `AGP-44`, `EXPECT-01` a `EXPECT-06`.
- **Referência ao design:** `DEC-04`, `DEC-07` a `DEC-11`.
- **Dependências:** `T02`, `T27`, `T28`.
- **Parte do sistema afetada:** formulário/controlador de edição e feedback na rota de detalhe.
- **Testes e verificações:** testar preenchimento inicial, campo individual, patch vazio, validação, disabled/loading, duplo clique, `400`, `401`, `403`, `404`, `429`, fallback e confirmação após sucesso.
- **Critérios de conclusão:** nenhum request ocorre sem mudança; `PATCH` contém somente diferenças; resposta de sucesso vira a fonte atual da tela; erros preservam dados corrigíveis e não expõem detalhes.
- **Riscos ou premissas:** edição concorrente não possui controle de versão no contrato; a resposta da API é a autoridade final exibida.

## Tarefa T30 — Exigir confirmação acessível antes da exclusão

Adicionar uma ação destrutiva que abre `AlertDialog` com título, descrição, cancelar e confirmar. Cancelar não produz efeito; confirmar é a única origem da chamada de exclusão; foco e teclado permanecem sob a primitiva incorporada.

- **Requisitos relacionados:** `AGP-34`, `AGP-37`, `AGP-38`, `EXPECT-01`, `EXPECT-05`, `EXPECT-06`.
- **Referência ao design:** `DEC-08`, `DEC-10`.
- **Dependências:** `T02`, `T27`.
- **Parte do sistema afetada:** componente de confirmação destrutiva e integração na tela de detalhe.
- **Testes e verificações:** testar abrir, Escape/cancelar, confirmar, foco inicial e devolução de foco, nome acessível, disabled/loading e acionamento único.
- **Critérios de conclusão:** exclusão nunca ocorre antes da confirmação explícita; cancelamento não chama o gateway; diálogo funciona integralmente por teclado e não usa `z-index` manual.
- **Riscos ou premissas:** o texto confirma o produto alvo sem depender somente de cor ou ícone.

## Tarefa T31 — Implementar exclusão e reconciliação do catálogo

Adicionar `DELETE /products/:id` sem retry automático. Em `204`, apresentar confirmação transitória segura no catálogo, reiniciar a listagem pela primeira página e descartar a pilha de cursores para evitar página obsoleta. Tratar `401`, `403`, `404`, `429` e falha não confiável no contexto do diálogo/tela.

- **Requisitos relacionados:** `AGP-25`, `AGP-35` a `AGP-44`.
- **Referência ao design:** `DEC-03`, `DEC-06` a `DEC-10`; fluxo “Criação, edição e exclusão”.
- **Dependências:** `T14`, `T19`, `T30`.
- **Parte do sistema afetada:** gateway de exclusão, estado do detalhe, sinal de sucesso e reinício do catálogo.
- **Testes e verificações:** provar método/caminho, `204`, clique único, reset sem cursor, `401`, `403`, `404`, `429`, `Retry-After`, `correlationId` e falha de rede.
- **Critérios de conclusão:** sucesso retorna ao catálogo na primeira página e confirma a remoção; `404` informa que o recurso não existe mais; falha mantém contexto seguro; nenhuma mutação é repetida automaticamente.
- **Riscos ou premissas:** reiniciar a listagem é preferido à remoção otimista porque o catálogo é compartilhado e a paginação pode ter mudado.

## Tarefa T32 — Provar consulta, patch e exclusão de ponta a ponta

Adicionar cenários E2E que criem um produto isolado, consultem, editem um único campo preservando os demais, cancelem e confirmem a exclusão, verifiquem o retorno ao catálogo e cubram recurso desaparecido e sessão expirada.

- **Requisitos relacionados:** `AGP-29` a `AGP-44`, `EXPECT-07`, `EXPECT-09`.
- **Referência ao design:** `DEC-01`, `DEC-05`, `DEC-08`, `DEC-09`, `DEC-12`.
- **Dependências:** `T27` a `T31`.
- **Parte do sistema afetada:** testes unitários/componentes do detalhe e `e2e/product-detail-mutations.spec.ts`.
- **Testes e verificações:** observar payload parcial, número de requests, foco do diálogo e reset da paginação; executar gates e busca residual de segredos/cabeçalhos proibidos.
- **Critérios de conclusão:** CRUD completo é reproduzível; campos omitidos permanecem intactos; exclusão só ocorre após confirmação; `404` e `401` seguem os caminhos aprovados.
- **Riscos ou premissas:** preparação e limpeza do produto de teste usam mecanismo autorizado e não dependem da ordem de outras suítes.

## Orientações de implementação

- A rota de detalhe serve consulta e edição; não criar telas duplicadas sem necessidade.
- Reutilizar o schema base, mas manter a regra de patch em função/mapeador próprio e testável.
- Depois de excluir, reiniciar o catálogo evita inconsistência com cursores e mudanças concorrentes.

## Estado da execução

- T27 — **Concluída**. A leitura `GET /products/:id` valida a resposta antes de renderizar, separa loading, sucesso, não encontrado, não autorizado e erro recuperável, permite retry manual, exibe `correlationId` seguro e oferece retorno ao catálogo. A implementação mínima da rota foi antecipada na T25 para suportar a confirmação da criação. Evidências: `npm test -- --run src/features/products/api/products-gateway.spec.ts src/features/products/components/product-detail-screen.spec.tsx` (19 testes), `npm run typecheck`, `npm run lint` e `npx prettier --check` nos arquivos alterados — todos passaram.
- T28 — **Concluída**. O `productPatchSchema` e `buildProductPatch` validam valores públicos, comparam a forma normalizada, rejeitam patch vazio, `null` e chaves desconhecidas e retornam somente campos alterados. Evidências: `npm test -- --run src/features/products/product-patch.spec.ts` (9 testes), `npm run typecheck`, `npm run lint` e `npx prettier --check` nos arquivos alterados — todos passaram.
- T29 — **Concluída**. A edição foi integrada à tela de detalhe com formulário preenchido pela resposta validada, patch mínimo, confirmação persistente, bloqueio de duplo envio, preservação de valores corrigíveis e estados seguros para `400`, `401`, `403`, `404`, `429` e falhas não confiáveis. Evidências: `npm test -- --run` (156 testes), `npm run typecheck`, `npm run lint`, `npx prettier --check` nos arquivos alterados e `git diff --check` — todos passaram.
- T30 — **Concluída**. A confirmação destrutiva foi criada com `AlertDialog` Base UI/shadcn, incluindo nome do produto, cancelamento por botão/Escape, foco gerenciado pela primitiva e ações desabilitadas durante confirmação. Evidências: `npm test -- --run src/features/products/components/product-delete-dialog.spec.tsx` (3 testes), `npm run typecheck` e `npx prettier --check` — todos passaram.
- T31 — **Concluída**. A exclusão foi ligada diretamente ao gateway com `DELETE /products/:id`, sem retry automático; o detalhe trata `204`, `401`, `403`, `404`, `429` e falhas seguras, e o catálogo retorna à primeira página sem cursor com confirmação pública. Evidências: `npm test -- --run` (169 testes), `npm run typecheck`, `npm run lint`, `npm run format:check` e `git diff --check` — todos passaram.
- T32 — **Concluída**. O ciclo E2E cobre criação isolada pelo fluxo de UI, consulta, edição parcial com campos omitidos preservados, cancelamento sem mutação, exclusão confirmada, retorno ao catálogo sem cursor, `404` e `401`. Evidências: `npm run test:e2e -- e2e/product-detail-mutations.spec.ts` (3 testes), `npm test -- --run` (169 testes), `npm run typecheck`, `npm run lint`, `npm run format:check` e `git diff --check` — todos passaram.

## Testes e verificações da fase

Executar unitários de patch/gateways, testes de componentes da tela e diálogo, E2E do ciclo completo, lint, tipos e build. Validar todos os estados por teclado, foco, zoom e breakpoints.

## Critérios de aceitação da fase

1. Consulta válida apresenta o produto; `401` e `404` têm destinos seguros.
2. Edição envia somente campos alterados e bloqueia patch vazio.
3. Exclusão requer confirmação acessível e uma única mutação.
4. Sucesso da exclusão reinicia o catálogo sem cursor e apresenta confirmação.
5. Consulta, edição, exclusão e recursos desaparecidos possuem cobertura reproduzível.

## Riscos, premissas e dependências externas da fase

- O catálogo compartilhado pode mudar durante a edição; a interface sempre adota a resposta final da API.
- O E2E precisa isolar seus dados para não produzir `404` ou paginação flutuante acidental.
- A conclusão exige `review`; não iniciar a Fase 07 automaticamente.
