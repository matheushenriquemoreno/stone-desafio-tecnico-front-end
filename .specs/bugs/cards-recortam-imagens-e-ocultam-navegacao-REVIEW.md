# Review — Cards recortam imagens e ocultam a navegação

| Status       | Aprovado   |
| ------------ | ---------- |
| Created      | 2026-09-06 |
| Last Updated | 2026-09-06 |

**Escopo revisado:** correção do bug
`cards-recortam-imagens-e-ocultam-navegacao`

**Versão da avaliação:** 1

## Artefatos analisados

- Relatório do bug:
  `.specs/bugs/cards-recortam-imagens-e-ocultam-navegacao.md`.
- Implementação: `product-image.tsx`, `product-card.tsx` e
  `products-screen.tsx`.
- Testes de componente: `product-card.spec.tsx`, `products-screen.spec.tsx` e
  `product-detail-screen.spec.tsx`.
- Testes de jornada: `product-pagination.spec.ts`, `accessibility.spec.ts` e a
  suíte E2E completa.
- Convenções: `AGENTS.md`, regras locais de Next.js, Tailwind CSS, shadcn/ui,
  testes e qualidade.

## Resumo executivo

A implementação elimina o corte adicional das imagens com `object-contain`,
sem reintroduzir a antiga allowlist e sem alterar o fallback. Cada card passou a
ser um único link para o detalhe, com CTA persistente, nome acessível, foco azul
e movimentos desativados quando o usuário prefere animações reduzidas. A grade e
os skeletons agora seguem a progressão de uma, duas e três colunas.

## Resultado das verificações obrigatórias

| Verificação                | Resultado | Evidência                                                                                            |
| -------------------------- | --------- | ---------------------------------------------------------------------------------------------------- |
| Imagem completa            | Atendida  | `ProductImage` mantém 16:9, fundo semântico, `unoptimized`, fallback e usa `object-contain`.         |
| Link único e acessível     | Atendida  | `ProductCard` contém somente um link, com nome `Ver e editar <produto>` e ID codificado.             |
| CTA e interação            | Atendida  | CTA e seta são persistentes; foco, hover e `prefers-reduced-motion` estão representados por classes. |
| Grade responsiva           | Atendida  | E2E confirmou uma, duas e três colunas em 320, 768 e 1440 px.                                        |
| Jornada de edição          | Atendida  | E2E percorreu catálogo → detalhe → edição por teclado.                                               |
| Fallback                   | Atendida  | Teste de componente confirmou a troca para `Imagem indisponível` após `onError`.                     |
| Contratos e escopo         | Atendida  | API, tipos, rota de detalhe, tokens globais e dependências não foram alterados.                      |
| Qualidade estática e build | Atendida  | Lint, typecheck, build, `git diff --check` e Prettier dos arquivos alterados passaram.               |
| Suítes automatizadas       | Atendida  | Vitest: 24 arquivos e 171 testes; Playwright: 21 testes aprovados e 2 skips previstos.               |

## Matriz de rastreabilidade

| Requisito                                        | Código                          | Teste                                                      | Status     |
| ------------------------------------------------ | ------------------------------- | ---------------------------------------------------------- | ---------- |
| Preservar imagem sem corte do layout             | `ProductImage`                  | Unitário de classes e E2E de `object-fit`                  | Comprovado |
| Manter proporção, carregamento direto e fallback | `ProductImage`                  | Unitário de URL externa e `onError`                        | Comprovado |
| Tornar todo o card um único destino              | `ProductCard`                   | Unitário de quantidade de links, nome acessível, ID e foco | Comprovado |
| Exibir CTA persistente com seta                  | `ProductCard`                   | Unitário e E2E de visibilidade                             | Comprovado |
| Adaptar catálogo e skeletons à nova geometria    | `ProductsScreen`                | E2E nos três breakpoints e inspeção da composição          | Comprovado |
| Preservar detalhe e início da edição             | Rota existente `/products/[id]` | E2E de acessibilidade e suíte de mutações                  | Comprovado |

## Achados

Nenhum achado bloqueador, alto, médio ou baixo.

## Riscos residuais e ressalvas aceitas

- Imagens recortadas no próprio arquivo remoto continuam sem possibilidade de
  recomposição no cliente.
- A inspeção final do catálogo local com dados reais não pôde avaliar os cards
  porque a API local estava indisponível. A geometria, o ajuste da imagem, o
  foco e a jornada foram verificados no navegador por E2E com respostas
  controladas.
- `npm run format:check` global continua apontando somente a alteração
  preexistente em `next-env.d.ts`; os arquivos deste escopo passam isoladamente.

## Veredito

**Veredito:** Aprovado

**Fundamentação:** os requisitos da remodelagem estão rastreados em código e
testes; a regressão falhou antes, passou depois e os gates aplicáveis não
identificaram regressões. A correção anterior de carregamento direto permanece
íntegra e não foi reaberta.

## Próxima ação

Bug fechado. Nenhuma correção adicional é necessária neste escopo.

## Histórico de revisões anteriores

Nenhuma avaliação anterior deste bug.
