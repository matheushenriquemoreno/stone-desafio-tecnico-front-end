# Fase 01 — Fundação e tracer bullet autenticado

| Status       | Aguardando review |
|--------------|------------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

**Objetivo e resultado esperado:** criar a aplicação executável e provar o caminho principal de login seguido da primeira leitura protegida do catálogo, diretamente do navegador para a API.
**Capacidade ou fluxo coberto:** bootstrap → login → cookie controlado pela API → `GET /products` → catálogo ou redirecionamento por `401`.
**Requisitos relacionados:** `AGP-10` a `AGP-14`, `AGP-17`, `AGP-18`, `AGP-37` a `AGP-44`, `EXPECT-01` a `EXPECT-10`.
**Dependências externas:** API NestJS em versão compatível; origem local autorizada; Node.js 24 LTS.

## Estado das tarefas

| ID  | Status | Evidências |
|-----|--------|------------|
| T01 | Concluída | `npm install`; `npm audit --omit=optional`; `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run build`; `npm run test:e2e`; `npm run format:check` — todos passaram. |
| T02 | Concluída | `npx shadcn@latest info --json`; `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run build`; `npm run test:e2e`; `npm run format:check` — todos passaram. |
| T03 | Concluída | `npm test -- --run src/lib/api-client.spec.ts`; `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run format:check` — todos passaram. |
| T04 | Concluída | `npm test -- --run src/features/auth/api/auth-gateway.spec.ts src/features/products/api/products-gateway.spec.ts`; `npm run typecheck`; `npm run lint`; `npm run format:check`; `git diff --check` — todos passaram. |
| T05 | Concluída | `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run build`; `npm run test:e2e`; `npm run format:check`; `git diff --check` — todos passaram após normalizar o artefato automático `next-env.d.ts`. |
| T06 | Concluída | `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run build`; `npm run test:e2e`; `npm run format:check`; `git diff --check` — todos passaram; E2E de bootstrap ajustado ao título da rota protegida. |
| T07 | Concluída | `npm run lint`; `npm run typecheck`; `npm test -- --run`; `npm run build`; `npm audit --omit=optional`; `npm run test:e2e`; E2E integrado com API local controlada `2 passed`; `npm run format:check`; `git diff --check` — todos os gates passaram. |

### Registro de T01

- Bootstrap criado com Next.js `16.3.4`, React `19.2.8`, TypeScript `5.9.3`, Tailwind CSS `4.3.3`, Vitest `4.1.11`, Playwright `1.63.0`, npm `11.12.1` e Node.js `24.15.0`.
- A instalação gerou `package-lock.json`; `npm audit --omit=optional` terminou com zero vulnerabilidades.
- O E2E de bootstrap foi executado em Chromium instalado pelo Playwright e passou com 1 teste.
- Desvio registrado: ESLint `9.39.4` foi mantido porque ESLint 10 apresentou incompatibilidade de runtime com o `eslint-plugin-react` empacotado por `eslint-config-next` `16.3.4`; os gates de lint e auditoria passaram com a versão compatível.

### Registro de T02

- `components.json` registra `base-nova`, Base UI, RSC, TypeScript, alias `@`, Tailwind v4 e Lucide; os componentes `alert`, `button`, `card`, `field`, `input`, `label`, `separator`, `skeleton` e `spinner` foram incorporados pelo registry oficial.
- `src/app/globals.css` centraliza os tokens semânticos da ADR-004, tema claro, fontes e a regra de movimento reduzido; nenhum token visual foi criado na feature.
- `npm test -- --run` passou com 13 testes, incluindo acessibilidade básica dos componentes e 7 pares de contraste com razão mínima de 4,5:1.
- As dependências de execução do CLI `shadcn` foram mantidas em `devDependencies`; `npm audit --omit=optional` continua sem vulnerabilidades.

### Registro de T03

- `requestApi` compõe a URL diretamente de `NEXT_PUBLIC_API_URL`, envia `credentials: 'include'`, serializa JSON somente quando necessário e repassa `AbortSignal`.
- O cliente retorna uniões discriminadas para sucesso sem corpo, sucesso com resposta validada por Zod, erro padrão validado e falhas seguras de configuração, serialização, rede, aborto, schema ou status.
- Erros preservam apenas campos confiáveis (`statusCode`, `code`, `message`, `correlationId`, erros de campo e `Retry-After` inteiro); corpos inválidos e detalhes de exceções não entram no resultado.
- `src/lib/api-client.spec.ts` cobre URL sem `/api`, todos os métodos, headers proibidos, `204`, payload/resposta, erro `429`, `Retry-After`, `401`/status inesperado, schema malformado, rede, aborto e configuração insegura.

### Registro de T04

- `login` valida e-mail/senha, normaliza somente o e-mail, chama `POST /auth/login` com sucesso `204` e converte `401`, `403`, `429`, validação e falhas de transporte em resultados discriminados.
- `listProducts` chama `GET /products?limit=20`, reenvia cursor opaco por query string e valida `items`, `total`, `nextCursor` e cada campo do produto antes de retornar sucesso.
- Os gateways reconhecem somente códigos estáveis da API para decidir estados de domínio; mensagens externas não controlam comportamento e nenhum gateway acessa cookie ou storage.
- `auth-gateway.spec.ts` e `products-gateway.spec.ts` cobrem payloads, caminhos, respostas `204`/`200`, normalização, limite, cursor, `401`, `403`, `429`, schema inválido e falha de rede.

### Registro de T05

- A rota pública `/login` compõe `LoginScreen` e mantém a regra de formulário na menor fronteira cliente da feature.
- O formulário possui labels associados, foco visível herdado das primitivas, `aria-invalid`, `aria-describedby`, alertas persistentes e estados de loading/disabled.
- A senha permanece somente no estado efêmero do formulário, é limpa antes da navegação após `204` e não é armazenada, registrada ou exposta.
- `login-screen.spec.tsx` cobre teclado implícito via `user-event`, validação local, erro seguro de credenciais, bloqueio de reenvio, loading, rate limit e navegação pós-sucesso.

### Registro de T06

- A rota `/` agora compõe `ProductsScreen` dentro do grupo protegido; não há Middleware, Proxy, Server Action, Route Handler ou leitura autenticada em Server Component.
- A primeira leitura usa `GET /products?limit=20` no navegador, mostra skeleton, diferencia sucesso, catálogo vazio e falha recuperável e apresenta o total recebido sem inferir quantidade de páginas.
- `401` é tratado por código estável e substitui a rota por `/login`; rede, schema inválido e demais falhas exibem fallback seguro com retry manual.
- A desmontagem aborta o `AbortController` e resultados obsoletos são ignorados; `products-screen.spec.tsx` cobre loading, sucesso, total, vazio, `401`, falha/retry e aborto.

### Registro de T07

- `e2e/authenticated-tracer.spec.ts` prova, em ambiente opt-in, login pela tela, confirmação da sessão por `GET /products` e retorno ao login em acesso direto sem cookie; exige `E2E_API_URL`, `E2E_USER_EMAIL` e `E2E_USER_PASSWORD` controlados pelo ambiente.
- O E2E integrado foi executado contra API NestJS local em `http://localhost:3001`, origem web local `http://localhost:3000`, DynamoDB Local provisionado e usuário temporário local: `2 passed`.
- A execução padrão sem credenciais externas manteve o cenário integrado como `2 skipped` e o bootstrap como `1 passed`, sem confundir ausência de ambiente com prova do fluxo autenticado.
- A configuração do Playwright injeta somente a URL pública da API no processo do servidor Next; não há sessão de produção, JWT, Bearer, storage ou endpoint intermediário no cenário.

## Tarefa T01 — Disponibilizar o bootstrap reproduzível da aplicação

Criar o projeto Next.js 16 na raiz existente, com App Router, diretório `src`, TypeScript estrito, ESLint, Tailwind CSS 4 e npm. Fixar dependências no `package-lock.json`, declarar a versão Node.js 24 LTS e oferecer scripts reais para desenvolvimento, lint, tipos, testes, E2E, formatação, build e start, sem apagar a documentação existente.

- **Requisitos relacionados:** `EXPECT-08`, `EXPECT-10`; necessidade técnica do bootstrap descrita no design.
- **Referência ao design:** `DEC-02`, `DEC-10`, `DEC-12`; seções “Tecnologias e responsabilidades” e “Riscos, dependências e migração”.
- **Dependências:** nenhuma.
- **Parte do sistema afetada:** `package.json`, `package-lock.json`, configuração do Next.js, TypeScript, ESLint, Prettier, PostCSS/Tailwind, Vitest, Testing Library e Playwright; estrutura inicial de `src/app`.
- **Testes e verificações:** executar instalação reproduzível; confirmar `npm run lint`, `npm run typecheck`, `npm test -- --run` e `npm run build`; listar rotas geradas e inspecionar artefatos fora dos diretórios esperados.
- **Critérios de conclusão:** dependências exatas estão travadas; os scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`, `format` e `format:check` existem; TypeScript permanece estrito; a aplicação base compila sem substituir os documentos.
- **Riscos ou premissas:** a versão exata será a estável compatível dentro das famílias aprovadas e ficará registrada no lockfile; qualquer incompatibilidade entre Next.js 16 e uma ferramenta deve ser resolvida sem trocar a arquitetura aprovada.

## Tarefa T02 — Materializar os fundamentos do design system

Configurar Inter e Barlow Condensed com `next/font`, os tokens semânticos da ADR-004 no CSS global e o `components.json` do shadcn/ui. Incorporar somente as primitivas necessárias ao tracer bullet — botão, campo, card, alert, skeleton/spinner e estrutura de formulário — preservando suas APIs acessíveis e centralizando variantes reais.

- **Requisitos relacionados:** `AGP-37`, `EXPECT-01` a `EXPECT-06`.
- **Referência ao design:** `DEC-10`; seção “Primitivas e variantes do design system”; ADR-004.
- **Dependências:** `T01`.
- **Parte do sistema afetada:** `src/app/globals.css`, `src/app/layout.tsx`, `components.json`, `src/components/ui/*`, `src/lib/utils.ts`.
- **Testes e verificações:** executar `shadcn info`, consultar a documentação da versão instalada, usar `--dry-run`/`--diff` antes de adicionar componentes, testar variantes e nomes acessíveis e validar automaticamente os pares de contraste governados pela ADR-004.
- **Critérios de conclusão:** componentes consomem tokens semânticos; não há cores cruas, tema escuro ou framework concorrente; fontes são incluídas no build; foco, disabled, loading e contraste possuem comportamento verificável.
- **Riscos ou premissas:** a base, preset e biblioteca de ícones devem ser registrados em `components.json`; nenhuma customização upstream pode ser sobrescrita sem leitura do diff.

## Tarefa T03 — Implementar o cliente HTTP compartilhado e tipado

Criar um cliente fino que componha URLs a partir de `NEXT_PUBLIC_API_URL`, envie sempre `credentials: 'include'`, serialize JSON quando necessário, aceite `AbortSignal` e diferencie sucesso sem corpo, sucesso validado, erro validado da API e falha não confiável. O cliente não conhece mensagens, rotas de navegação ou regras específicas de autenticação e produtos.

- **Requisitos relacionados:** `AGP-39` a `AGP-44`, `EXPECT-09`, `EXPECT-10`.
- **Referência ao design:** `DEC-01`, `DEC-03`, `DEC-07`, `DEC-08`; seções “Cliente HTTP compartilhado” e “Contratos de API”.
- **Dependências:** `T01`.
- **Parte do sistema afetada:** `src/lib/api-client.ts`, schemas/tipos de erro compartilhados e testes próximos.
- **Testes e verificações:** provar URL direta sem `/api`, credenciais em todos os métodos, ausência de `Authorization`, `X-CSRF-Protection`, `Origin` ou `Referer` definidos pelo código, validação do erro, leitura segura de `Retry-After`, `correlationId`, resposta sem corpo, aborto, rede e payload malformado.
- **Critérios de conclusão:** nenhum chamador precisa repetir política de transporte; dados externos só entram como sucesso após validação; status ou schema inesperado produz fallback tipado sem expor corpo bruto.
- **Riscos ou premissas:** `NEXT_PUBLIC_API_URL` é pública e obrigatória; erro de CORS é indistinguível de certas falhas de rede no navegador e usa o mesmo fallback seguro.

## Tarefa T04 — Criar os contratos mínimos dos gateways de login e listagem

Implementar os schemas e funções de feature necessários ao tracer bullet: credenciais de login, `POST /auth/login`, produto, página de produtos e `GET /products?limit=20`. Mapear códigos reconhecidos para dados de domínio sem permitir que texto livre da API decida comportamento.

- **Requisitos relacionados:** `AGP-10`, `AGP-12`, `AGP-13`, `AGP-17`, `AGP-18`, `AGP-39` a `AGP-43`, `EXPECT-09`.
- **Referência ao design:** `DEC-03`, `DEC-07`; seções “Gateways de autenticação e produtos” e “Contratos de API”.
- **Dependências:** `T03`.
- **Parte do sistema afetada:** `src/features/auth/api`, `src/features/auth/schemas`, `src/features/products/api`, `src/features/products/schemas`, tipos públicos das duas features.
- **Testes e verificações:** testar métodos, caminhos, payloads, limite padrão, respostas `204`/`200`, credenciais inválidas, `401`, `429`, schema de produto/página inválido e preservação de cursor sem interpretação.
- **Critérios de conclusão:** login aceita somente entrada válida; listagem retorna `items`, `total` e `nextCursor` tipados; cada resposta contratada vira resultado explícito e os gateways não acessam storage nem cookie.
- **Riscos ou premissas:** o contrato operacional da OpenAPI precisa coincidir com os schemas locais; divergência observada bloqueia o tracer bullet e deve ser coordenada com o back-end.

## Tarefa T05 — Entregar a tela de login acessível

Compor `/login` como rota pública pequena e uma fronteira cliente da feature que valida e envia e-mail e senha, mantém erro de campo ou geral próximo ao formulário, bloqueia reenvio e navega para `/` somente após `204`. Senha fica apenas no estado efêmero necessário à tentativa.

- **Requisitos relacionados:** `AGP-10` a `AGP-12`, `AGP-37` a `AGP-44`, `EXPECT-01` a `EXPECT-06`.
- **Referência ao design:** `DEC-02`, `DEC-04`, `DEC-07`, `DEC-08`, `DEC-10`; fluxo “Login e confirmação de sessão”.
- **Dependências:** `T02`, `T04`.
- **Parte do sistema afetada:** `src/app/(public)/login/page.tsx`, `src/features/auth/components/login-screen.tsx`, formulário e mapeadores de erro de login.
- **Testes e verificações:** usar Testing Library e `user-event` para labels, teclado, foco, validação, loading, disabled, credenciais inválidas, rate limit e fallback; verificar que senha não é persistida ou registrada.
- **Critérios de conclusão:** o fluxo funciona por teclado; o envio duplicado é impedido; falha mantém correções possíveis; sucesso navega sem acessar JWT; mensagens não revelam qual credencial falhou.
- **Riscos ou premissas:** a confirmação da sessão não ocorre no login; ela depende da primeira leitura protegida da tarefa seguinte.

## Tarefa T06 — Provar a primeira leitura protegida do catálogo

Compor `/` com uma fronteira cliente de produtos que exibe skeleton durante a leitura, solicita a primeira página, mostra os itens mínimos e o total em sucesso e conduz ao login em `401`. Nesta fase, paginação e estados completos do catálogo permanecem para a Fase 04.

- **Requisitos relacionados:** `AGP-11`, `AGP-13`, `AGP-14`, `AGP-17`, `AGP-18`, `AGP-37`, `AGP-42`, `AGP-43`, `EXPECT-01`, `EXPECT-02`, `EXPECT-05`, `EXPECT-09`.
- **Referência ao design:** `DEC-01`, `DEC-02`, `DEC-04`, `DEC-05`, `DEC-07`; fluxo “Login e confirmação de sessão”.
- **Dependências:** `T02`, `T04`, `T05`.
- **Parte do sistema afetada:** `src/app/(protected)/page.tsx`, boundary de loading/erro aplicável, `src/features/products/components/products-screen.tsx` e apresentação mínima da página.
- **Testes e verificações:** testar loading, sucesso, total, resposta malformada, erro recuperável, desmontagem/aborto e redirecionamento em `401`; confirmar que a rota não usa Middleware, Proxy, Server Action ou Route Handler.
- **Critérios de conclusão:** login válido chega ao catálogo; sessão ausente ou expirada retorna ao login; nenhuma leitura autenticada parte do servidor Next.js; a tela não infere total de páginas.
- **Riscos ou premissas:** a origem local precisa estar autorizada e compatível com o cookie; falha nessa dependência deve ser distinguida de regressão da UI nas evidências.

## Tarefa T07 — Validar o tracer bullet em todos os níveis aplicáveis

Consolidar os testes integrados da fase para provar instalação, contrato, acessibilidade básica e o caminho login → catálogo, incluindo o acesso direto a `/` sem sessão. Registrar um cenário Playwright contra ambiente controlado e autorizado, sem usar sessão de produção.

- **Requisitos relacionados:** `AGP-10` a `AGP-14`, `AGP-17`, `AGP-18`, `AGP-37` a `AGP-44`, `EXPECT-07` a `EXPECT-10`.
- **Referência ao design:** `DEC-01`, `DEC-03`, `DEC-05`, `DEC-07`, `DEC-12`.
- **Dependências:** `T01` a `T06`.
- **Parte do sistema afetada:** testes unitários e de componentes próximos ao código, `e2e/authenticated-tracer.spec.ts`, configuração de testes e evidências da fase.
- **Testes e verificações:** executar `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run test:e2e` quando o ambiente estiver disponível, `npm run build`, `npm run format:check` e `git diff --check`; buscar endpoints intermediários, Bearer/JWT e storages proibidos.
- **Critérios de conclusão:** o E2E prova login e proteção real pela API; gates locais passam; eventual indisponibilidade externa fica registrada sem ser confundida com aprovação do comportamento; o review independente da fase pode reproduzir as evidências.
- **Riscos ou premissas:** o E2E depende de API e origem controladas; sem elas, a fase não pode ser declarada integrada apenas por mocks.

## Orientações de implementação

- Usar npm porque o repositório não possui gerenciador anterior e a documentação oficial do bootstrap oferece suporte direto; o `package-lock.json` passa a definir a instalação reproduzível.
- Manter `page.tsx` e `layout.tsx` como composição; toda operação autenticada nasce na menor fronteira `'use client'` da feature.
- Não criar o CRUD inteiro nesta fase. O tracer bullet prova somente login, sessão inferida e primeira página.
- Consultar `components.json`, `shadcn info` e a documentação do componente antes de incorporar qualquer primitiva.

## Testes e verificações da fase

Executar os scripts criados em `T01`; revisar o diff; confirmar ausência de código fora das camadas `app → features → components/ui|lib`; validar os estados do tracer em viewport pequena, média e grande; e executar o cenário integrado somente em origem autorizada.

## Critérios de aceitação da fase

1. A instalação é reproduzível e lint, tipos, testes unitários e build possuem comandos reais.
2. O login chama a API diretamente com credenciais incluídas, sem expor token ou criar endpoint intermediário.
3. A primeira leitura protegida confirma a sessão por comportamento observável e trata `401` com retorno ao login.
4. Componentes mínimos usam tokens semânticos, foco visível, labels e estados de loading/erro acessíveis.
5. O caminho principal possui evidência unitária, de componente e E2E quando o ambiente integrado está disponível.

## Riscos, premissas e dependências externas da fase

- API, CORS e cookie são dependências do tracer bullet; validar a matriz de origem antes do E2E.
- O repositório parte sem runtime, então qualquer falha preexistente é documental ou ambiental e deve ser separada de regressão introduzida.
- A conclusão desta fase exige `review`; não iniciar a Fase 02 automaticamente.
