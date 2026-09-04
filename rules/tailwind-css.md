# Regras de Tailwind CSS

## Fonte de verdade visual

A [ADR-004](../docs/adr/ADR-004-design-system-identidade-visual.md) é dona de cores, tipografia, espaçamento, raios, elevação, movimento e contraste. Tailwind implementa esses tokens; features apenas os consomem.

## Configuração e tokens

- Confirmar a versão instalada antes de editar configuração.
- Em Tailwind v4, usar configuração CSS-first com `@import "tailwindcss"` e `@theme inline` no CSS global já configurado.
- NÃO criar outro arquivo global de tema.
- Cores e medidas recorrentes DEVEM ter papel semântico antes de virar token.
- Componentes e features usam `bg-primary`, `text-foreground`, `border-input` etc.; NÃO usam hexadecimal, RGB ou escala crua como `bg-lime-500`.
- Tema escuro está fora do escopo. NÃO adicionar `dark:*` ou provider de tema.

```tsx
// Ruim: valor visual local e sem semântica.
<div className="rounded-[17px] bg-[#88ff00] text-[#1b221f]" />

// Bom: tokens governados pelo design system.
<div className="rounded-lg bg-primary text-primary-foreground" />
```

## Utilitários

- Usar abordagem mobile-first; adicionar `sm:`, `md:` e `lg:` somente quando o conteúdo exigir.
- Usar `gap-*` em flex/grid. NÃO usar `space-x-*` ou `space-y-*`.
- Quando largura e altura forem iguais, usar `size-*`.
- Usar `truncate` em vez da combinação manual de overflow/ellipsis/nowrap.
- Usar `cn()` para classes condicionais e para mesclar `className`.
- Classes dinâmicas precisam aparecer completas no código. NÃO construir `bg-${color}-500`, pois o Tailwind não consegue detectá-la com segurança.
- Valores arbitrários (`[...]`) são exceção para casos não recorrentes e tecnicamente inevitáveis; exigem comentário ou contexto evidente.
- Evitar `!important` e prefixo `!`. Corrigir a variante, ordem ou responsabilidade do estilo.

```tsx
import { cn } from '@/lib/utils'

<div
  className={cn(
    'flex flex-col gap-4 rounded-lg border bg-card p-4',
    isSelected && 'ring-2 ring-ring',
  )}
/>
```

## Componentes e variantes

- Cadeias repetidas de classes de um componente DEVEM ser centralizadas no componente-base.
- Variações finitas usam CVA, com nomes semânticos como `variant="destructive"` e `size="sm"`.
- `className` em componentes shadcn serve principalmente para layout externo. Cor, tipografia e estados recorrentes pertencem a tokens/variantes.
- NÃO criar uma função utilitária de classes para cada elemento; usar CVA quando houver API de variante e composição local quando não houver reutilização real.
- `@apply` fica restrito a estilos-base globais e casos em que uma classe semântica CSS seja realmente necessária. PREFIRA utilitários no JSX e variantes centralizadas.

## Layout responsivo

- Preservar a largura máxima e margens definidas na ADR-004.
- Nenhuma ação ou informação pode existir somente em hover.
- Não esconder conteúdo essencial em breakpoints para “fazer caber”. Reordenar ou mudar a composição.
- Usar Grid para coleções bidimensionais e Flex para distribuição em um eixo.
- Evitar breakpoints por dispositivo; decidir pela quebra real do conteúdo.

## Estados e acessibilidade

- Componentes interativos DEVEM ter estados de hover, active, disabled e `focus-visible` coerentes.
- NÃO remover outline sem fornecer foco visível equivalente.
- Respeitar `prefers-reduced-motion`; animação é feedback, não bloqueio.
- Skeletons aproximam a geometria final para reduzir layout shift.
- Cor não é o único indicador de erro, sucesso ou seleção.
- Contraste segue WCAG 2.2 AA e os pares validados na ADR-004.

## Proibições

- Não misturar CSS Modules, styled-components, MUI, Bootstrap ou outro sistema visual sem nova decisão.
- Não duplicar tokens em JSX, arquivos da feature ou configuração paralela.
- Não adicionar `z-*` manual em Dialog, Sheet, Drawer, Popover, DropdownMenu, Tooltip ou outros overlays shadcn.
- Não copiar blocos extensos de classes entre features.
- Não adicionar animação customizada se um componente/utility existente já resolver o estado.
