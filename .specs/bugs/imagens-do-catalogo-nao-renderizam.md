# Bug — Imagens do catálogo não renderizam

| Status       | Resolvido |
|--------------|------------|
| Created      | 2026-09-06 |
| Last Updated | 2026-09-06 |

## Comportamento esperado e observado

**Esperado:** produtos com `imageUrl` HTTP(S) válido devem exibir a imagem no
catálogo e na tela de detalhe.

**Observado:** todos os produtos exibem o fallback `Imagem indisponível`,
mesmo quando a URL retornada pela API é válida.

## Contexto e evidências

- **Entradas:** catálogo autenticado em `http://localhost:3000/` e resposta
  `GET http://localhost:3001/products?limit=20`.
- **Ambiente:** desenvolvimento local, Next.js 16.3.4, API local na porta
  `3001`.
- **Frequência:** sempre no ambiente atual.
- **Evidências:** a API retornou imagens nas origens
  `https://s3.amazonaws.com` e `https://martech-web-cdn.stone.com.br`; o
  `.env` local contém `NEXT_PUBLIC_IMAGE_ORIGINS=` vazio.

## Reprodução

1. Iniciar o front-end com `npm run dev`.
2. Abrir `http://localhost:3000/` com uma sessão autenticada.
3. Aguardar o carregamento do catálogo.
4. Verificar os 20 cartões da primeira página.

**Confirmação:** sim. Os 20 cartões observados exibiram somente o fallback
acessível e nenhuma requisição `/_next/image` ou à origem da imagem foi
emitida pelo navegador.

## Hipóteses testadas e resultados

| # | Hipótese | Teste (uma variável por vez) | Resultado |
|---|----------|------------------------------|-----------|
| H1 | A allowlist de imagens está vazia no ambiente local. | Inspecionar `.env` e acompanhar o catálogo sem alterar o código. | Confirmada: `NEXT_PUBLIC_IMAGE_ORIGINS` está vazio. |
| H2 | O problema ocorre somente no otimizador do Next.js depois que a imagem é solicitada. | Observar as requisições de rede durante o carregamento. | Refutada para o sintoma atual: a origem é bloqueada antes de `next/image` emitir uma requisição. |

## Causa raiz confirmada

`ProductImage` só renderiza `next/image` quando
`isAllowedImageUrl(src, getConfiguredImageOrigins())` é verdadeiro. Com
`NEXT_PUBLIC_IMAGE_ORIGINS` vazio, `getConfiguredImageOrigins()` retorna uma
lista vazia; por isso todas as URLs válidas do catálogo são convertidas
imediatamente no fallback e nunca chegam ao navegador.

## Proposta de correção

Remover a allowlist e o `remotePatterns` derivados dela. `ProductImage` deve
continuar usando `next/image`, mas com `unoptimized`, para que a URL fornecida
pela API seja carregada diretamente pelo navegador sem exigir manutenção de
origens no front-end. O fallback permanece para falhas reais de carregamento.

## Teste de regressão

Recarregar o catálogo e confirmar que as URLs retornadas pela API são
renderizadas diretamente, sem `/_next/image`, e que as imagens válidas
aparecem no navegador.

## Validações realizadas

- Teste de regressão antes da correção: reprodução visual confirmou 20
  fallbacks e zero requisições de imagem; o teste de componente adicionado
  falhou porque a URL válida era bloqueada pela allowlist vazia.
- Correção aplicada: remoção da allowlist, de `remotePatterns` e da variável
  `NEXT_PUBLIC_IMAGE_ORIGINS`; `next/image` passou a usar `unoptimized`.
- Teste de regressão depois: `npm test -- --run
  src/features/products/components/product-card.spec.tsx` passou (3 testes),
  incluindo URL válida sem allowlist.
- Reprodução original: não reproduz mais; catálogo real exibiu as imagens dos
  produtos no navegador.
- Testes relevantes do projeto: suíte completa passou (24 arquivos, 170
  testes), além de `npm run typecheck`, `npm run lint`, `npm run build`,
  `git diff --check` e o format check dos arquivos da correção.
- Limitação conhecida: `npm run format:check` global aponta somente a
  alteração pré-existente em `next-env.d.ts`, que foi preservada.

## Riscos e prevenções futuras

- O endereço externo pode ficar indisponível, bloquear requisições ou não
  devolver um formato de imagem; o fallback acessível continua sendo a
  proteção de apresentação para esse caso.
- A URL ainda precisa ser validada como HTTP(S) pela API; remover a allowlist
  do front-end não altera essa responsabilidade da API.
