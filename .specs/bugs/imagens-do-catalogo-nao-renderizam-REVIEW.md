# Review — Imagens do catálogo não renderizam

| Status       | Aprovado |
|--------------|----------|
| Created      | 2026-09-06 |
| Last Updated | 2026-09-06 |

**Escopo revisado:** correção do bug `imagens-do-catalogo-nao-renderizam`
**Versão da avaliação:** 1

## Artefatos analisados

- Relatório do bug: `.specs/bugs/imagens-do-catalogo-nao-renderizam.md`
- Implementação: `src/features/products/components/product-image.tsx`,
  `next.config.ts`
- Testes: `src/features/products/components/product-card.spec.tsx` e suíte
  completa
- Configuração e documentação: `.env.example`, `Dockerfile`, CI, `README.md`,
  plano e design técnico atualizados
- Convenções: `AGENTS.md`, regras locais de Next.js, testes e qualidade

## Resumo executivo

A correção remove a allowlist de imagens e o `remotePatterns` que impediam o
catálogo de renderizar URLs cadastradas pelo usuário. `ProductImage` continua
usando `next/image`, agora com `unoptimized`, carregando a URL diretamente no
navegador e mantendo fallback acessível para falhas reais. A reprodução original
foi eliminada no catálogo real, o teste de regressão passou e os gates técnicos
passaram, com a única ressalva de formatação global causada por uma alteração
pré-existente em `next-env.d.ts`.

## Resultado das verificações obrigatórias

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Requisitos do bug | Atendida | O componente não bloqueia mais origens válidas cadastradas pela API. |
| Reprodução original | Atendida | Antes: 20 fallbacks e zero requisições de imagem; depois: imagens visíveis no catálogo real. |
| Teste de regressão | Atendida | O teste de URL sem allowlist falhou antes e passou depois; `ProductCard`: 3 testes. |
| Eliminação da causa | Atendida | `ProductImage` não consulta mais `NEXT_PUBLIC_IMAGE_ORIGINS`; `next.config.ts` não define `remotePatterns`. |
| Fallback e acessibilidade | Atendida | Teste de erro mantém `Imagem indisponível` e o fallback com nome acessível. |
| Contrato de entrada | Atendida | A API continua responsável por validar `imageUrl` HTTP(S); nenhuma validação de origem foi adicionada no cliente. |
| Configuração e documentação | Atendida | Variável removida de `.env.example`, Docker, CI, README e design/plano atuais. |
| Escopo | Atendida | Alterações limitadas à imagem, documentação da decisão, testes e relatório do bug. |
| Qualidade estática | Atendida | `npm run typecheck`, `npm run lint`, `git diff --check` e Prettier dos arquivos alterados passaram. |
| Build e suíte | Atendida | `npm test -- --run`: 24 arquivos e 170 testes; `npm run build` passou. |

## Matriz de rastreabilidade

| Requisito | Código | Teste | Evidência | Status |
|-----------|--------|-------|-----------|--------|
| URL de imagem cadastrada deve aparecer | `ProductImage` usa `next/image` com `unoptimized` | `product-card.spec.tsx`: URL válida sem allowlist | Falha antes da correção; passou depois; catálogo real exibiu imagens S3 e CDN | Comprovado |
| Falha de carregamento deve degradar com segurança | Estado `failedSource` e `ProductImageFallback` | `product-card.spec.tsx`: troca pelo fallback | Suíte direcionada e suíte completa passaram | Comprovado |
| Não exigir configuração por origem | `next.config.ts` sem `images.remotePatterns`; env sem variável | Teste de URL sem allowlist e inspeção de configuração | `rg` não encontrou referência ativa em código/configuração | Comprovado |
| Não criar proxy intermediário | `next/image` com `unoptimized`, sem Route Handler | Build e inspeção de rede | Nenhuma requisição `/_next/image`; URL externa aparece no catálogo | Comprovado |

## Achados

Nenhum achado bloqueador, alto, médio ou baixo.

## Riscos residuais e ressalvas aceitas

- A imagem depende da disponibilidade e do conteúdo servido pela URL externa;
  o fallback acessível cobre falhas de carregamento. Essa troca é consequência
  direta da solicitação explícita de remover a configuração por origem.
- O carregamento direto não usa a otimização server-side do Next.js, podendo
  transferir arquivos maiores; essa é a opção necessária para aceitar URLs
  gerenciadas pelos usuários sem allowlist ou proxy.
- `npm run format:check` global permanece limitado pela alteração anterior em
  `next-env.d.ts`; os arquivos desta correção passam no Prettier.

## Veredito

**Veredito:** Aprovado

**Fundamentação:** a reprodução original foi confirmada e deixou de ocorrer;
o teste de regressão demonstrou a mudança de comportamento na ordem correta;
as imagens reais foram observadas no navegador; o fallback, a API pública e os
gates de qualidade permanecem íntegros.

## Próxima ação

Bug fechado. Nenhuma correção adicional é necessária.

## Histórico de revisões anteriores

Nenhuma avaliação anterior deste bug.
