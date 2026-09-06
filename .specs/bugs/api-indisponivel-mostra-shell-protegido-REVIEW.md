# Review — API indisponível mantém informações da área protegida

| Status       | Aprovado      |
|--------------|---------------|
| Created      | 2026-09-06    |
| Last Updated | 2026-09-06    |

**Escopo revisado:** correção do bug `api-indisponivel-mostra-shell-protegido`
**Versão da avaliação:** 1

## Artefatos analisados

- Relatório do bug: [api-indisponivel-mostra-shell-protegido.md](api-indisponivel-mostra-shell-protegido.md)
- Implementação: `src/features/products/protected-read.ts`, `ProductsScreen`, `ProductCreationGate` e `ProductDetailScreen`
- Testes: componentes das três telas e `e2e/product-pagination.spec.ts`
- Contrato e regras aplicáveis: `docs/Requisitos.md`, `docs/Contrato-de-integracao.md`, ADR-003, `AGENTS.md` e regras de testes/Next.js

## Resumo executivo

A causa registrada foi reproduzida antes da correção: falha de rede permanecia como erro genérico e não redirecionava. A implementação agora converte falhas protegidas não abortadas e `SERVICE_UNAVAILABLE` em estado seguro de redirecionamento para `/login` no catálogo, na criação e no detalhe. O review confirmou a ausência do erro e da navegação protegida no E2E; veredito **Aprovado**.

## Resultado das verificações obrigatórias

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Requisitos | Atendida | O fallback de falha protegida conduz ao login e não expõe catálogo ou criação; o contrato direto da API permanece inalterado. |
| Critérios de aceitação | Atendida | O E2E dedicado confirma URL `/login`, título “Boas-vindas” e ausência de “Catálogo”, “Novo produto” e erro de catálogo após a API cair. |
| Testes | Atendida | `npm test -- --run`: 25 arquivos e 178 testes; E2E: 20 passaram e 4 foram pulados por credenciais opcionais. |
| Design técnico | Atendida | A mudança usa o gateway direto existente, `credentials: include` e `redirectToLogin`; não cria BFF, Route Handler, Middleware, proxy ou leitura de cookie/JWT. |
| Plano | Não aplicável | É uma correção de bug fora da execução de nova fase; o relatório do bug substitui o plano neste fluxo. |
| Escopo | Atendida | Alterações limitadas ao fallback de leituras protegidas, testes, E2E e relatórios do bug. |
| Qualidade | Atendida com limitação | Typecheck, lint, testes, build e diff-check passaram; arquivos tocados passaram no Prettier isoladamente. O script global de formatação lista arquivos preexistentes com divergência de fim de linha. |
| Padrões do projeto | Atendida | A decisão fica em módulo de domínio explícito, sem abstração de UI nova; estados existentes de rate limit continuam recuperáveis. |
| Manutenibilidade | Atendida | A regra comum evita três tratamentos divergentes e mantém abortos fora do redirecionamento. |
| Riscos | Atendida | Falha temporária também leva ao login, decisão compatível com não expor a área protegida quando a sessão não pode ser confirmada; nenhum dado externo é mostrado no fallback. |

## Matriz de rastreabilidade

| Requisito do bug | Código | Teste | Evidência | Status |
|------------------|--------|-------|-----------|--------|
| API indisponível não deve manter erro genérico | `protected-read.ts` + `ProductsScreen` | `products-screen.spec.tsx`, caso “API fica indisponível” | Regressão falhou antes; depois, 33 testes direcionados passaram e o estado `unauthorized` substitui o alerta. | Comprovado |
| Redirecionar para login | `ProductsScreen`, `ProductCreationGate`, `ProductDetailScreen` | testes dos três componentes | `replace('/login')` verificado nos testes unitários/componentes. | Comprovado |
| Não exibir catálogo ou novo produto | `ProtectedShell` deixa de ser alcançado após o redirecionamento | `e2e/product-pagination.spec.ts`, caso “API cai” | 20 E2E passaram; o caso dedicado verifica ausência dos links protegidos e do erro. | Comprovado |
| Não expor detalhes da falha | `requestApi` mantém `reason` seguro; telas renderizam somente estado de redirecionamento | `api-client.spec.ts` e E2E | Suíte completa passou; a mensagem externa não aparece no cenário de queda. | Comprovado |
| Preservar respostas operacionais reconhecidas | helper redireciona falhas não abortadas, mas não o `error` de rate limit | `products-screen.spec.tsx`, `product-detail-screen.spec.tsx`, E2E de paginação | Rate limit continua com alerta seguro e retry manual; catálogo vazio é alcançado após retry. | Comprovado |

## Achados

| ID | Severidade | Achado | Evidência | Impacto | Recomendação | Encaminhamento |
|----|------------|--------|-----------|---------|--------------|----------------|
| A-01 | Informativo | O `npm run format:check` global ainda lista arquivos preexistentes com divergência de fim de linha; os arquivos tocados passam na verificação isolada. | Execução do script global e `prettier --check` dos arquivos alterados. | Pode produzir ruído no gate global, mas não indica regressão desta correção. | Normalizar a política de fim de linha em uma tarefa separada, sem misturar com este bug. | Não bloqueia; manutenção futura do repositório. |

## Riscos residuais e ressalvas aceitas

- Uma queda temporária da API redireciona o usuário ao login mesmo que a sessão ainda fosse válida; isso é intencional para impedir a exposição da área protegida sem confirmação.
- A configuração externa da API, CORS, cookie e publicação continuam fora deste escopo e não foram alteradas.

## Veredito

**Veredito:** Aprovado

**Fundamentação:** a reprodução original falhou antes e passou depois; a causa confirmada deixou de produzir o alerta genérico e a navegação protegida no cenário de API caída. Os três fluxos de leitura protegida possuem cobertura, os gates principais passaram e não há achado bloqueador ou alto.

## Próxima ação

Bug fechado. A branch pode ser revisada/publicada conforme o fluxo do repositório; nenhuma configuração externa de produção foi executada.

## Histórico de revisões anteriores

| Versão | Data       | Veredito | Resumo |
|--------|------------|----------|--------|
| 1      | 2026-09-06 | Aprovado | Primeira revisão independente da correção. |
