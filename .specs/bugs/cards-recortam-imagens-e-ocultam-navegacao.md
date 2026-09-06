# Bug — Cards recortam imagens e ocultam a navegação

| Status       | Resolvido  |
| ------------ | ---------- |
| Created      | 2026-09-06 |
| Last Updated | 2026-09-06 |

## Comportamento esperado e observado

**Esperado:** o catálogo deve preservar a imagem completa do produto e deixar
evidente que o card leva ao detalhe, onde o item pode ser editado.

**Observado:** imagens com enquadramentos variados são recortadas para preencher
o contêiner 16:9; somente o nome azul funciona como link, sem um CTA que comunique
a navegação para consulta e edição.

## Contexto e evidências

- **Entradas:** catálogo autenticado com produtos que usam URLs HTTP(S) externas.
- **Ambiente:** Next.js 16.3.4, Tailwind CSS 4 e shadcn/ui Base UI.
- **Frequência:** sempre que a proporção ou o enquadramento da imagem não coincide
  com o contêiner; a baixa descoberta da navegação ocorre em todos os cards.
- **Evidências:** captura fornecida pelo usuário; `ProductImage` usa
  `object-cover`; `ProductCard` restringe o `Link` ao título.

## Reprodução

1. Abrir o catálogo autenticado.
2. Observar um produto cuja imagem possua enquadramento diferente da área 16:9.
3. Verificar que o conteúdo é cortado para preencher a área.
4. Tentar identificar, sem conhecer a implementação, como acessar a edição.

**Confirmação:** sim. A captura mostra conteúdo cortado, e a inspeção do código
confirma `object-cover` e apenas um link textual no nome do produto.

## Hipóteses testadas e resultados

| #   | Hipótese                                             | Teste                                                      | Resultado                                                                                            |
| --- | ---------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| H1  | O recorte é provocado pelo modo de ajuste da imagem. | Inspecionar o `Image` dentro de `ProductImage`.            | Confirmada: `object-cover` preenche a área recortando as bordas.                                     |
| H2  | O card inteiro já comunica navegação.                | Inspecionar os elementos interativos de `ProductCard`.     | Refutada: somente o nome é um link e não existe CTA persistente.                                     |
| H3  | A falha anterior de allowlist voltou.                | Conferir `unoptimized`, configuração e relatório anterior. | Refutada: a URL continua sendo carregada diretamente e o fallback permanece restrito a falhas reais. |

## Causa raiz confirmada

Há duas causas independentes na apresentação do card: `object-cover` recorta a
imagem para preencher a área 16:9, e o alvo de navegação está limitado ao título,
sem affordance persistente que comunique o acesso ao detalhe e à edição.

## Proposta de correção

Trocar o ajuste compartilhado para `object-contain`, preservando a área 16:9 e o
fallback. Transformar o card em um único link acessível para `/products/[id]`,
com CTA visível `Ver e editar`, ícone de seta, foco explícito e movimento reduzido
quando solicitado. Evoluir a grade para três colunas em telas grandes e alinhar
os skeletons à nova geometria.

## Teste de regressão

- Provar que a imagem usa `object-contain` e não `object-cover`.
- Provar que cada card possui um único link, com nome acessível
  `Ver e editar <produto>`, ID codificado e CTA sempre presente.
- Validar responsividade, foco, navegação até o detalhe e fallback de imagem.

## Validações realizadas

- Teste de regressão antes da correção: `product-card.spec.tsx` apresentou três
  falhas e um teste aprovado; faltavam o link único com nome acessível, o CTA e
  `object-contain`.
- Correção aplicada: `ProductImage` passou a preservar o conteúdo com
  `object-contain`; `ProductCard` tornou-se um único link com CTA persistente,
  foco visível e animações compatíveis com movimento reduzido; grade e skeletons
  passaram a usar uma, duas e três colunas.
- Teste de regressão depois: testes direcionados de card, catálogo e detalhe
  passaram (3 arquivos e 30 testes).
- Reprodução original: o E2E controlado confirmou `object-fit: contain`, CTA
  visível, foco por teclado e uma, duas e três colunas em 320, 768 e 1440 px. A
  inspeção visual do catálogo local com dados reais ficou indisponível porque a
  API local não respondeu durante a verificação final.
- Testes relevantes do projeto: suíte completa passou (24 arquivos e 171
  testes); E2E completo passou (21 testes e 2 skips previstos), incluindo
  catálogo, detalhe, edição, acessibilidade e reflow; `npm run typecheck`,
  `npm run lint`, `npm run build`, `git diff --check` e o Prettier dos arquivos
  alterados também passaram.
- Limitação conhecida: `npm run format:check` global continua apontando somente
  a alteração preexistente em `next-env.d.ts`, preservada fora desta correção.

## Riscos e prevenções futuras

- Uma imagem já recortada no arquivo remoto não pode ser recomposta no cliente;
  `object-contain` impede somente cortes adicionais do layout.
- O card deve continuar com um único alvo interativo para evitar links ou botões
  aninhados e manter navegação previsível por teclado.
