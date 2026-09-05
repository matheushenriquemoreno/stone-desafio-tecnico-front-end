# Review — Interface web de autenticação e gestão de produtos

| Status       | Aprovado   |
| ------------ | ---------- |
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

**Escopo revisado:** Fase 05 — Criação de produtos
**Versão da avaliação:** 8 — revisão de T22–T26; a delegação independente não concluiu por limite de uso da conta e a análise foi rederivada localmente

## Artefatos analisados

- PRD: [PRODUCT-REQUIREMENTS.md](PRODUCT-REQUIREMENTS.md) | Design técnico: [TECHNICAL-DESIGN.md](TECHNICAL-DESIGN.md)
- Plano e fases: [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md), [fase-05-criacao-de-produtos.md](fases/fase-05-criacao-de-produtos.md)
- Estado da implementação: [IMPLEMENTATION-STATE.md](fases/IMPLEMENTATION-STATE.md)
- Contrato e ADRs: `docs/Contrato-de-integracao.md`, ADR-001, ADR-003 e ADR-004
- Convenções: `AGENTS.md`, `rules/README.md`, princípios, reutilização, Next.js, Tailwind CSS, shadcn/ui, testes e checklist
- Implementação: commits `c596f25`, `e8d0bdf`, `bd5a573`, `fd3b032`, `b644535`, `a168fe2` e `fc14c83`; código em `src/` e `e2e/`

## Resumo executivo

A Fase 05 foi revisada contra o PRD, design técnico, plano, regras e implementação real. O fluxo protege a rota com probe mínimo, valida os quatro campos antes do transporte, executa uma única criação direta na API, preserva dados corrigíveis e confirma o produto após leitura validada. O E2E é determinístico por interceptação do endpoint; a compatibilidade com API, CORS e cookie reais permanece dependência de ambiente. Veredito: **Aprovado**.

## Resultado das verificações obrigatórias

| Verificação            | Resultado                          | Evidência                                                                                                                                                                                      |
| ---------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Requisitos             | Atendida                           | AGP-13, AGP-14, AGP-26 a AGP-28 e AGP-37 a AGP-44 possuem rastreabilidade na matriz abaixo; AGP-29 em diante permanece na Fase 06 conforme o plano. |
| Critérios de aceitação | Atendida                           | Os cinco critérios da Fase 05 possuem implementação e evidência de schema, gateway, componente ou E2E. |
| Testes                 | Atendida                           | `npm test -- --run`: 22 arquivos, 131 testes; `npm run test:e2e`: 13 passaram e 4 foram pulados por credenciais opcionais do tracer. |
| Design técnico         | Atendida                           | `DEC-01`, `DEC-03`, `DEC-04`, `DEC-05`, `DEC-07`, `DEC-08`, `DEC-09`, `DEC-10`, `DEC-11` e `DEC-12` foram respeitados por gateway direto, probe, estado local, feedback e sinal público. |
| Plano                  | Atendida                           | T22, T23, T24, T25 e T26 estão concluídas; o detalhe mínimo foi documentado como suporte necessário da T25 e edição/exclusão permanecem na Fase 06. |
| Escopo                 | Atendida                           | Não há BFF, Route Handler, Server Action, Middleware, Proxy de API, storage de domínio, JWT, cabeçalho CSRF customizado ou wildcard remoto. |
| Qualidade              | Atendida                           | `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` e `git diff --check` passaram. |
| Padrões do projeto     | Atendida                           | A estrutura `app → features → components/ui|lib`, componentes shadcn/base-nova, tokens semânticos, fronteiras cliente mínimas e `params` assíncronos do Next 16 foram preservados. |
| Manutenibilidade       | Atendida                           | Schema, gateway, gate, formulário, tela de criação e detalhe possuem responsabilidades separadas; `ProductForm` é reutilizado sem formulário universal configurável. |
| Riscos                 | Atendida com limitação documentada | O E2E de criação intercepta respostas da API para isolamento; não comprova novamente CORS/cookie/origem contra a API viva, limitação registrada em A-06. |

## Matriz de rastreabilidade

| Requisito | Código | Teste | Evidência | Status |
| --------- | ------ | ----- | --------- | ------ |
| AGP-13/14 | `ProductCreationGate`, `listProducts({ limit: 1 })` | `product-creation-gate.spec.tsx`, `product-create.spec.ts` | O formulário só aparece após probe protegido; `401` conduz ao login; aborto e Strict Mode não deixam resposta obsoleta. | Comprovado |
| AGP-26 | `productInputSchema`, `ProductForm`, `createProduct` | `product-input-schema.spec.ts`, `product-creation-screen.spec.tsx`, `product-create.spec.ts` | Os quatro campos são coletados, normalizados, enviados por `POST /products` e a resposta `Product` é validada antes da navegação. | Comprovado |
| AGP-27 | `productFormSchema`, `ProductForm.handleSubmit` | `product-input-schema.spec.ts`, `product-creation-screen.spec.tsx`, `product-create.spec.ts` | Erros de nome, descrição, preço e imagem são mostrados antes do gateway; o primeiro erro recebe foco. | Comprovado |
| AGP-28 | `ProductCreationScreen`, `ProductDetailScreen` | `product-creation-screen.spec.tsx`, `product-detail-screen.spec.tsx`, `product-create.spec.ts` | `201` validado leva ao detalhe e apresenta confirmação persistente por `created=success`, canonicalizado sem dado pessoal. | Comprovado |
| AGP-37 | estados `loading`, `ready`, `success`, `error` e skeletons | testes de gate, criação, detalhe e E2E | Probe, mutação e leitura mostram carregamento; erros são estados explícitos e retry é manual quando seguro. | Comprovado |
| AGP-38 | `isSubmitting` e botão desabilitado | `product-creation-screen.spec.tsx`, `product-create.spec.ts` | Duplo clique produz uma única chamada e o botão fica desabilitado durante a mutação. | Comprovado |
| AGP-39 | mapeadores do gateway e mensagens de tela | `products-gateway.spec.ts`, `product-creation-screen.spec.tsx`, `product-detail-screen.spec.tsx`, E2E | `400`, `401`, `403`, `404`, `429` e falha inesperada possuem mapeamento/estado seguro para o escopo. | Comprovado |
| AGP-40/41 | `retryAfterSeconds` e mensagens de rate limit | `products-gateway.spec.ts`, `product-create.spec.ts` | `Retry-After` é convertido no gateway e a tela orienta espera; E2E confirma o caminho sem repetição. | Comprovado |
| AGP-42 | `genericCreationError`, falhas `failure` e fallback do detalhe | `products-gateway.spec.ts`, `product-create.spec.ts`, telas | Resposta não reconhecida/500 não expõe o corpo externo e mantém mensagem genérica. | Comprovado |
| AGP-43 | `correlationId` nos estados de criação/gate/detalhe | gateway, telas e E2E | Referências de suporte são preservadas e exibidas sem mensagem externa bruta. | Comprovado |
| AGP-44 | cliente HTTP, schemas, mensagens e buscas residuais | `api-client.spec.ts`, `products-gateway.spec.ts`, suíte completa e `rg` | Não há JWT, cookie, senha, stack trace ou detalhe interno acessível; não há `Authorization`/CSRF na requisição. | Comprovado |
| EXPECT-01 | labels, Field, ARIA, foco e Button | `product-creation-screen.spec.tsx`, `product-create.spec.ts` | Campos e ações têm nomes acessíveis, foco no primeiro erro e estado de envio observável. | Comprovado |
| EXPECT-02/04 | layout responsivo e geometria de skeleton/imagem | E2Es regressivos, build e inspeção | A mudança usa composição mobile-first e preserva os E2Es existentes de viewport estreita/zoom; não há ação dependente de hover. | Comprovado |
| EXPECT-03/05/06 | tokens semânticos, textos de estado, `Spinner` e feedback não cromático | inspeção de `ProductForm`, `ProductCreationGate`, telas e regras CSS | Erros/sucesso/loading possuem texto ou estado semântico; não foi introduzida animação bloqueante ou token concorrente. | Comprovado |
| EXPECT-07 | Vitest/RTL e Playwright | suíte completa e `product-create.spec.ts` | 131 testes unitários/componentes e 13 E2E passaram; 4 E2E opcionais do tracer foram pulados por credenciais ausentes. | Comprovado |
| EXPECT-08/09 | cliente direto, runtime schemas e scripts | `npm run typecheck`, lint, format, build, test, E2E e diff-check | Todos os gates passaram; `NEXT_PUBLIC_API_URL` é usado diretamente, sem camada intermediária. | Comprovado |

## Achados

| ID   | Severidade  | Achado                                                                                                                                          | Evidência                                                                                                  | Impacto                                                                                                                           | Recomendação                                                                                                                                        | Encaminhamento                                                     |
| ---- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| A-06 | Informativo | O E2E da criação intercepta o endpoint direto para isolar probe, mutação, leitura e falhas, sem executar novamente a criação contra a API NestJS viva. | `e2e/product-create.spec.ts`; `npm run test:e2e` com 13 aprovados e 4 skips opcionais. | Prova o contrato consumido e o comportamento do navegador, mas não comprova novamente CORS, cookie `SameSite=Strict`, origem autorizada ou persistência real. | Reexecutar criação contra API local autorizada e dados isoláveis quando o ambiente integrado da Fase 07 estiver disponível. | `review`/prontidão operacional da Fase 07; não bloqueia a Fase 05. |
| A-07 | Informativo | O conjunto unitário do schema cobre rejeições e limites superiores, mas não possui um caso explícito para cada limite exato aceito. | `product-input-schema.spec.ts` cobre valores válidos normalizados, menores, zero/negativo, três casas, protocolo inválido e URL acima de 2048; a regra está codificada no schema. | Uma alteração futura nos limites exatos poderia passar sem uma asserção de fronteira dedicada, embora os limites atuais sejam aplicados em runtime. | Adicionar casos de aceitação para nome 2/100, descrição 1/500, preço com duas casas e URL 2048 na melhoria de cobertura da Fase 07. | `review`/robustez da Fase 07; não bloqueia a Fase 05. |

## Riscos residuais e ressalvas aceitas

- A validade do cookie, CORS, autorização de origem e persistência real do produto continuam sob responsabilidade da API e do ambiente integrado; a Fase 03 já teve execução integrada de sessão contra API local autorizada.
- O detalhe mínimo foi antecipado para suportar a confirmação da T25; edição, exclusão e estados completos do detalhe continuam explicitamente na Fase 06.
- Uma URL de imagem aceita pela API pode ficar no fallback até que sua origem seja adicionada explicitamente a `NEXT_PUBLIC_IMAGE_ORIGINS` e ao build correspondente.
- O tracer autenticado permanece pulado sem `E2E_USER_EMAIL` e `E2E_USER_PASSWORD`; os seis E2Es novos da T26 não dependem dessas credenciais.
- A-06 e A-07 são informativos e não constituem ressalvas de aceite desta fase.

## Veredito

**Veredito:** Aprovado

**Fundamentação:** os requisitos da Fase 05, seus critérios de aceitação e as decisões técnicas aplicáveis possuem implementação e evidência objetiva. Probe, validação, única mutação, feedback seguro, leitura posterior, acessibilidade, falhas e rate limit foram verificados; não há achado bloqueador ou alto.

## Próxima ação

Fase 05 aprovada. Encaminhar ao `implement` para a Fase 06, conforme autorização explícita do usuário para continuar as fases 05 e 06. Os achados A-06 e A-07 devem ser reavaliados no gate de robustez da Fase 07.

## Histórico de revisões anteriores

| Versão | Data       | Veredito  | Resumo                                                                                                                                                      |
| ------ | ---------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8      | 2026-09-05 | Aprovado  | Fase 05: probe, schema, criação direta, feedback seguro, detalhe mínimo, E2E determinístico e gates aprovados; A-06/A-07 informativos. |
| 7      | 2026-09-05 | Aprovado  | Fase 04: catálogo, paginação sequencial, URL pública, cartões, allowlist de imagens, E2E determinístico e gates aprovados; A-05 informativo sobre API viva. |
| 6      | 2026-09-05 | Aprovado  | Fase 03: shell, `401`, logout idempotente, E2E integrado e gates aprovados; A-04 informativo sobre rotas futuras.                                           |
| 5      | 2026-09-05 | Aprovado  | Fase 02 aprovada após correções de `correlationId`, E2E local e zoom/reflow.                                                                                |
| 4      | 2026-09-05 | Reprovado | Fase 02 revisada após correções, com residual em fallback e E2E integrado ausente.                                                                          |
| 3      | 2026-09-05 | Reprovado | Fase 02 reprovada por referência de correlação incompleta e evidência visual parcial.                                                                       |
| 2      | 2026-09-05 | Aprovado  | Review inicial da Fase 02, superado pela revisão independente v3.                                                                                           |
| 1      | 2026-09-05 | Aprovado  | Fase 01: fundação, tracer bullet autenticado e primeira leitura protegida aprovados.                                                                        |
