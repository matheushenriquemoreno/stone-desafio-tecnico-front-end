# Bug — Catálogo aparece antes da confirmação da sessão

| Status       | Resolvido  |
| ------------ | ---------- |
| Created      | 2026-09-06 |
| Last Updated | 2026-09-06 |

## Comportamento esperado e observado

**Esperado:** ao acessar `/`, a aplicação deve manter uma transição neutra até a resposta da primeira leitura protegida. Com sessão válida, o cabeçalho e o catálogo aparecem; sem sessão válida, a pessoa é conduzida ao login sem visualizar a área protegida.

**Observado:** o cabeçalho protegido, os links “Catálogo”, “Novo produto”, “Sair” e o skeleton do catálogo aparecem imediatamente. Aproximadamente um segundo depois, a navegação muda para `/login`.

## Contexto e evidências

- **Entradas:** acesso direto à URL base publicada sem sessão válida.
- **Ambiente:** `products.devmoreno.com.br`, conforme prints fornecidos em 2026-09-06.
- **Frequência:** ocorre durante a latência da primeira chamada protegida.
- **Evidências:** o primeiro print mostra o shell e três cards skeleton; o segundo mostra a mesma navegação em `/login` já sem o shell protegido.

## Reprodução

1. Acessar `/` sem uma sessão válida.
2. Interceptar ou atrasar a resposta de `GET /products`.
3. Observar a tela antes de liberar a resposta.
4. Liberar `401` e observar o redirecionamento.

**Confirmação:** sim. O E2E determinístico reteve `GET /products` e falhou pelo motivo correto ao encontrar o banner protegido visível durante a resposta pendente.

## Hipóteses testadas e resultados

| #   | Hipótese                                                                      | Teste (uma variável por vez)                                    | Resultado                                                                       |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| H1  | O layout protegido monta o shell antes de a tela confirmar a sessão           | Inspeção de `src/app/(protected)/layout.tsx` e `ProtectedShell` | Confirmada: o shell é renderizado sem depender do resultado de `GET /products`. |
| H2  | A tela de catálogo inicia com skeleton visível enquanto a sessão é confirmada | Interceptação determinística da primeira leitura em teste E2E   | Confirmada: o mesmo estado pendente expõe o skeleton junto do shell.            |
| H3  | A API precisa de um endpoint novo para decidir a entrada                      | Inspeção do contrato e gateways                                 | Refutada: a leitura protegida existente é a confirmação contratada.             |

## Causa raiz confirmada

O layout do grupo protegido envolve `/` com `ProtectedShell` no primeiro render, enquanto `ProductsScreen` só conhece o resultado da sessão depois de executar `listProducts`. Assim, o navegador recebe e mostra navegação e skeleton antes da decisão de acesso.

## Proposta de correção

Isolar `/` do layout que monta o shell antecipadamente, extrair o cabeçalho reutilizável e entregá-lo à `ProductsScreen` como slot. A tela deve renderizar somente um fundo neutro durante a primeira leitura e revelar o slot após sucesso; em `401` ou falha protegida, deve removê-lo antes do redirecionamento.

## Teste de regressão

O E2E deve manter `GET /products` pendente e comprovar ausência do banner, links, botão de logout, skeleton e elementos focáveis. Depois, deve liberar `200` para comprovar a revelação do catálogo e `401` para comprovar o redirecionamento sem flash protegido.

## Validações realizadas

- Teste de regressão antes da correção: falhou pelo motivo certo; `getByRole('banner')` permaneceu visível enquanto `GET /products` estava pendente.
- Correção aplicada: o layout do grupo protegido deixou de envolver `/`; o shell foi preservado em `src/app/(protected)/products/layout.tsx`; `ProtectedHeader` e o slot `protectedHeader` controlam a revelação após a confirmação.
- Teste de regressão depois: passou — os cenários E2E de entrada neutra com `401` e de revelação com `200` passaram; o estado pendente não contém banner, links, logout, skeleton ou foco interno.
- Reprodução original: não reproduz mais — a entrada permanece neutra até a resposta e chega ao login sem exibir a área protegida.
- Testes relevantes do projeto: `npm test -- --run` passou com 25 arquivos e 178 testes; `npm run typecheck`, `npm run lint`, `npm run build`, Prettier dos arquivos tocados e `git diff --check` passaram; E2E completo passou em 22 de 26 cenários, com 2 pulados e 2 falhas de cadastro/sessão por API local indisponível.

## Riscos e prevenções futuras

- O escopo fica restrito à raiz; as rotas `/products/new` e `/products/:id` preservam o layout atual.
- O fallback neutro mantém somente um status visualmente oculto para acessibilidade e não cria estado de sessão paralelo.
- O E2E integrado de cadastro e sessão continua dependente da API NestJS autorizada em `localhost:3001`; essa limitação não afeta a reprodução interceptada desta correção.
