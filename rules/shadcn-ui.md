# Regras de shadcn/ui

shadcn/ui fornece primitivas acessíveis incorporadas ao repositório; ele não é uma dependência visual fechada. O projeto é responsável pelo código adicionado e deve alinhá-lo à ADR-004.

## Fluxo obrigatório antes de usar um componente

1. Ler `components.json` e executar `shadcn info` com o gerenciador do projeto.
2. Verificar `base`, aliases, versão do Tailwind, biblioteca de ícones, componentes instalados e caminhos resolvidos.
3. Procurar componente existente antes de criar markup próprio.
4. Consultar `shadcn docs <componente>` para a API compatível.
5. Antes de adicionar ou atualizar, usar `--dry-run` e `--diff` quando disponíveis.
6. Ler os arquivos gerados, corrigir imports e validar composição, acessibilidade, lint, tipos e testes.

NÃO importar componente que ainda não existe no repositório. NÃO sobrescrever componente customizado sem autorização explícita e revisão do diff.

## Prioridade de composição

1. componente shadcn já instalado;
2. composição de componentes shadcn;
3. variante do componente compartilhado;
4. componente específico da feature;
5. markup customizado, somente quando as opções anteriores não representam a semântica.

Exemplos obrigatórios:

- aviso usa `Alert`;
- estado vazio usa `Empty`;
- carregamento visual usa `Skeleton` ou `Spinner`;
- status usa `Badge`/token semântico;
- separação usa `Separator`, não `<hr>` decorado;
- confirmação destrutiva usa `AlertDialog`;
- filtros laterais usam `Sheet`; tarefa focada com entrada usa `Dialog`.

## Estrutura e acessibilidade

- `Dialog`, `Sheet` e `Drawer` sempre possuem Title; usar `sr-only` se visualmente oculto.
- `Avatar` sempre possui `AvatarFallback`.
- `TabsTrigger` sempre fica dentro de `TabsList`.
- `SelectItem`, `DropdownMenuItem`, `CommandItem` e equivalentes ficam dentro do respectivo Group.
- `Card` usa `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` e `CardFooter` conforme a estrutura do conteúdo; não despejar tudo em `CardContent`.
- Triggers usam a API correta da base: `asChild` para Radix ou `render` para Base UI. NÃO adivinhar.
- Overlay mantém o gerenciamento de foco e empilhamento da primitiva; não reimplementar teclado, portal ou `z-index`.

## Formulários

- Usar `FieldGroup` + `Field` para layout dos campos.
- Usar `FieldLabel`, `FieldDescription` e o componente de controle apropriado.
- Validação aplica `data-invalid` no `Field` e `aria-invalid` no controle.
- Desabilitado aplica `data-disabled` no `Field` e `disabled` no controle.
- `InputGroup` só contém `InputGroupInput` ou `InputGroupTextarea`; ações internas usam `InputGroupAddon`.
- Campos relacionados usam `FieldSet` + `FieldLegend`.
- Conjuntos curtos de alternativas usam `RadioGroup` ou `ToggleGroup`, não uma lista de botões com estado manual.

```tsx
<FieldGroup>
  <Field data-invalid={Boolean(error)}>
    <FieldLabel htmlFor="name">Nome</FieldLabel>
    <Input id="name" aria-invalid={Boolean(error)} />
    {error ? <FieldDescription>{error}</FieldDescription> : null}
  </Field>
</FieldGroup>
```

## Estilo

- Usar variantes existentes antes de sobrescrever classes.
- Usar tokens semânticos; nunca cores Tailwind cruas para estados.
- `className` recebido do consumidor ajusta layout externo; mudanças de identidade recorrentes pertencem ao componente-base ou à variante.
- Usar `gap-*`, `size-*`, `truncate` e `cn()` conforme as regras de Tailwind.
- NÃO adicionar cores `dark:*`, `z-*` manual em overlays ou animações paralelas às primitivas.

## Ícones e feedback

- Usar somente a biblioteca indicada por `iconLibrary`.
- Ícone dentro de `Button` usa `data-icon="inline-start"` ou `data-icon="inline-end"` e não recebe classe manual de tamanho.
- Passar componente de ícone, não uma string resolvida por mapa.
- Botão em carregamento usa `disabled` + `Spinner`; NÃO inventar prop `isLoading` no componente-base.
- Toast é feedback transitório. Erro importante também permanece junto do formulário ou da área afetada.
- Usar a solução de toast compatível com a base indicada pelo projeto; NÃO assumir Sonner antes de conferir.

## Variantes e customização

- Variantes novas precisam corresponder a um caso real e reutilizado.
- Alterar componentes de `src/components/ui` preservando a API upstream quando possível.
- Tokens globais ficam no CSS global indicado pelo `components.json`; features não editam tema.
- Componentes de registries de terceiros só entram com registry explícito, dependências avaliadas e revisão completa do código gerado.
- Ao atualizar upstream, mesclar conscientemente; não substituir customizações do design system.
