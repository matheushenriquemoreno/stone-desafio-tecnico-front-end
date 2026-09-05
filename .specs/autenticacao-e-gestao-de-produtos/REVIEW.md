# Review — Interface web de autenticação e gestão de produtos

| Status       | Reprovado |
|--------------|----------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

**Escopo revisado:** Fase 02 — Cadastro e autenticação pública completa
**Versão da avaliação:** 3 — revisão independente por subagente

## Artefatos analisados

- PRD: [PRODUCT-REQUIREMENTS.md](PRODUCT-REQUIREMENTS.md) | Design técnico: [TECHNICAL-DESIGN.md](TECHNICAL-DESIGN.md)
- Plano: [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | Fase: [fase-02-cadastro-e-autenticacao-publica.md](fases/fase-02-cadastro-e-autenticacao-publica.md)
- Estado: [IMPLEMENTATION-STATE.md](fases/IMPLEMENTATION-STATE.md)
- Regras: `AGENTS.md` e os arquivos aplicáveis em `rules/`
- Implementação: commits `cadeb5b`, `ba4460f`, `07db032`, `93d78c9` e `cbb4231`; código em `src/`, testes próximos às features e `e2e/registration-and-login.spec.ts`.

## Resumo executivo

A implementação atende grande parte de T08–T12: cadastro, validação, gateway, login, feedback seguro e integração direta com a API. A revisão independente por subagente reproduziu os gates locais e o E2E integrado, mas identificou uma falha média no requisito de exposição consistente do `correlationId` em caminhos de erro. Veredito: **Reprovado** até a correção de A-01 e novo review; a Fase 03 não foi iniciada.

## Resultado das verificações obrigatórias

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Requisitos | Atendida com ressalva | A matriz cobre `AGP-01` a `AGP-12`, mas `AGP-43` não está comprovado integralmente por A-01. |
| Critérios de aceitação | Reprovada | O fluxo integrado cadastro → login → catálogo passou, porém há caminho de erro sem exibição da referência de suporte exigida. |
| Testes | Atendida | `npm test -- --run`: 11 arquivos, 69 testes aprovados; E2E integrado opt-in: 1 aprovado; E2E padrão: 1 aprovado e 3 ignorados sem API externa. |
| Design técnico | Atendida | Rotas permanecem composição; cadastro/login são Client Components mínimos; gateways usam cliente HTTP direto; schemas validam as fronteiras; sinal de sucesso é enumerado. |
| Plano | Atendida | T08, T09, T10, T11 e T12 estão concluídas, com evidências na fase e no estado. |
| Escopo | Atendida | Não foram introduzidos BFF, `/api/*`, Server Action, Middleware, Proxy, Bearer, storage, leitura de cookie/JWT ou retry de mutação. |
| Qualidade | Atendida | `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` e `git diff --check` passaram; o build lista `/register` e `/login` conforme esperado. |
| Padrões do projeto | Atendida | Componentes Field/Alert/Button/Input/Spinner existentes foram reutilizados; layout compartilhado ficou em `AuthShell`; tokens semânticos e aliases foram preservados. |
| Manutenibilidade | Atendida | Schemas, gateways, estados e mensagens de cadastro permanecem separados do login; tipos são uniões discriminadas e derivados de Zod. |
| Riscos | Atendida com ressalva | E2E usa dados únicos e ambiente local; a configuração same-site é explicitada; A-01 afeta suporte/diagnóstico; publicação HTTPS, CORS de produção e operação permanecem Fase 07. |

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
| AGP-43 | `correlationId` validado | gateways e telas de auth | Referência não é exibida em todos os caminhos: erros de validação com erros de campo e alguns erros de login a descartam | Não comprovado integralmente |
| AGP-44 | Cliente, schemas, gateways e telas | testes de contrato, E2E e buscas residuais | Senha, JWT, cookie, stack trace e payload sensível não entram na UI/storage/log | Comprovado |
| EXPECT-01 | Field/Label/Input/Alert e links | testes de componentes e E2E | Labels, `aria-invalid`, mensagens associadas, foco nativo e teclado semântico | Comprovado |
| EXPECT-02 | `AuthShell` e formulários responsivos | Playwright em 320, 768 e 1440 px | Cadastro/login renderizam sem overflow horizontal e preservam formulário | Comprovado |
| EXPECT-03 | Tokens da fundação ADR-004 | `design-system-contrast.spec.ts` existente | Nenhum token foi alterado na Fase 02; pares já validados permanecem a fonte visual | Comprovado por regressão |
| EXPECT-04 | Layout público | Playwright em 320, 768 e 1440 px | Reflow pequeno/médio/grande não perde heading ou formulário; não há evidência automatizada reproduzível de zoom 200% | Parcial |
| EXPECT-05 | Alertas e FieldError textuais | testes de componentes | Erro, rate limit e confirmação não dependem somente de cor | Comprovado |
| EXPECT-06 | CSS global e primitivas existentes | gates da Fase 01 + regressão de composição | Fase 02 não adiciona animação própria nem altera a preferência de movimento reduzido | Comprovado por regressão |
| EXPECT-07 | Suítes unitárias, componentes e E2E | `npm test -- --run`, E2E padrão e E2E integrado | Cadastro/login têm cobertura reproduzível em todos os níveis aplicáveis | Comprovado |
| EXPECT-08 | Scripts do projeto | lint, typecheck, test, format, build | Todos os gates locais passam | Comprovado |
| EXPECT-09 | Cliente HTTP, schemas e gateways | testes de contrato + E2E integrado | API direta, resposta segura, erros e credenciais foram exercitados contra API local | Comprovado |

## Achados

| ID | Severidade | Achado | Evidência | Impacto | Recomendação | Encaminhamento |
|----|------------|--------|-----------|---------|--------------|----------------|
| A-01 | Médio | `correlationId` não é exibido quando o erro de validação possui erros associados a campos. No login, também é descartado nos códigos `unknown`/`unavailable`. | `login-screen.tsx` e `register-screen.tsx`: alguns caminhos renderizam somente erros de campo ou fallback sem a referência de suporte. | Reduz a capacidade de suporte e viola a exigência de preservar/exibir o identificador quando fornecido pela API. | Encaminhar para `implement`; manter a referência visível em todos os erros que a API fornecer. | `implement` e novo `review`. |
| A-02 | Informativo | O plano exige evidência de foco após falha, zoom e reflow, mas não há asserções `toHaveFocus()`, teste de zoom ou auditoria automatizada de acessibilidade. | `fase-02-cadastro-e-autenticacao-publica.md` e testes de autenticação. | A cobertura funcional permanece, mas parte da evidência de acessibilidade visual/interativa não é reproduzível. | Registrar evidência manual/automatizada ou ampliar os testes. | `implement`/melhoria futura; não é o motivo principal da reprovação. |

## Riscos residuais e ressalvas aceitas

- A prova integrada depende de API NestJS, CORS, cookie e DynamoDB Local controlados; foi executada apenas em ambiente local, com e-mail único e sem sessão de produção.
- O cookie `SameSite=Strict` exige que front e API usem o mesmo host de teste (`127.0.0.1`); misturar `localhost` e `127.0.0.1` invalida a condição same-site e não representa defeito do fluxo aprovado.
- HTTPS publicado, allowlist de produção, domínio same-site, imagens e operação permanecem riscos planejados para a Fase 07.
- `A-01` é um achado médio e bloqueia a aprovação da fase até correção e novo review. `A-02` permanece informativo.

## Veredito

**Veredito:** Reprovado
**Fundamentação:** T08–T12 atendem grande parte dos critérios e os gates locais/E2E integrado passaram, mas A-01 demonstra que `correlationId` não é exibido em todos os caminhos de erro. A fase deve retornar à implementação para a menor correção necessária e ser revisada novamente.

## Próxima ação

Corrigir A-01, repetir os gates relevantes e solicitar novo review independente. Não iniciar a Fase 03.

## Histórico de revisões anteriores

| Versão | Data | Veredito | Resumo |
|--------|------|----------|--------|
| 3 | 2026-09-05 | Reprovado | Review independente por subagente: gates reproduzidos, A-01 médio sobre `correlationId` e A-02 informativo sobre evidências de foco/zoom/reflow. |
| 2 | 2026-09-05 | Aprovado | Review realizado no mesmo thread, com dois achados informativos. Superado pela revisão independente v3. |
| 1 | 2026-09-05 | Aprovado | Review independente da Fase 01: fundação, tracer bullet autenticado e primeira leitura protegida aprovados; Fase 02 permaneceu pendente. |
