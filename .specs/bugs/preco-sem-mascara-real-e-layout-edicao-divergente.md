# Bug — Preço sem máscara de Real e layout de edição divergente

| Status       | Resolvido       |
|--------------|-----------------|
| Created      | 2026-09-06      |
| Last Updated | 2026-09-06      |

## Comportamento esperado e observado

**Esperado:** os formulários de criação e edição devem exibir o preço no padrão
brasileiro do Real, impedir que letras permaneçam no campo e enviar o valor
numérico contratado pela API. A edição deve usar a mesma composição visual da
criação: contexto do catálogo, título destacado e formulário dentro de um card.

**Observado:** o campo de preço aceita texto livre, exibe valor com ponto decimal
e permite a permanência de letras. A edição apresenta cabeçalho menor, formulário
sem card e ação de cancelamento isolada, divergindo da criação. Ao padronizar os
componentes, a largura ainda pode encolher no contêiner aninhado da edição quando
o layout compartilhado não declara explicitamente `w-full`.

## Contexto e evidências

- **Entradas:** digitação de preço nos formulários de criação e edição; abertura
  da edição de um produto existente com preço `89.9`.
- **Ambiente:** front-end Next.js 16.3.4 no navegador.
- **Frequência:** sempre.
- **Evidências:** capturas fornecidas pelo usuário mostram preço sem padrão
  `pt-BR`, texto alfabético no campo e layouts distintos entre criar e editar.

## Reprodução

1. Abrir `/products/new`, localizar `Preço` e digitar letras junto de algarismos.
2. Observar que o texto permanece no input e que não há apresentação `R$ 0,00`.
3. Abrir um produto, selecionar `Editar produto` e observar o preço inicial como
   número com ponto decimal.
4. Comparar o formulário de edição sem card com o formulário de criação dentro
   de `Dados do produto`.

**Confirmação:** sim. Antes da correção, os testes renderizaram
`abc9990xyz` no campo de criação e `99.9` no campo de edição; a edição também
expôs um `h2` sem o contexto e o card da criação.

## Hipóteses testadas e resultados

| # | Hipótese | Teste (uma variável por vez) | Resultado |
|---|----------|------------------------------|-----------|
| H1 | `inputMode="decimal"` é apenas uma dica de teclado e o estado aceita qualquer string. | Digitar letras e algarismos e observar o valor controlado. | Confirmada: o valor permaneceu `abc9990xyz`. |
| H2 | A edição possui composição própria fora do `Card` usado pela criação. | Renderizar a edição e consultar contexto, título e seção de dados. | Confirmada: havia `h2` próprio, sem `Catálogo compartilhado` e sem `Dados do produto`. |

## Causa raiz confirmada

O `ProductForm` repassa `event.target.value` integralmente ao estado; o atributo
`inputMode` não valida nem sanitiza a entrada. O schema converte a string com
`Number`, portanto também usa notação técnica com ponto em vez da apresentação
brasileira. Separadamente, `ProductEditForm` não reutiliza a composição
`header + Card` de `ProductCreationScreen`.

## Proposta de correção

Formatar a cada alteração somente os algarismos como centavos de BRL, converter
a representação `pt-BR` de volta para número apenas na fronteira do schema e
formatar o valor inicial da edição com o mesmo formatter do catálogo. Compor a
edição com o mesmo cabeçalho e os mesmos componentes `Card` da criação.

## Teste de regressão

- Criação: digitação alfanumérica deve manter somente os algarismos como centavos
  e exibir `R$ 99,90`.
- Edição: preço inicial deve aparecer como `R$ 99,90` e a tela deve expor a mesma
  estrutura textual e visual da criação.
- Largura: no mesmo viewport, os cards de criação e edição devem ter a mesma
  largura computada.
- Submissão: o valor visual em Real deve ser convertido para o número `99.9` no
  payload da API.

## Validações realizadas

- Teste de regressão antes da correção: falhou em 2 cenários pelo motivo certo;
  criação recebeu `abc9990xyz` e edição não encontrou o `h1` esperado.
- Correção aplicada: `ProductForm` mascara algarismos como centavos de BRL;
  o schema converte a representação `pt-BR` na fronteira de submissão; criação
  e edição compartilham `ProductFormLayout` com largura explícita.
- Teste de regressão depois: 30 testes focados passaram em 4 arquivos; os 3
  cenários E2E de criação/detalhe/mutações também passaram.
- Reprodução original: não reproduz mais. Letras não permanecem no campo,
  `99.9` aparece como `R$ 99,90` e os cards de criação e edição têm a mesma
  largura computada no mesmo viewport.
- Testes relevantes do projeto: lint e typecheck passaram; 175 testes Vitest
  passaram; build de produção passou; E2E completo teve 18 aprovados, 4
  opcionais ignorados e 1 falha preexistente em paginação fora deste escopo.
  O teste afetado pela correção passou isoladamente com 3/3 cenários.
- Formatação: todos os arquivos desta correção passaram no Prettier e
  `git diff --check`; o gate global continua apontando `next-env.d.ts`, arquivo
  já modificado antes desta correção.

## Riscos e prevenções futuras

- A máscara visual não pode mudar o contrato numérico da API; o teste de
  submissão deve verificar a conversão explicitamente.
- A mesma primitiva de formulário atende criação e edição; a regressão deve
  cobrir ambos os fluxos.
- A suíte completa permanece com uma falha em
  `e2e/product-pagination.spec.ts` associada a alterações preexistentes de
  paginação; ela deve ser tratada no escopo responsável sem misturar correções.
