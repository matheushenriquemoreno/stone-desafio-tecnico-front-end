# Bug — Feedback persistente e ações quebradas na edição

| Status       | Resolvido  |
| ------------ | ---------- |
| Created      | 2026-09-06 |
| Last Updated | 2026-09-06 |

## Comportamento esperado e observado

**Esperado:** após atualizar um produto, exibir uma confirmação transitória em
toast por aproximadamente 10 segundos. Na edição, `Cancelar` deve permanecer à
direita de `Salvar alterações` quando houver largura disponível.

**Observado:** a confirmação é um `Alert` persistente dentro do conteúdo e
continua visível ao abrir novamente a edição do mesmo produto. `Cancelar` é
renderizado fora do formulário e aparece em uma linha separada mesmo em telas
largas.

## Contexto e evidências

- **Entradas:** editar um produto, salvar uma alteração, retornar ao detalhe e
  abrir a edição novamente.
- **Ambiente:** Next.js 16.3.4, React 19.2.8, Tailwind CSS 4.3.3 e shadcn/ui Base
  UI.
- **Frequência:** sempre após uma atualização bem-sucedida; a quebra das ações
  também ocorre sempre na composição atual.
- **Evidências:** capturas fornecidas pelo usuário; `ProductDetailScreen` guarda
  `updatedConfirmation` em estado local e o renderiza como `Alert`;
  `ProductEditForm` renderiza `Cancelar` depois do `ProductForm`, fora do
  elemento `form` que contém a ação principal.

## Reprodução

1. Abrir o detalhe de um produto autenticado.
2. Entrar em `Editar produto`, alterar um campo e salvar.
3. Confirmar que `Produto atualizado` aparece como bloco no fluxo do detalhe.
4. Clicar em `Editar produto` novamente e observar que o bloco continua acima
   do formulário.
5. Em largura desktop, observar que `Cancelar` fica abaixo de
   `Salvar alterações`.

**Confirmação:** sim. Antes da correção, o teste direcionado apresentou duas
falhas pelo motivo esperado: nenhuma chamada ao gerenciador de toast e
`Cancelar` sem associação ao formulário que contém `Salvar alterações`.

## Hipóteses testadas e resultados

| #   | Hipótese                                                              | Teste (uma variável por vez)                                            | Resultado                                                                                       |
| --- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| H1  | O feedback persiste porque pertence ao estado da tela.                | Inspecionar a transição após `onProductUpdated` e a abertura da edição. | Confirmada no código: `updatedConfirmation` vira `true` e não é limpo por `setIsEditing(true)`. |
| H2  | A quebra decorre de falta de largura.                                 | Inspecionar a árvore das ações em vez do viewport.                      | Refutada: os botões nem sequer compartilham o mesmo `form`/contêiner de ações.                  |
| H3  | O projeto já possui toast compatível que apenas não está sendo usado. | Conferir `components.json`, `shadcn info` e componentes instalados.     | Refutada: a base é Base UI e `toast` ainda não estava instalado.                                |

## Causa raiz confirmada

A confirmação de atualização foi modelada como estado persistente da tela e
renderizada como conteúdo estrutural. Em paralelo, o componente reutilizável de
formulário é dono apenas do submit, deixando a ação de cancelamento fora da
mesma composição de ações.

## Proposta de correção

Usar o toast oficial do shadcn/ui para Base UI, montado uma vez no layout raiz,
e disparar um toast de sucesso com `timeout: 10000` ao concluir o `PATCH`.
Remover o estado/`Alert` de sucesso da tela. Permitir que `ProductForm` receba
uma ação secundária e renderize as duas ações em um contêiner responsivo comum,
com `Cancelar` depois do submit.

## Teste de regressão

- Confirmar que a atualização dispara toast de sucesso com título, descrição e
  timeout de 10 segundos, sem criar `Alert` persistente.
- Reabrir a edição e confirmar que o feedback não faz parte do conteúdo do
  formulário.
- Confirmar que `Salvar alterações` e `Cancelar` pertencem ao mesmo formulário;
  validar no navegador que ficam lado a lado em largura desktop.

## Validações realizadas

- Teste de regressão antes da correção: `product-detail-screen.spec.tsx`
  apresentou 2 falhas e 11 testes aprovados; `toast.add` teve zero chamadas e o
  botão `Cancelar` possuía `form === null`.
- Correção aplicada: `toast.tsx` oficial do shadcn/ui Base UI foi adicionado e
  montado no layout raiz; `ProductDetailScreen` dispara somente a confirmação
  transitória com `timeout: 10_000`; `ProductForm` e `ProductEditForm` passaram a
  compor as ações no mesmo formulário em uma linha responsiva a partir de `sm`.
- Teste de regressão depois: `product-detail-screen.spec.tsx` passou com 13
  testes; confirmou a chamada ao toast, a ausência de `Alert` persistente ao
  reabrir a edição e a associação dos dois botões ao mesmo formulário.
- Reprodução original: E2E direcionado passou com servidor controlado; o toast
  ficou visível após a atualização, não houve `Alert` de atualização e o toast
  foi removido dentro de 12 segundos. A mesma jornada confirmou `Cancelar` à
  direita e alinhado ao `Salvar alterações` em viewport desktop.
- Testes relevantes do projeto: Vitest completo passou (24 arquivos, 175
  testes); Playwright completo passou (19 testes e 4 skips previstos);
  `npm run lint`, `npm run typecheck`, `npm run build` e `git diff --check`
  passaram. `npm run format:check` global continua apontando somente a
  alteração preexistente em `next-env.d.ts`, preservada fora desta correção.

## Riscos e prevenções futuras

- A confirmação transitória não substituirá erros persistentes de formulário;
  somente o sucesso solicitado migrará para toast.
- A disposição continuará mobile-first: poderá empilhar em telas estreitas, mas
  não deverá quebrar quando houver largura para as duas ações.
