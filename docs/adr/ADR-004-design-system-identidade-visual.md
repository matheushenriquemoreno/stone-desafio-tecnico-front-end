# ADR-004: Design system e identidade visual do front-end

## Status

Aceita

## Data da decisão

2026-09-04

## Documentos relacionados

- [Requisitos do front-end](../Requisitos.md)
- [Decisões de tecnologia](../Decisao-tecnologias.md)
- [ADR-001: Organização do front-end por features](./ADR-001-organizacao-frontend.md)

## Contexto

O front-end já adota Tailwind CSS e componentes shadcn/ui, mas a documentação não define uma linguagem visual única. Sem uma decisão central, cada tela pode escolher cores, fontes, espaçamentos e estados de forma independente, produzindo inconsistência e dificultando a validação de acessibilidade.

A referência desejada é a linguagem visual do [site oficial do Ton](https://www.ton.com.br/), observada em 2026-09-04: verde-lima expressivo, contraste com verde muito escuro, superfícies claras, acentos vivos, títulos condensados, cantos arredondados e comunicação direta.

Esta ADR usa essa linguagem como inspiração, não como reprodução da marca. Logo, nome, ilustrações, fotografias, ícones e a fonte proprietária `Ton Condensed` não serão copiados.

## Decisão

O projeto terá um design system próprio, inspirado na energia visual do Ton e adequado a uma aplicação de autenticação e gestão de produtos. O sistema será construído sobre três níveis:

```text
valores primitivos -> tokens semânticos -> variantes de componentes
```

- Valores primitivos registram cores, medidas e famílias tipográficas.
- Tokens semânticos expressam intenção, como `primary`, `surface`, `danger` e `focus`.
- Componentes consomem somente tokens semânticos. Features não escolhem valores hexadecimais diretamente.

Tailwind CSS será a camada de tokens e utilitários. shadcn/ui fornecerá a base acessível dos componentes, customizada para esta identidade. Não será criada uma segunda biblioteca visual concorrente.

## Princípios visuais

1. **Enérgico, mas legível:** o verde-lima chama atenção em áreas-chave; grandes blocos de conteúdo permanecem em superfícies claras.
2. **Contraste alto:** texto escuro acompanha fundos vivos e claros. Texto branco fica reservado para fundos realmente escuros.
3. **Hierarquia expressiva:** títulos condensados criam personalidade; textos funcionais usam uma fonte neutra e confortável.
4. **Formas amigáveis:** cartões, campos e ações usam cantos arredondados, sem perder densidade ou clareza.
5. **Movimento funcional:** animações comunicam mudança de estado e nunca atrasam a tarefa.
6. **Consistência antes de variedade:** novas cores, medidas e variantes só entram quando um caso real não for atendido pelos tokens existentes.

## Paleta de cores

### Valores primitivos

| Token primitivo | Valor | Uso previsto |
|---|---:|---|
| `lime-500` | `#88FF00` | Cor de marca, ação primária e destaques de alto impacto. |
| `lime-600` | `#70D600` | Hover da ação primária. |
| `lime-700` | `#5ABD00` | Estado pressionado da ação primária. |
| `green-900` | `#203D00` | Ações secundárias e superfícies escuras. |
| `ink-900` | `#1B221F` | Texto principal e conteúdo sobre o verde-lima. |
| `blue-500` | `#1E7DFF` | Foco e pequenos acentos não textuais. |
| `blue-700` | `#005FCC` | Links e texto de destaque sobre superfícies claras. |
| `pink-500` | `#FF3D9A` | Acento editorial ou decorativo pontual. |
| `white` | `#FFFFFF` | Cartões e superfícies elevadas. |
| `off-white` | `#FCFDFC` | Texto sobre fundos escuros. |
| `green-050` | `#F5FBF2` | Fundo geral com temperatura levemente esverdeada. |
| `neutral-100` | `#EEF1F0` | Fundo sutil e estado desabilitado. |
| `neutral-300` | `#CBD5D0` | Bordas e divisores. |
| `neutral-500` | `#7C8A83` | Limites essenciais de campos e controles. |
| `neutral-700` | `#4A5550` | Texto secundário. |
| `success-700` | `#05751A` | Confirmações e estados positivos. |
| `warning-800` | `#8A4B00` | Alertas que exigem atenção. |
| `danger-700` | `#B42318` | Erros e ações destrutivas. |

`pink-500` e `blue-500` não substituem cores de status nem podem ser o único meio de comunicar informação. O verde-lima não será usado como texto sobre fundo branco ou como fundo para texto branco.

### Tokens semânticos

| Token semântico | Valor inicial | Responsabilidade |
|---|---:|---|
| `background` | `green-050` | Fundo principal da aplicação. |
| `foreground` | `ink-900` | Texto principal. |
| `surface` / `card` | `white` | Cartões, diálogos e menus. |
| `surface-subtle` | `neutral-100` | Agrupamentos, skeletons e áreas secundárias. |
| `muted-foreground` | `neutral-700` | Metadados e descrições. |
| `border` | `neutral-300` | Contornos decorativos e separadores. |
| `input` | `neutral-500` | Limite perceptível de campos e controles. |
| `primary` | `lime-500` | Ação principal da tela. |
| `primary-hover` | `lime-600` | Hover da ação principal. |
| `primary-active` | `lime-700` | Estado pressionado da ação principal. |
| `primary-foreground` | `ink-900` | Conteúdo sobre ação primária. |
| `secondary` | `green-900` | Ação alternativa de alta ênfase. |
| `secondary-foreground` | `off-white` | Conteúdo sobre ação secundária. |
| `accent` / `ring` | `blue-500` | Foco visível e destaques controlados. |
| `link` | `blue-700` | Texto de link em superfícies claras. |
| `success` | `success-700` | Resultado positivo. |
| `warning` | `warning-800` | Atenção sem erro impeditivo. |
| `destructive` | `danger-700` | Erro ou ação irreversível. |

### Combinações obrigatórias de contraste

| Primeiro plano | Fundo | Contraste aproximado | Uso |
|---|---|---:|---|
| `ink-900` | `lime-500` | `12,62:1` | Botão primário e bloco de destaque. |
| `off-white` | `green-900` | `11,91:1` | Botão secundário e superfície escura. |
| `ink-900` | `white` | `16,21:1` | Conteúdo principal. |
| `neutral-700` | `white` | `7,76:1` | Conteúdo secundário. |
| `blue-700` | `white` | `5,98:1` | Links e texto de destaque. |
| `white` | `danger-700` | `6,57:1` | Ação destrutiva preenchida. |
| `white` | `success-700` | `5,89:1` | Confirmação preenchida. |

Todo novo par de cores precisa atender, no mínimo, ao WCAG 2.2 nível AA: `4,5:1` para texto normal, `3:1` para texto grande e `3:1` para indicadores e limites essenciais de componentes. Os valores acima são o contrato inicial, não uma autorização para omitir testes automatizados.

## Tipografia

Serão usadas fontes abertas e carregadas pelo mecanismo de fontes do Next.js, com arquivos incluídos no build para evitar requisições de fonte a terceiros em tempo de execução.

| Papel | Família | Pesos | Uso |
|---|---|---|---|
| Display | [Barlow Condensed](https://fonts.google.com/specimen/Barlow+Condensed) | `600`, `700` | Hero, `h1`, `h2` e números de destaque. |
| Interface e leitura | [Inter](https://fonts.google.com/specimen/Inter) | `400`, `500`, `600`, `700` | Corpo, formulários, botões, tabelas e navegação. |

`Barlow Condensed` substitui a referência proprietária por manter o caráter forte e condensado sem atrelar o projeto aos ativos da marca Ton. Ela não será usada em parágrafos, mensagens de erro, labels ou dados tabulares.

### Escala tipográfica

| Token | Tamanho / altura de linha | Peso | Uso |
|---|---|---:|---|
| `display` | `clamp(3rem, 7vw, 5rem) / 0.98` | `700` | Destaque excepcional em telas públicas. |
| `heading-1` | `clamp(2.5rem, 5vw, 4rem) / 1` | `700` | Título principal da página. |
| `heading-2` | `clamp(2rem, 4vw, 3rem) / 1.05` | `700` | Título de seção. |
| `heading-3` | `1.5rem / 1.2` | `600` | Título de cartão ou subseção. |
| `body-lg` | `1.125rem / 1.7` | `400` | Introduções curtas. |
| `body` | `1rem / 1.5` | `400` | Texto e controles padrão. |
| `body-sm` | `0.875rem / 1.4` | `400` | Metadados e ajuda de formulário. |
| `label` | `0.875rem / 1.25` | `600` | Labels, botões e navegação. |

Texto funcional não ficará abaixo de `0.75rem` (`12px`). Títulos usarão `text-wrap: balance` quando possível; textos corridos não usarão caixa alta nem largura excessiva.

## Espaçamento, forma e elevação

O espaçamento seguirá uma base de `4px`, priorizando a sequência `4`, `8`, `12`, `16`, `24`, `32`, `48`, `64` e `96px`. Valores intermediários exigem uma necessidade concreta.

| Categoria | Tokens | Regra |
|---|---|---|
| Raio | `8`, `12`, `16`, `24px` e `9999px` | Campos `12px`, cartões `16px`, destaques `24px`, chips e botões promocionais em formato pill. |
| Sombra baixa | `0 1px 2px rgb(27 34 31 / 0.06)` | Campos, barras e cartões padrão. |
| Sombra média | `0 8px 24px rgb(27 34 31 / 0.10)` | Menus, diálogos e conteúdo temporariamente elevado. |
| Contorno | `1px solid border` | Principal separação entre superfícies; sombra não substitui uma borda necessária. |

Gradientes poderão aparecer somente em áreas editoriais ou de destaque. Formulários, tabelas e estados de sistema usarão fundos sólidos para preservar leitura e previsibilidade.

## Layout responsivo

- A abordagem será mobile-first.
- O conteúdo principal terá largura máxima de `1200px`.
- As margens laterais serão `16px` em telas pequenas, `24px` em telas médias e `32px` em telas grandes.
- Formulários de autenticação terão largura legível de até `28rem`.
- A grade de produtos terá uma coluna em telas pequenas e poderá evoluir para duas, três ou quatro colunas conforme houver espaço mínimo adequado para o cartão.
- Densidade e ordem de conteúdo podem mudar entre breakpoints; nenhuma informação ou ação pode existir apenas no hover.

## Componentes e estados

Os componentes compartilhados ficarão em `src/components/ui`, conforme a [ADR-001](./ADR-001-organizacao-frontend.md). Cada componente deve oferecer apenas variantes necessárias aos fluxos reais.

### Botões

- `primary`: fundo `primary`, texto `primary-foreground`.
- `secondary`: fundo `secondary`, texto `secondary-foreground`.
- `outline`: superfície transparente, borda e texto escuros.
- `ghost`: usado em ações de baixa prioridade.
- `destructive`: reservado para exclusão e confirmação irreversível.
- Altura mínima de `44px`; variante de ícone também terá área interativa mínima de `44 x 44px`.

Uma tela terá uma ação primária visualmente dominante. Hover, pressed, loading, disabled e foco serão estados explícitos, sem deslocamento de layout.

### Campos e formulários

- Label visível permanece associada programaticamente ao campo; placeholder não substitui label.
- Ajuda e erro ocupam posição previsível para reduzir saltos de layout.
- Erro combina cor, texto e, quando útil, ícone; nunca depende somente de cor.
- O foco usa anel azul de `2px` com afastamento de `2px` e não será removido.
- Campos desabilitados continuam legíveis e não sugerem interatividade.

### Cartões, tabelas e feedback

- Cartões de produto usam superfície branca, borda sutil, raio de `16px` e sombra baixa opcional.
- Tabelas só serão usadas quando a comparação por coluna for mais clara que cartões; em telas estreitas, devem preservar rótulos e relações entre dados.
- Toasts não serão o único registro de erro importante. Falhas de formulário permanecem junto ao campo ou ao formulário.
- Skeletons reproduzem aproximadamente a geometria final e respeitam preferência por movimento reduzido.
- Lista vazia, carregamento, erro, confirmação e conteúdo carregado são estados distintos e testáveis.

## Ícones, imagens e ilustrações

Ícones terão traço simples, espessura consistente e significado acompanhado por texto ou nome acessível quando acionáveis. Emojis não serão usados como ícones de interface. Uma única família de ícones será escolhida na implementação dos primeiros componentes; misturar famílias fica proibido.

Fotografias e ilustrações poderão trazer a energia da referência com recortes fortes, fundos vivos e composição assimétrica, mas deverão ser originais ou ter licença compatível. Nenhum ativo visual da Ton será reutilizado.

## Movimento

- Transições de hover e foco: `120–180ms`.
- Entrada e saída de menus, diálogos e feedback: `180–250ms`.
- Curva padrão: `ease-out` na entrada e `ease-in` na saída.
- Animações decorativas repetitivas serão evitadas.
- `prefers-reduced-motion: reduce` removerá deslocamentos e animações não essenciais.

## Aplicação com Tailwind CSS e shadcn/ui

Tailwind CSS concentrará os tokens globais. O exemplo abaixo é normativo quanto aos nomes e relações semânticas; a sintaxe exata poderá acompanhar a versão instalada.

```css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-inter);
  --font-display: var(--font-barlow-condensed);

  --color-background: #f5fbf2;
  --color-foreground: #1b221f;
  --color-card: #ffffff;
  --color-card-foreground: #1b221f;
  --color-surface-subtle: #eef1f0;
  --color-primary: #88ff00;
  --color-primary-hover: #70d600;
  --color-primary-active: #5abd00;
  --color-primary-foreground: #1b221f;
  --color-secondary: #203d00;
  --color-secondary-foreground: #fcfdfc;
  --color-muted: #eef1f0;
  --color-muted-foreground: #4a5550;
  --color-border: #cbd5d0;
  --color-input: #7c8a83;
  --color-ring: #1e7dff;
  --color-link: #005fcc;
  --color-success: #05751a;
  --color-warning: #8a4b00;
  --color-destructive: #b42318;

  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
}
```

Exemplo de consumo sem acoplamento a valores primitivos:

```tsx
<button className="min-h-11 rounded-full bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover active:bg-primary-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Salvar produto
</button>
```

Variantes de componentes serão centralizadas, evitando repetir cadeias extensas de classes nas features.

## Acessibilidade e validação

O design system buscará conformidade WCAG 2.2 nível AA e terá os seguintes critérios verificáveis:

- contraste de texto, ícones essenciais, bordas de campos e foco validado automaticamente;
- navegação completa por teclado e ordem de foco coerente;
- foco visível em todos os elementos interativos;
- zoom de `200%` e reflow sem perda de conteúdo ou ação;
- nome, papel e estado acessíveis para controles;
- mensagens de erro associadas ao campo e anunciadas quando necessário;
- testes dos estados e variantes compartilhadas;
- revisão visual nos breakpoints pequeno, médio e grande.

## Tema escuro

Tema escuro não faz parte do escopo inicial. Criá-lo agora duplicaria a matriz de contraste, estados e testes sem requisito correspondente. Os tokens semânticos preservam a possibilidade de adicioná-lo posteriormente sem alterar as APIs dos componentes.

## Governança

- Esta ADR é a fonte de verdade para identidade visual e decisões de design system.
- Cores e medidas novas devem primeiro receber um papel semântico e uma justificativa.
- Componentes específicos de uma feature não podem alterar os tokens globais.
- Mudanças que afetem a identidade inteira exigem atualização desta ADR antes da implementação.
- Variações locais são permitidas somente quando preservam contraste, tipografia e estados definidos aqui.

## Consequências

### Positivas

- A interface ganha identidade consistente antes da criação das telas.
- Tokens semânticos reduzem valores mágicos e facilitam manutenção e testes.
- A aparência remete à referência desejada sem depender de ativos proprietários.
- Regras explícitas de contraste evitam que o verde vibrante prejudique a leitura.
- Tailwind CSS e shadcn/ui continuam sendo as únicas bases visuais do projeto.

### Negativas

- Componentes do shadcn/ui precisarão ser customizados; o visual padrão não atende sozinho à decisão.
- Duas famílias tipográficas aumentam o tamanho do build em relação a uma única fonte.
- O verde-lima exige disciplina de contraste e não pode ser aplicado indiscriminadamente.
- Testes de acessibilidade e revisão visual passam a fazer parte do custo de cada novo componente.

## Alternativas consideradas

### Copiar integralmente o visual e os ativos da Ton

Rejeitada por criar dependência de marca, licença e mudanças externas. A referência orienta a linguagem visual; o projeto mantém identidade e ativos próprios.

### Usar `Ton Condensed`

Rejeitada porque a fonte observada na referência não faz parte das dependências públicas escolhidas pelo projeto. `Barlow Condensed` entrega caráter semelhante com distribuição aberta.

### Usar somente Inter

Rejeitada por reduzir custo e complexidade, mas perder a hierarquia expressiva desejada nos títulos. Inter permanece como fonte funcional e de leitura.

### Aceitar as cores padrão do shadcn/ui

Rejeitada porque produziria uma interface neutra e não atenderia à direção visual solicitada. shadcn/ui será base estrutural, não identidade pronta.

### Implementar tema claro e escuro desde o início

Rejeitada por aumentar escopo, combinações de contraste e testes sem benefício exigido para a primeira entrega.

## Referências externas

- [Ton — referência visual](https://www.ton.com.br/)
- [Barlow Condensed — Google Fonts](https://fonts.google.com/specimen/Barlow+Condensed)
- [Inter — Google Fonts](https://fonts.google.com/specimen/Inter)
- [WCAG 2.2 — contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG 2.2 — contraste não textual](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- [WCAG 2.2 — aparência do foco](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
