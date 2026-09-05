# Fase 02 — Cadastro e autenticação pública completa

| Status       | Em execução   |
|--------------|------------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

**Objetivo e resultado esperado:** permitir que um visitante crie uma conta, receba confirmação e siga para um login completo, sem que o cadastro inicie sessão.
**Capacidade ou fluxo coberto:** `/register` → `POST /auth/register` → confirmação transitória → `/login` → tratamento integral das respostas públicas.
**Requisitos relacionados:** `AGP-01` a `AGP-12`, `AGP-37` a `AGP-44`, `EXPECT-01` a `EXPECT-09`.
**Dependências externas:** Fase 01 aprovada; endpoints públicos da API e origem autorizada disponíveis.

## Tarefa T08 — Definir e testar os schemas de cadastro

Criar o schema da feature de autenticação para normalizar nome e e-mail, validar nome com 2 a 100 caracteres, e-mail válido sem espaços nas extremidades e senha com 8 a 128 caracteres. Derivar o tipo do formulário do schema e manter mensagens de campo próprias do cadastro.

- **Requisitos relacionados:** `AGP-01` a `AGP-05`.
- **Referência ao design:** `DEC-03`, `DEC-04`; seção “Cadastro” e contratos de API.
- **Dependências:** `T01`.
- **Parte do sistema afetada:** `src/features/auth/schemas/register-schema.ts` e teste unitário próximo.
- **Testes e verificações:** cobrir limites inferiores e superiores, trim/normalização, e-mail inválido, senha curta/longa, entradas desconhecidas e associação de mensagens aos campos.
- **Critérios de conclusão:** entradas válidas produzem payload normalizado; cada limite inválido falha antes do transporte; o tipo do formulário é derivado sem `any` ou coerção insegura.
- **Riscos ou premissas:** normalização deve reproduzir o contrato publicado sem alterar a senha.

### Registro de T08

- `registerSchema` valida nome, e-mail e senha em objeto estrito, normaliza nome/e-mail e preserva a senha.
- `src/features/auth/schemas/register.spec.ts` cobre normalização, limites 2/100 e 8/128, entradas inválidas, propriedades desconhecidas e mensagens associadas aos campos.
- Verificação: `npm test -- --run src/features/auth/schemas/register.spec.ts` (8 testes), `npm run typecheck`, `npm run lint`, `npx prettier --check src/features/auth/schemas/register.ts src/features/auth/schemas/register.spec.ts` e `git diff --check` — todos passaram.

## Tarefa T09 — Implementar o gateway de cadastro e seus erros contratados

Adicionar `POST /auth/register` ao gateway de autenticação, validar a resposta segura `{ id, name, email }` e mapear validação, origem rejeitada, e-mail duplicado, rate limit e falha não confiável. A resposta nunca pode aceitar senha, hash, cookie ou token como dado da aplicação.

- **Requisitos relacionados:** `AGP-06`, `AGP-08`, `AGP-09`, `AGP-39` a `AGP-44`, `EXPECT-09`.
- **Referência ao design:** `DEC-01`, `DEC-03`, `DEC-07`, `DEC-08`; fluxo “Cadastro”.
- **Dependências:** `T03`, `T08`.
- **Parte do sistema afetada:** gateway, schema de resposta e mapeador de erros de cadastro em `src/features/auth`.
- **Testes e verificações:** provar `201`, `400`, `403`, `409`, `429`, `Retry-After`, erro por campo, `correlationId`, rede e resposta com campos sensíveis ou schema inválido.
- **Critérios de conclusão:** sucesso só existe após validar os três campos seguros; e-mail duplicado e origem rejeitada têm resultado específico; mutação não recebe retry automático nem cabeçalho CSRF.
- **Riscos ou premissas:** mensagens brutas da API não são apresentadas; apenas códigos conhecidos orientam feedback específico.

### Registro de T09

- O gateway chama `POST /auth/register` diretamente com `credentials: include`, sem cabeçalho CSRF, Authorization ou retry automático.
- `registeredUserSchema` aceita somente `id`, `name` e `email`; respostas com senha, hash, token ou propriedades desconhecidas viram falha de resposta inválida.
- O mapeamento cobre validação, origem rejeitada, e-mail duplicado, rate limit com `Retry-After`, indisponibilidade e fallback desconhecido, preservando `correlationId` validado.
- Verificação: `npm test -- --run src/features/auth/schemas/register.spec.ts src/features/auth/schemas/registered-user.spec.ts src/features/auth/api/auth-gateway.spec.ts` (25 testes), `npm run typecheck`, `npm run lint`, `npx prettier --check` nos arquivos alterados e `git diff --check` — todos passaram.

## Tarefa T10 — Entregar a tela de cadastro e a transição segura para login

Compor `/register` com formulário acessível baseado nas primitivas compartilhadas. Durante o envio, bloquear repetição; no sucesso, descartar a senha, navegar para `/login` e transportar apenas um sinal público de confirmação que será consumido e removido/canonicalizado pelo login.

- **Requisitos relacionados:** `AGP-01`, `AGP-05` a `AGP-08`, `AGP-37`, `AGP-38`, `EXPECT-01` a `EXPECT-06`.
- **Referência ao design:** `DEC-02`, `DEC-04`, `DEC-08`, `DEC-09`, `DEC-10`.
- **Dependências:** `T02`, `T09`.
- **Parte do sistema afetada:** `src/app/(public)/register/page.tsx`, tela/formulário de cadastro e consumo do sinal em `/login`.
- **Testes e verificações:** testar navegação por teclado, erro por campo, erro geral persistente, disabled/loading, duplo clique, foco após falha, sinal de sucesso sem PII e ausência de sessão automática.
- **Critérios de conclusão:** visitante conclui o cadastro e vê a confirmação no login; o histórico não mantém informação pessoal; o cadastro não trata `201` como autenticação e não acessa o catálogo.
- **Riscos ou premissas:** o sinal transitório pode permanecer na URL apenas até ser consumido; deve usar valor enumerado, não texto livre nem dado do usuário.

### Registro de T10

- `/register` compõe um formulário acessível com campos independentes, validação local, feedback persistente, loading e bloqueio de reenvio.
- O sucesso limpa o estado efêmero, não cria sessão e navega apenas para `/login?registered=success`; o login exibe a confirmação e canonicaliza a URL para `/login`.
- `AuthShell` concentra somente a composição visual compartilhada, enquanto cadastro e login mantêm schemas e mensagens de negócio separados.
- Verificação: `npm test -- --run src/features/auth/components/login-screen.spec.tsx src/features/auth/components/register-screen.spec.tsx` (9 testes), `npm run typecheck`, `npm run lint`, `npx prettier --check` nos arquivos alterados e `git diff --check` — todos passaram.

## Tarefa T11 — Completar o feedback seguro do login público

Completar a tela de login do tracer bullet para tratar validação, credenciais inválidas, origem rejeitada, rate limit com duração válida, falha de rede e `correlationId`, mantendo o erro importante junto ao formulário e oferecendo nova tentativa somente por ação explícita.

- **Requisitos relacionados:** `AGP-10`, `AGP-12`, `AGP-37` a `AGP-44`.
- **Referência ao design:** `DEC-07`, `DEC-08`, `DEC-09`, `DEC-10`.
- **Dependências:** `T05`, `T10`.
- **Parte do sistema afetada:** mapeador e componentes do login em `src/features/auth`.
- **Testes e verificações:** simular todos os status contratados, `Retry-After` válido/ausente/inválido, fallback seguro e `correlationId`; confirmar que feedback não depende somente de toast ou cor.
- **Critérios de conclusão:** cada resposta pública contratada gera orientação coerente; excesso de requisições informa espera sem retentar automaticamente; detalhes internos nunca chegam à interface.
- **Riscos ou premissas:** a duração exibida é apenas a informada de modo confiável pela API e não cria um relógio de sessão.

## Tarefa T12 — Provar cadastro e login público de ponta a ponta

Adicionar testes integrados que criem uma conta nova, confirmem a chegada ao login sem sessão, autentiquem essa conta e validem e-mail duplicado, credenciais inválidas, validações e rate limit nos níveis apropriados.

- **Requisitos relacionados:** `AGP-01` a `AGP-12`, `AGP-37` a `AGP-44`, `EXPECT-07`, `EXPECT-09`.
- **Referência ao design:** `DEC-01`, `DEC-03`, `DEC-07`, `DEC-08`, `DEC-09`, `DEC-12`.
- **Dependências:** `T08` a `T11`.
- **Parte do sistema afetada:** testes unitários/componentes de autenticação e `e2e/registration-and-login.spec.ts`.
- **Testes e verificações:** executar a suíte da feature e um E2E com dados únicos e isoláveis; repetir os gates `lint`, `typecheck`, testes e build; verificar ausência de segredo em URL, storage, console e mensagens.
- **Critérios de conclusão:** o cenário reproduz cadastro → login → catálogo; cadastro não autentica; os erros essenciais estão cobertos por teste observável; o review independente consegue reproduzir o fluxo.
- **Riscos ou premissas:** o mecanismo de dados E2E precisa ser autorizado e não pode depender de usuários de produção.

## Orientações de implementação

- Reutilizar `FieldGroup`, `Field`, controles e mapeamento HTTP da Fase 01; não criar formulário universal.
- Cadastro e login compartilham primitivas, não schemas nem mensagens de negócio.
- O sucesso entre rotas usa somente estado público enumerado e é canonicalizado depois de lido.

## Testes e verificações da fase

Executar testes de schema, gateway e componentes, o E2E público contra ambiente controlado e todos os gates existentes. Revisar teclado, foco, zoom e breakpoints das duas telas públicas.

## Critérios de aceitação da fase

1. Cadastro valida e normaliza os três campos, trata e-mail duplicado e não inicia sessão.
2. Sucesso do cadastro é confirmado no login sem PII persistida.
3. Login trata credenciais inválidas, origem, rate limit e falhas inesperadas de forma segura.
4. Mutações públicas bloqueiam reenvio e não recebem retry automático.
5. Cadastro e login possuem cobertura automatizada reproduzível.

## Riscos, premissas e dependências externas da fase

- Cadastro público depende dos limites e códigos vigentes da OpenAPI.
- Rate limit pode tornar o E2E instável se os dados e a frequência não forem isolados.
- A conclusão exige `review`; não iniciar a Fase 03 automaticamente.
