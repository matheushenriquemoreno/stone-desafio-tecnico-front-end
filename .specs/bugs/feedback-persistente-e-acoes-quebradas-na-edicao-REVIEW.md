# Review — Feedback persistente e ações quebradas na edição

| Status       | Aprovado   |
| ------------ | ---------- |
| Created      | 2026-09-06 |
| Last Updated | 2026-09-06 |

**Escopo revisado:** correção do bug
`feedback-persistente-e-acoes-quebradas-na-edicao`
**Versão da avaliação:** 1

## Artefatos analisados

- Relatório do bug:
  `.specs/bugs/feedback-persistente-e-acoes-quebradas-na-edicao.md`.
- Implementação: `src/components/ui/toast.tsx`, `src/app/layout.tsx`,
  `product-detail-screen.tsx`, `product-form.tsx` e `product-edit-form.tsx`.
- Testes: `product-detail-screen.spec.tsx` e
  `e2e/product-detail-mutations.spec.ts`.
- Requisitos/decisões aplicáveis: `AGENTS.md`, regras locais de Next.js,
  Tailwind, shadcn/ui e testes, além da ADR-004.
- PRD, design técnico, plano e estado de implementação: dispensados; o fluxo
  é uma correção de bug limitada à apresentação e ao feedback de uma mutação já
  existente.

## Resumo executivo

A revisão confirmou a causa registrada e verificou que a confirmação de
atualização agora usa a primitiva Toast Base UI oficial, com timeout explícito de
10 segundos, sem estado estrutural persistente. A edição compõe `Salvar
alterações` e `Cancelar` no mesmo formulário e o E2E confirmou alinhamento no
desktop. Não foram encontrados achados bloqueadores ou altos; o bug está
fechado.

## Resultado das verificações obrigatórias

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Requisitos do bug | Atendida | Relatório e código removem `updatedConfirmation`/`Alert` e definem `timeout: 10_000`. |
| Critérios de aceitação | Atendida | Teste de componente cobre toast, ausência de alert ao reabrir e associação dos botões; E2E cobre duração e geometria. |
| Testes | Atendida | Vitest completo: 24 arquivos/175 testes; Playwright completo: 19 testes aprovados/4 skips previstos. |
| Design técnico | Dispensado | Sem mudança de arquitetura ou contrato de API; consumo continua direto no navegador. |
| Plano | Dispensado | Correção pontual fora de fase planejada. |
| Escopo | Atendida | Diff limitado ao toast, composição de ações, testes e relatório; `next-env.d.ts` preexistente não foi incluído. |
| Qualidade | Atendida | `npm run lint`, `npm run typecheck`, `npm run build` e `git diff --check` passaram. |
| Padrões do projeto | Atendida | `components.json`/`shadcn info` confirmam Base UI; toast oficial foi instalado via CLI e adaptado aos tokens locais. |
| Manutenibilidade | Atendida | A ação secundária é uma prop explícita de `ProductForm`; não há duplicação ou camada intermediária. |
| Riscos transversais | Atendida | Toast global é montado no layout raiz; erros de formulário continuam como `Alert`; E2E validou sessão e mutações sem alteração de API. |

## Matriz de rastreabilidade

| Requisito | Código | Teste | Evidência | Status |
| --- | --- | --- | --- | --- |
| Sucesso de atualização é transitório | `product-detail-screen.tsx` + `toast.tsx` | `product-detail-screen.spec.tsx` e E2E de mutações | Chamada com título, descrição, tipo `success` e `timeout: 10_000`; toast oculto após o timeout no navegador | Comprovado |
| Não persistir confirmação ao reabrir edição | `product-detail-screen.tsx` | Teste de componente de atualização | Não existe mais `Alert` de atualização após clicar novamente em `Editar produto` | Comprovado |
| Toast disponível em todas as rotas | `app/layout.tsx` | E2E da jornada de detalhe | `<Toaster />` no layout raiz e toast visível após `PATCH` | Comprovado |
| Cancelar ao lado do submit em desktop | `product-form.tsx` + `product-edit-form.tsx` | Componente e E2E de mutações | Botões compartilham `form`; bounding boxes têm mesma linha e `Cancelar` fica à direita em viewport desktop | Comprovado |
| Responsividade e acessibilidade preservadas | `product-form.tsx`, `toast.tsx` | `accessibility.spec.ts` e Playwright completo | Jornada de edição acessível; controles mantêm nome, foco e empilhamento mobile-first | Comprovado |

## Achados

Nenhum achado bloqueador, alto, médio ou baixo.

## Riscos residuais e ressalvas aceitas

- `npm run format:check` global continua falhando somente em `next-env.d.ts`,
  alteração preexistente e fora do escopo desta correção; os arquivos alterados
  foram formatados individualmente e `git diff --check` passou.
- O E2E completo emitiu aviso de hidratação associado a atributo de extensão do
  navegador (`data-lt-installed`); não houve falha de teste e o aviso não é
  introduzido pelo diff revisado.

## Veredito

**Veredito:** Aprovado

**Fundamentação:** a reprodução original falhou antes da correção pelos dois
motivos registrados e passou depois; os testes cobrem o timeout, a remoção do
feedback persistente, a associação das ações e o layout responsivo. Os gates
automatizados aplicáveis passaram, sem achados que impeçam o fechamento.

## Próxima ação

Bug fechado. Nenhuma correção adicional é necessária neste escopo.

## Histórico de revisões anteriores

Nenhuma avaliação anterior deste bug.
