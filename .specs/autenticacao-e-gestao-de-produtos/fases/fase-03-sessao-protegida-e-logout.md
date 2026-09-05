# Fase 03 — Sessão protegida e logout

| Status       | Pendente   |
|--------------|------------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

**Objetivo e resultado esperado:** tornar uniforme a experiência protegida, tratar sessão ausente ou expirada em qualquer operação e permitir logout idempotente.
**Capacidade ou fluxo coberto:** shell protegido → operação autenticada → sucesso ou `401` → login; logout → `204` → descarte do estado local → login.
**Requisitos relacionados:** `AGP-13` a `AGP-16`, `AGP-37` a `AGP-44`, `EXPECT-01`, `EXPECT-02`, `EXPECT-05`, `EXPECT-07`, `EXPECT-09`.
**Dependências externas:** Fases 01 e 02 aprovadas; contrato de cookie e logout da API disponível.

## Tarefa T13 — Compor o shell protegido sem presumir autenticação

Criar a composição visual e navegacional comum das rotas protegidas, com acesso ao catálogo, criação futura e ação de logout. O shell não lê cookie, não mantém um booleano global de sessão e não substitui a confirmação feita pelas operações protegidas.

- **Requisitos relacionados:** `AGP-13`, `AGP-14`, `AGP-15`, `AGP-37`, `EXPECT-01`, `EXPECT-02`, `EXPECT-05`.
- **Referência ao design:** `DEC-01`, `DEC-02`, `DEC-04`, `DEC-05`, `DEC-10`; componente “Shell de experiência protegida”.
- **Dependências:** `T02`, `T06`.
- **Parte do sistema afetada:** layout/composição do grupo protegido e componentes de navegação da feature apropriada.
- **Testes e verificações:** testar semântica, foco, navegação por teclado, responsividade e ausência de verificação de cookie/Middleware; confirmar que o conteúdo protegido continua aguardando a leitura real.
- **Critérios de conclusão:** o shell é reutilizado pelas rotas protegidas sem importar internos entre features; nenhum estado visual é tratado como autorização; ações permanecem acessíveis em todos os breakpoints.
- **Riscos ou premissas:** a navegação comum não deve virar um provider universal de sessão sem necessidade aprovada.

## Tarefa T14 — Uniformizar o tratamento de sessão inválida nas features

Fornecer uma pequena política reutilizável para que qualquer resultado `401` de operação protegida descarte somente estado local sensível/obsoleto e conduza ao login. Não renovar sessão, inspecionar cookie ou adicionar relógio paralelo aos 15 minutos da API.

- **Requisitos relacionados:** `AGP-13`, `AGP-14`, `AGP-37`, `AGP-42` a `AGP-44`.
- **Referência ao design:** `DEC-01`, `DEC-04`, `DEC-05`, `DEC-07`; seções “Sessão expirada” e “Autenticação e proteção de páginas”.
- **Dependências:** `T03`, `T13`.
- **Parte do sistema afetada:** função/hook focado de navegação não autorizada e controladores protegidos.
- **Testes e verificações:** provar `401` durante leitura e mutação simulada, descarte de cursores/dados protegidos, navegação ao login e ausência de refresh token, storage ou timer de sessão.
- **Critérios de conclusão:** toda feature possui um caminho consistente para `401`; estados não autorizados não piscam conteúdo anterior; a política não conhece endpoints específicos.
- **Riscos ou premissas:** `403` não é tratado como sessão expirada; permanece erro de origem/autorização da operação.

## Tarefa T15 — Implementar logout idempotente e acessível

Adicionar o contrato `POST /auth/logout` e a ação no shell. Bloquear cliques repetidos durante a tentativa; em `204`, descartar estado local protegido e navegar ao login. Tratar o comportamento idempotente contratado sem tentar ler ou remover o cookie pelo JavaScript.

- **Requisitos relacionados:** `AGP-15`, `AGP-16`, `AGP-37` a `AGP-44`.
- **Referência ao design:** `DEC-01`, `DEC-07`, `DEC-08`; fluxo “Logout”.
- **Dependências:** `T13`, `T14`.
- **Parte do sistema afetada:** gateway de autenticação, controle de logout e estado do shell protegido.
- **Testes e verificações:** testar método/caminho, `204`, `403`, `429`, falha de rede, disabled/loading, acionamento por teclado e conclusão com sessão já ausente conforme contrato.
- **Critérios de conclusão:** logout encerra a experiência local e volta ao login; não há manipulação de cookie; erro mantém feedback seguro e não repete automaticamente a mutação.
- **Riscos ou premissas:** se a API divergir do `204` idempotente documentado, a diferença deve ser resolvida no contrato antes de alterar o comportamento.

## Tarefa T16 — Validar expiração, acesso direto e logout de ponta a ponta

Cobrir acesso direto a cada tipo de rota protegida sem sessão, expiração observada por `401` e logout com sessão válida ou ausente. Garantir que dados e navegação protegidos não permaneçam disponíveis depois da perda de sessão.

- **Requisitos relacionados:** `AGP-13` a `AGP-16`, `AGP-37`, `AGP-42` a `AGP-44`, `EXPECT-07`, `EXPECT-09`.
- **Referência ao design:** `DEC-01`, `DEC-05`, `DEC-07`, `DEC-12`.
- **Dependências:** `T13` a `T15`.
- **Parte do sistema afetada:** testes de componentes protegidos e `e2e/session-and-logout.spec.ts`.
- **Testes e verificações:** executar cenários com ausência e invalidação controlada de sessão, além dos gates da fase; verificar storage, console e histórico após logout.
- **Critérios de conclusão:** rotas protegidas convergem ao login em `401`; logout é observável e idempotente; nenhum segredo ou estado protegido persiste no navegador por decisão da aplicação.
- **Riscos ou premissas:** testar 900 segundos em tempo real é desnecessário; o ambiente deve oferecer mecanismo controlado para invalidar/expirar a sessão ou simular o contrato no nível correto.

## Orientações de implementação

- Reutilizar uma política pequena para `401`, sem transformar a aplicação em store ou provider global.
- Não confundir `401` com `403`; origem rejeitada recebe feedback seguro e não redireciona como sessão expirada.
- O shell compõe rotas; gateways continuam pertencendo às features.

## Testes e verificações da fase

Executar testes unitários/componentes, E2E de sessão e logout, lint, tipos e build. Fazer busca residual por cookie, token, storage, Middleware, Proxy e endpoints `/api/*`.

## Critérios de aceitação da fase

1. Operações protegidas tratam `401` de forma uniforme sem ler o cookie.
2. Shell protegido permanece acessível e não presume autorização.
3. Logout conclui em `204`, limpa estado local e direciona ao login.
4. Ausência ou expiração de sessão possui teste reproduzível.

## Riscos, premissas e dependências externas da fase

- A invalidação controlada da sessão é dependência do E2E integrado.
- Estado local novo em fases futuras deve aderir à política de descarte desta fase.
- A conclusão exige `review`; não iniciar a Fase 04 automaticamente.
