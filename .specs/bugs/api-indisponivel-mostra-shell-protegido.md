# Bug — API indisponível mantém informações da área protegida

| Status       | Resolvido      |
|--------------|-----------------|
| Created      | 2026-09-06      |
| Last Updated | 2026-09-06      |

## Comportamento esperado e observado

**Esperado:** quando a API não puder ser alcançada durante a entrada em uma rota protegida, o usuário deve ser conduzido ao login sem receber a tela de erro da área protegida nem a navegação de catálogo/produto.

**Observado:** a rota protegida monta o `ProtectedShell` antes de a API responder. Em uma falha de rede, a tela de catálogo permanece com a mensagem genérica e a navegação “Catálogo”, “Novo produto” e “Sair” continua visível.

## Contexto e evidências

- **Entradas:** acesso à raiz publicada enquanto a API ainda está indisponível.
- **Ambiente:** front-end publicado em `products.devmoreno.com.br`; evidência visual fornecida pelo usuário em 2026-09-06.
- **Frequência:** sempre que a leitura inicial protegida falha sem retornar `401`.
- **Evidências:** a imagem fornecida mostra “Não foi possível carregar o catálogo” e, simultaneamente, as ações “Catálogo”, “Novo produto” e “Sair”. No código, `src/app/(protected)/layout.tsx` monta `ProtectedShell` independentemente do resultado de `ProductsScreen`; `ProductsScreen` trata falha de rede como erro recuperável.

## Reprodução

1. Acessar uma rota protegida sem a API disponível.
2. Fazer a leitura inicial de produtos falhar por rede ou indisponibilidade do serviço.
3. Observar a tela resultante.

**Reprodução determinística de regressão:** o teste de `ProductsScreen` força `listProducts` a retornar `{ kind: 'failure', reason: 'network' }` e exige redirecionamento para `/login`, ausência do alerta genérico e estado seguro de redirecionamento.

**Confirmação:** sim. Antes da correção, o teste falhou porque a implementação não chamou `replace('/login')` para falha de rede e exibiu o alerta genérico.

## Hipóteses testadas e resultados

| # | Hipótese | Teste (uma variável por vez) | Resultado |
|---|----------|------------------------------|-----------|
| H1 | O cliente HTTP expõe detalhes externos da exceção de rede | Inspeção de `requestApi` e teste de falha de rede | Refutada: a exceção é reduzida a `reason: 'network'`, sem mensagem externa. |
| H2 | O layout protegido aguarda a confirmação da sessão antes de renderizar a navegação | Inspeção de `src/app/(protected)/layout.tsx` e `ProtectedShell` | Refutada: o shell é renderizado imediatamente, sem gate de acesso. |
| H3 | A tela protegida trata falha de rede como erro recuperável em vez de conduzir ao login | Teste determinístico com `listProducts` retornando `reason: 'network'` | Confirmada: a tela renderiza o alerta genérico e não chama `replace('/login')`. |

## Causa raiz confirmada

As leituras iniciais protegidas distinguem apenas `401` como motivo para redirecionar. Falhas de rede e respostas de indisponibilidade caem no estado genérico de erro, enquanto o layout continua exibindo o shell protegido. Isso produz a combinação observada de erro e navegação protegida.

## Proposta de correção

Nas confirmações/leitura iniciais das rotas protegidas, tratar falhas não abortadas e indisponibilidade da API como ausência de acesso confirmável: limpar o conteúdo protegido, redirecionar para `/login` e não renderizar o erro genérico. Manter os estados de erro recuperável para respostas operacionais reconhecidas que ainda podem ser tratadas dentro do fluxo autenticado, como rate limit.

## Teste de regressão

O teste de `ProductsScreen` que simula `reason: 'network'` deve chamar `replace('/login')`, mostrar somente o estado de redirecionamento e não exibir “Não foi possível carregar o catálogo”. Testes equivalentes devem cobrir o gate de criação e a leitura inicial do detalhe.

## Validações realizadas

- Teste de regressão antes da correção: falhou pelo motivo certo — `ProductsScreen` não chamou `replace('/login')` e mostrou o alerta genérico após `reason: 'network'`.
- Correção aplicada: `protected-read.ts`, `ProductsScreen`, `ProductCreationGate`, `ProductDetailScreen` e testes correspondentes.
- Teste de regressão depois: passou — 33 testes direcionados, incluindo catálogo, gate de criação e detalhe.
- Reprodução original: passou no E2E — 24 cenários executados, 20 passaram e 4 foram pulados por credenciais opcionais; o cenário “API cai” chegou ao login sem navegação protegida nem erro de catálogo.
- Testes relevantes do projeto: `npm test -- --run` passou com 25 arquivos e 178 testes; `npm run typecheck`, `npm run lint` e `npm run build` passaram; `git diff --check` passou.
- Formatação: os arquivos alterados passaram em `prettier --check` isoladamente. O `npm run format:check` global permanece bloqueado por 88 arquivos preexistentes com divergência de fim de linha no checkout, além de `next-env.d.ts` ser reescrito automaticamente pelo Next.js durante `dev`/E2E; nenhum arquivo não relacionado foi reformatado.

## Riscos e prevenções futuras

- Uma falha temporária de rede também conduz ao login, conforme o requisito de não expor a área protegida quando a sessão não puder ser confirmada; o login poderá ser repetido quando a API voltar.
- A confirmação depende de chamadas protegidas já existentes; não foi criado endpoint intermediário nem alterado o contrato da API.
