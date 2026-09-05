# Review — Interface web de autenticação e gestão de produtos

| Status       | Aprovado |
|--------------|----------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

**Escopo revisado:** Fase 02 — Cadastro e autenticação pública completa
**Versão da avaliação:** 2

## Artefatos analisados

- PRD: [PRODUCT-REQUIREMENTS.md](PRODUCT-REQUIREMENTS.md) | Design técnico: [TECHNICAL-DESIGN.md](TECHNICAL-DESIGN.md)
- Plano: [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | Fase: [fase-02-cadastro-e-autenticacao-publica.md](fases/fase-02-cadastro-e-autenticacao-publica.md)
- Estado: [IMPLEMENTATION-STATE.md](fases/IMPLEMENTATION-STATE.md)
- Regras: `AGENTS.md` e os arquivos aplicáveis em `rules/`
- Implementação: commits `cadeb5b`, `ba4460f`, `07db032`, `93d78c9` e `cbb4231`; código em `src/`, testes próximos às features e `e2e/registration-and-login.spec.ts`.

## Resumo executivo

A Fase 02 entrega cadastro público, validação e normalização dos campos, resposta segura, tratamento dos erros contratados, transição sem PII para o login e feedback público completo. O cenário integrado contra API NestJS e DynamoDB Local controlados passou após usar o mesmo host `127.0.0.1` nos dois lados, preservando o contrato `SameSite=Strict`; a execução padrão permanece opt-in quando a API externa não está configurada. Os gates locais passaram com 69 testes, typecheck, lint, format, build e E2E padrão. Veredito: **Aprovado**; a Fase 03 não foi iniciada.

## Resultado das verificações obrigatórias

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Requisitos | Atendida | Matriz abaixo cobre `AGP-01` a `AGP-12` e os requisitos transversais aplicáveis da Fase 02. |
| Critérios de aceitação | Atendida | Os cinco critérios da fase possuem implementação e teste observável; o fluxo integrado cadastro → login → catálogo passou. |
| Testes | Atendida | `npm test -- --run`: 11 arquivos, 69 testes aprovados; E2E integrado opt-in: 1 aprovado; E2E padrão: 1 aprovado e 3 ignorados sem API externa. |
| Design técnico | Atendida | Rotas permanecem composição; cadastro/login são Client Components mínimos; gateways usam cliente HTTP direto; schemas validam as fronteiras; sinal de sucesso é enumerado. |
| Plano | Atendida | T08, T09, T10, T11 e T12 estão concluídas, com evidências na fase e no estado. |
| Escopo | Atendida | Não foram introduzidos BFF, `/api/*`, Server Action, Middleware, Proxy, Bearer, storage, leitura de cookie/JWT ou retry de mutação. |
| Qualidade | Atendida | `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` e `git diff --check` passaram; o build lista `/register` e `/login` conforme esperado. |
| Padrões do projeto | Atendida | Componentes Field/Alert/Button/Input/Spinner existentes foram reutilizados; layout compartilhado ficou em `AuthShell`; tokens semânticos e aliases foram preservados. |
| Manutenibilidade | Atendida | Schemas, gateways, estados e mensagens de cadastro permanecem separados do login; tipos são uniões discriminadas e derivados de Zod. |
| Riscos | Atendida com limites registrados | E2E usa dados únicos e ambiente local; a configuração same-site é explicitada; publicação HTTPS, CORS de produção e operação permanecem Fase 07. |

## Matriz de rastreabilidade

| Requisito | Código | Teste | Evidência | Status |
|-----------|--------|-------|-----------|--------|
| AGP-01 | `RegisterScreen`, `/register`, `registerSchema` | `register-screen.spec.tsx`, `registration-and-login.spec.ts` | Campos nome, e-mail e senha aparecem e o cadastro integrado é concluído | Comprovado |
| AGP-02 | `registerSchema` | `register.spec.ts` | Trim do nome e limites 2/100, inclusive limites válidos e inválidos | Comprovado |
| AGP-03 | `registerSchema` | `register.spec.ts`, `auth-gateway.spec.ts` | E-mail é trimado, convertido para minúsculas e validado antes do transporte | Comprovado |
| AGP-04 | `registerSchema` | `register.spec.ts`, `register-screen.spec.tsx` | Senha entre 8/128; a transformação não altera a senha | Comprovado |
| AGP-05 | `RegisterScreen` e `FieldError` | `register-screen.spec.tsx` | Erros permanecem associados aos labels/controles correspondentes | Comprovado |
| AGP-06 | `LoginScreen` com `registrationConfirmed` | `login-screen.spec.tsx`, E2E integrado | Confirmação textual aparece após o `201` | Comprovado |
| AGP-07 | `RegisterScreen` | `register-screen.spec.tsx`, E2E integrado | Navegação usa somente `/login?registered=success` após sucesso | Comprovado |
| AGP-08 | `register` e `RegisterScreen` | `auth-gateway.spec.ts`, `register-screen.spec.tsx`, E2E integrado | Cadastro não chama catálogo; login posterior é necessário para chegar à raiz protegida | Comprovado |
| AGP-09 | `mapRegisterApiError` e feedback do cadastro | `auth-gateway.spec.ts`, `register-screen.spec.tsx`, E2E integrado | `EMAIL_ALREADY_EXISTS` gera orientação segura e específica | Comprovado |
| AGP-10 | `LoginScreen` e `login` | `login-screen.spec.tsx`, `registration-and-login.spec.ts` | Login com e-mail e senha conduz ao fluxo protegido | Comprovado |
| AGP-11 | `LoginScreen` e rota protegida existente | `registration-and-login.spec.ts`, E2E integrado | Login válido chega ao catálogo após leitura protegida | Comprovado |
| AGP-12 | `mapApiError` e `LoginScreen` | `auth-gateway.spec.ts`, `login-screen.spec.tsx`, E2E integrado | Credenciais inválidas não identificam qual campo falhou | Comprovado |
| AGP-37 | Formulários e Spinner | `login-screen.spec.tsx`, `register-screen.spec.tsx` | Loading é observável e o botão muda de estado durante a mutação | Comprovado |
| AGP-38 | `isSubmitting` em cadastro/login | `login-screen.spec.tsx`, `register-screen.spec.tsx` | Campos e botão são desabilitados e duplo envio é impedido | Comprovado |
| AGP-39 | Mapeadores dos gateways | `auth-gateway.spec.ts`, `login-screen.spec.tsx`, `register-screen.spec.tsx` | Status e códigos reconhecidos produzem resultados de domínio estáveis | Comprovado |
| AGP-40 | `rate-limit` em gateways/telas | gateway e componentes de auth | `429` orienta espera sem retry automático; cadastro não força rate limit no E2E | Comprovado no nível apropriado |
| AGP-41 | `retryAfterSeconds` do cliente HTTP | `auth-gateway.spec.ts`, `login-screen.spec.tsx`, `register-screen.spec.tsx` | Duração válida é exibida; ausente/inválida usa fallback seguro | Comprovado |
| AGP-42 | Resultados `failure` e schema inválido | gateways e componentes de auth | Rede, resposta sensível/malformada e status desconhecido não expõem detalhes | Comprovado |
| AGP-43 | `correlationId` validado | gateways e telas de auth | Referência de suporte é preservada e exibida sem mensagem externa | Comprovado |
| AGP-44 | Cliente, schemas, gateways e telas | testes de contrato, E2E e buscas residuais | Senha, JWT, cookie, stack trace e payload sensível não entram na UI/storage/log | Comprovado |
| EXPECT-01 | Field/Label/Input/Alert e links | testes de componentes e E2E | Labels, `aria-invalid`, mensagens associadas, foco nativo e teclado semântico | Comprovado |
| EXPECT-02 | `AuthShell` e formulários responsivos | Playwright em 320, 768 e 1440 px | Cadastro/login renderizam sem overflow horizontal e preservam formulário | Comprovado |
| EXPECT-03 | Tokens da fundação ADR-004 | `design-system-contrast.spec.ts` existente | Nenhum token foi alterado na Fase 02; pares já validados permanecem a fonte visual | Comprovado por regressão |
| EXPECT-04 | Layout público | Playwright em 320, 768 e 1440 px | Reflow pequeno/médio/grande não perde heading ou formulário; zoom manual 200% não foi reexecutado nesta fase | Comprovado no escopo automatizado |
| EXPECT-05 | Alertas e FieldError textuais | testes de componentes | Erro, rate limit e confirmação não dependem somente de cor | Comprovado |
| EXPECT-06 | CSS global e primitivas existentes | gates da Fase 01 + regressão de composição | Fase 02 não adiciona animação própria nem altera a preferência de movimento reduzido | Comprovado por regressão |
| EXPECT-07 | Suítes unitárias, componentes e E2E | `npm test -- --run`, E2E padrão e E2E integrado | Cadastro/login têm cobertura reproduzível em todos os níveis aplicáveis | Comprovado |
| EXPECT-08 | Scripts do projeto | lint, typecheck, test, format, build | Todos os gates locais passam | Comprovado |
| EXPECT-09 | Cliente HTTP, schemas e gateways | testes de contrato + E2E integrado | API direta, resposta segura, erros e credenciais foram exercitados contra API local | Comprovado |

## Achados

| ID | Severidade | Achado | Evidência | Impacto | Recomendação | Encaminhamento |
|----|------------|--------|-----------|---------|--------------|----------------|
| I-01 | Informativo | O plano de T10 menciona uma verificação específica de devolução de foco após falha, mas os testes atuais comprovam associação de erros, foco nativo e teclado, não uma asserção de foco restaurado. | `register-screen.spec.tsx` e `login-screen.spec.tsx` cobrem `aria-invalid`, mensagens e disabled; não há `toHaveFocus()` após erro. | Não bloqueia o fluxo nem viola o contrato de labels/foco visível; pode deixar a revisão de teclado menos explícita. | Acrescentar uma asserção de foco ou formalizar o comportamento esperado quando o fluxo de foco for ampliado. | `implement` em melhoria futura; não bloqueia esta fase. |
| I-02 | Informativo | O rate limit não é provocado artificialmente no E2E integrado para não consumir a janela da API; é coberto nos gateways e componentes. | `auth-gateway.spec.ts`, `login-screen.spec.tsx`, `register-screen.spec.tsx`; E2E usa somente um cadastro e uma duplicidade. | Não há risco de dados ou instabilidade; a cobertura permanece adequada ao nível de contrato. | Manter o cenário de `429` em testes controlados de contrato ou fixture da API. | `implement`/ambiente de testes; não bloqueia esta fase. |

## Riscos residuais e ressalvas aceitas

- A prova integrada depende de API NestJS, CORS, cookie e DynamoDB Local controlados; foi executada apenas em ambiente local, com e-mail único e sem sessão de produção.
- O cookie `SameSite=Strict` exige que front e API usem o mesmo host de teste (`127.0.0.1`); misturar `localhost` e `127.0.0.1` invalida a condição same-site e não representa defeito do fluxo aprovado.
- HTTPS publicado, allowlist de produção, domínio same-site, imagens e operação permanecem riscos planejados para a Fase 07.
- `I-01` e `I-02` são observações informativas, sem aceite especial necessário para o veredito; não há achado bloqueador, alto ou médio.

## Veredito

**Veredito:** Aprovado
**Fundamentação:** T08–T12 atendem aos critérios da Fase 02, os requisitos funcionais e de segurança aplicáveis possuem evidência objetiva, o fluxo integrado cadastro → login → catálogo passou e os gates locais estão verdes. Os dois achados são informativos e não comprometem a entrega nem exigem aceite de risco para liberar a próxima fase.

## Próxima ação

Fase 02 aprovada. Não iniciar a Fase 03 automaticamente; aguardar autorização explícita do solicitante para executar a próxima fase do plano.

## Histórico de revisões anteriores

| Versão | Data | Veredito | Resumo |
|--------|------|----------|--------|
| 1 | 2026-09-05 | Aprovado | Review independente da Fase 01: fundação, tracer bullet autenticado e primeira leitura protegida aprovados; Fase 02 permaneceu pendente. |
