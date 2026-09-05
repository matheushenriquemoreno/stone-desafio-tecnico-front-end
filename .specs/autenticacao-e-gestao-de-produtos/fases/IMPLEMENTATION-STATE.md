# Estado da Implementação — Interface web de autenticação e gestão de produtos

| Status       | Aguardando novo review |
|--------------|------------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

## Fase ativa

Fase 02 — Cadastro e autenticação pública completa — correções A-01, A-02 e A-03 implementadas; aguardando novo review independente.

Uma fase é executada por vez. Ao concluir suas tarefas e evidências, a fase deve passar por `review` independente antes que a próxima seja marcada como ativa.

## Fases

| #  | Fase | Arquivo | Status | Concluída em |
|----|------|---------|--------|--------------|
| 01 | Fundação e tracer bullet autenticado | fases/fase-01-fundacao-e-tracer-bullet.md | Concluída | 2026-09-05 |
| 02 | Cadastro e autenticação pública completa | fases/fase-02-cadastro-e-autenticacao-publica.md | Aguardando correção | — |
| 03 | Sessão protegida e logout | fases/fase-03-sessao-protegida-e-logout.md | Pendente | — |
| 04 | Catálogo e paginação sequencial | fases/fase-04-catalogo-e-paginacao.md | Pendente | — |
| 05 | Criação de produtos | fases/fase-05-criacao-de-produtos.md | Pendente | — |
| 06 | Consulta, edição e exclusão | fases/fase-06-consulta-edicao-e-exclusao.md | Pendente | — |
| 07 | Robustez e prontidão operacional | fases/fase-07-robustez-e-prontidao-operacional.md | Pendente | — |

## Tarefas

| ID  | Fase | Status | Evidências |
|-----|------|--------|------------|
| T01 | 01 | Concluída | `npm install`; `npm audit --omit=optional`; `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run build`; `npm run test:e2e`; `npm run format:check` — todos passaram. |
| T02 | 01 | Concluída | `npx shadcn@latest info --json`; `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run build`; `npm run test:e2e`; `npm run format:check` — todos passaram. |
| T03 | 01 | Concluída | `npm test -- --run src/lib/api-client.spec.ts`; `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run format:check` — todos passaram. |
| T04 | 01 | Concluída | `npm test -- --run src/features/auth/api/auth-gateway.spec.ts src/features/products/api/products-gateway.spec.ts`; `npm run typecheck`; `npm run lint`; `npm run format:check`; `git diff --check` — todos passaram. |
| T05 | 01 | Concluída | `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run build`; `npm run test:e2e`; `npm run format:check`; `git diff --check` — todos passaram após normalizar o artefato automático `next-env.d.ts`. |
| T06 | 01 | Concluída | `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run build`; `npm run test:e2e`; `npm run format:check`; `git diff --check` — todos passaram; E2E de bootstrap ajustado ao título da rota protegida. |
| T07 | 01 | Concluída | `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run build`; `npm audit --omit=optional`; `npm run test:e2e`; E2E integrado com API local controlada `2 passed`; `npm run format:check`; `git diff --check` — todos os gates passaram. |
| T08 | 02 | Concluída | `npm test -- --run src/features/auth/schemas/register.spec.ts` (8 testes); `npm run typecheck`; `npm run lint`; `npx prettier --check src/features/auth/schemas/register.ts src/features/auth/schemas/register.spec.ts`; `git diff --check` — todos passaram. |
| T09 | 02 | Concluída | `npm test -- --run src/features/auth/schemas/register.spec.ts src/features/auth/schemas/registered-user.spec.ts src/features/auth/api/auth-gateway.spec.ts` (25 testes); `npm run typecheck`; `npm run lint`; `npx prettier --check` nos arquivos alterados; `git diff --check` — todos passaram. |
| T10 | 02 | Concluída | Implementa foco no primeiro campo inválido e mantém confirmação transitória; correção A-03 verificada em `npm test -- --run src/features/auth/components/register-screen.spec.tsx src/features/auth/components/login-screen.spec.tsx` (13 testes), `npm run typecheck`, `npm run lint`, `npm run format:check` e `git diff --check` — todos passaram. |
| T11 | 02 | Concluída | Mantém `correlationId` visível também em validações com erro por campo; correção A-01 verificada nos testes de componentes (13 testes), typecheck, lint, format-check e diff-check — todos passaram. |
| T12 | 02 | Concluída | O E2E agora confirma redirecionamento ao login ao acessar a rota protegida após cadastro, antes do login explícito; alteração verificada por lint, typecheck, format-check e diff-check. `npm run test:e2e` passou com 1 teste e pulou 3 sem API externa; execução integrada continua pendente de API autorizada. |
| T13 | 03 | Pendente | — |
| T14 | 03 | Pendente | — |
| T15 | 03 | Pendente | — |
| T16 | 03 | Pendente | — |
| T17 | 04 | Pendente | — |
| T18 | 04 | Pendente | — |
| T19 | 04 | Pendente | — |
| T20 | 04 | Pendente | — |
| T21 | 04 | Pendente | — |
| T22 | 05 | Pendente | — |
| T23 | 05 | Pendente | — |
| T24 | 05 | Pendente | — |
| T25 | 05 | Pendente | — |
| T26 | 05 | Pendente | — |
| T27 | 06 | Pendente | — |
| T28 | 06 | Pendente | — |
| T29 | 06 | Pendente | — |
| T30 | 06 | Pendente | — |
| T31 | 06 | Pendente | — |
| T32 | 06 | Pendente | — |
| T33 | 07 | Pendente | — |
| T34 | 07 | Pendente | — |
| T35 | 07 | Pendente | — |
| T36 | 07 | Pendente | — |
| T37 | 07 | Pendente | — |

## Bloqueios e desvios

A-01, A-02 e A-03, identificados no review independente v3, foram corrigidos na etapa `implement`. A Fase 02 permanece aguardando novo review; a reprodução E2E integrada depende de API autorizada. Dependências externas de API/OpenAPI, origem autorizada, dados E2E, origens de imagem e publicação continuam registradas nas fases correspondentes.
