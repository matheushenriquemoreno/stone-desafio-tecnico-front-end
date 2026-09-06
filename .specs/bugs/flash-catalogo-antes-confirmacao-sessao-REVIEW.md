# Review — Flash do catálogo antes da confirmação da sessão

| Status       | Aprovado   |
| ------------ | ---------- |
| Created      | 2026-09-06 |
| Last Updated | 2026-09-06 |

**Escopo revisado:** correção do bug `flash-catalogo-antes-confirmacao-sessao`
**Versão da avaliação:** 2

## Artefatos analisados

- Relatório: `flash-catalogo-antes-confirmacao-sessao.md`
- Rotas: `src/app/(protected)/page.tsx`, `src/app/(protected)/layout.tsx` e `src/app/(protected)/products/layout.tsx`
- Componentes: `ProtectedShell`, `ProtectedHeader` e `ProductsScreen`
- Testes: `src/features/products/components/products-screen.spec.tsx`, `src/app/(protected)/page.spec.tsx` e `e2e/product-pagination.spec.ts`
- Regras e contrato: `AGENTS.md`, regras de Next/Tailwind/testes, ADR-003, requisitos de autenticação e contrato de integração

## Resumo executivo

A implementação elimina o shell e o skeleton da primeira renderização da raiz e mantém somente um loading visual da aplicação, sem conteúdo protegido, até a primeira leitura protegida responder. O review confirmou os caminhos `200`, `401`, falha de rede e `429`, além da preservação do shell nas rotas de produto. Veredito **Aprovado**; as duas falhas restantes do E2E completo dependem da API local de cadastro/sessão e não envolvem esta correção.

## Resultado das verificações obrigatórias

| Verificação            | Resultado              | Evidência                                                                                                                        |
| ---------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Requisitos             | Atendida               | `/` não exibe dados, navegação ou skeleton antes da confirmação; sessão válida revela o catálogo e sessão inválida vai ao login. |
| Critérios de aceitação | Atendida               | E2E determinístico cobre espera, `200`, `401`, rede e `429`; testes de componente cobrem o estado de acesso.                     |
| Testes                 | Atendida               | `npm test -- --run`: 25 arquivos e 178 testes; cenários E2E afetados passaram.                                                   |
| Design técnico         | Atendida               | A confirmação continua sendo `GET /products`; não há endpoint novo, BFF, Middleware, proxy, token ou cookie no cliente.          |
| Plano                  | Atendida               | Escopo limitado à entrada `/`; `/products/new` e `/products/:id` mantêm o shell no layout aninhado.                              |
| Escopo                 | Atendida               | Mudanças restritas à composição da raiz, slot visual, testes e relatórios do bug.                                                |
| Qualidade              | Atendida               | Typecheck, lint, build, Prettier dos arquivos tocados e `git diff --check` passaram.                                             |
| Padrões do projeto     | Atendida               | `ProtectedHeader` e `Spinner` reutilizam os componentes e tokens existentes; loading visível mantém status acessível.            |
| Manutenibilidade       | Atendida               | Uma única chamada existente controla a transição; paginações posteriores preservam o shell após acesso confirmado.               |
| Riscos                 | Atendida com limitação | O E2E completo teve 22 passagens, 2 skips e 2 falhas por API local indisponível nos fluxos de cadastro/sessão.                   |

## Matriz de rastreabilidade

| Requisito do bug                                    | Código                                                                           | Teste                                                                   | Evidência                                                                                                      | Status     |
| --------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- |
| Nenhum shell ou skeleton durante a primeira leitura | `ProductsScreen`, `SessionDecisionLoading` e composição sem shell no layout raiz | `mostra o loading de sessão sem expor o catálogo` + teste de componente | Loading visual presente; banner, links, logout, skeleton e foco interno ausentes enquanto a rota fica pendente | Comprovado |
| Sessão válida revela a página principal             | `hasConfirmedAccess` e `protectedHeader`                                         | `revela o shell e o catálogo somente após confirmar a sessão`           | `200` revela banner, link de novo produto e produto                                                            | Comprovado |
| Sessão inválida/falha protegida não expõe conteúdo  | estados `unauthorized` e `redirectToLogin`                                       | cenários `401`, API cai e testes de componente                          | URL `/login` sem catálogo ou navegação protegida                                                               | Comprovado |
| Rate limit inicial permanece recuperável e seguro   | `getProductsError` sem marcar acesso confirmado                                  | `permite retry manual após rate limit...` + teste de componente         | Erro e retry aparecem sem banner; sucesso posterior revela shell                                               | Comprovado |
| Rotas de produto permanecem protegidas              | `src/app/(protected)/products/layout.tsx`                                        | E2E de criação e detalhe                                                | Fluxos existentes continuam passando no conjunto controlado                                                    | Comprovado |

## Achados

| ID   | Severidade  | Achado                                                                 | Evidência                                                                                                    | Impacto                                                                 | Recomendação                                      | Encaminhamento               |
| ---- | ----------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------- |
| A-01 | Informativo | E2E integrado de cadastro e sessão não concluiu sem a API NestJS local | 2 falhas em `registration-and-login.spec.ts` e `session-and-logout.spec.ts`; 22 dos demais cenários passaram | Não invalida a correção interceptada; limita a prova de integração real | Reexecutar com API autorizada em `localhost:3001` | Validação operacional futura |

## Riscos residuais e ressalvas aceitas

- O escopo não altera a entrada direta de `/products/new` ou `/products/:id`.
- O loading “Preparando seu catálogo…” é visual e mantém o status “Confirmando sessão” acessível.
- Nenhuma configuração externa, publicação ou smoke test de produção foi executado.

## Veredito

**Veredito:** Aprovado

**Fundamentação:** a reprodução original falhou antes da correção e passou depois; o estado pendente não apresenta a área protegida, o `200` revela o catálogo e as respostas não autorizadas conduzem ao login. Não há achado bloqueador ou alto.

## Próxima ação

Bug fechado. Correção, testes e relatório estão prontos para commit atômico; publicação permanece fora do escopo.

## Histórico de revisões anteriores

| Versão | Data       | Veredito | Resumo                                                 |
| ------ | ---------- | -------- | ------------------------------------------------------ |
| 1      | 2026-09-06 | Aprovado | Primeira revisão independente da correção.             |
| 2      | 2026-09-06 | Aprovado | Loading visual adicionado sem expor o shell protegido. |
