# Princípios de implementação

## Objetivo

Produzir código simples, explícito, tipado e fácil de alterar, mantendo regras de negócio próximas da feature e infraestrutura transversal pequena. A solução deve ser legível para pessoas de níveis diferentes sem depender de abstrações ocultas.

## KISS e responsabilidade única

- Cada componente, hook, schema e função DEVE ter uma responsabilidade que caiba em uma frase curta.
- Páginas e layouts do App Router DEVEM compor a tela; regras de formulário, transformação de dados e integração pertencem à feature ou ao cliente compartilhado adequado.
- NÃO criar camadas, factories, providers ou classes apenas para antecipar crescimento.
- PREFIRA funções puras para mapeamento, formatação e validação.
- Componentes grandes DEVEM ser divididos quando misturarem responsabilidades independentes, não por uma meta arbitrária de linhas.

Exemplo:

```tsx
// Ruim: página conhece HTTP, normalização, formulário e apresentação.
export default function ProductPage() {
  // fetch, estado, validação e JSX extenso...
}

// Bom: a rota declara a composição; a feature contém o comportamento.
export default function ProductPage() {
  return <ProductDetailsScreen />
}
```

## Reutilização sem abstração prematura

- Antes de criar algo, buscar implementação equivalente com `rg` e verificar componentes shadcn instalados.
- NÃO copiar cadeias longas de classes, tratamento de erro, configuração HTTP, schemas ou formatação em várias telas.
- Uma repetição pequena e acidental PODE permanecer até que o conceito compartilhado esteja claro. Ao segundo uso com a mesma semântica, avaliar extração; ao terceiro, a duplicação precisa ser removida ou justificada.
- Reutilizar comportamento por funções e hooks; reutilizar aparência por componentes e variantes.
- NÃO extrair componentes sem significado, como um wrapper usado uma única vez que apenas repassa todas as props.
- Uma abstração DEVE reduzir conhecimento duplicado, não apenas linhas.

## DRY com limites de domínio

- Compartilhar apenas o que possui a mesma responsabilidade e motivo de mudança.
- Login e cadastro podem usar os mesmos componentes de campo, mas mantêm schemas e mensagens de negócio próprios.
- Componentes específicos de produto ficam em `src/features/products/components`; componentes visuais sem regra de negócio ficam em `src/components/ui`.
- Uma feature NÃO importa arquivos internos de outra feature. Se duas features precisarem do mesmo conceito realmente transversal, mover somente esse conceito para uma área compartilhada coerente.
- Evitar arquivos `utils.ts` genéricos. Dar nome de domínio ao arquivo, como `format-product-price.ts` ou `map-api-error.ts`.

## SOLID aplicado sem cerimônia

- **Responsabilidade única:** separar apresentação, acesso à API e validação.
- **Aberto para extensão:** variantes explícitas com CVA quando um componente visual tem variações reais.
- **Substituição:** manter contratos de props previsíveis e sem alterar semântica de elementos nativos.
- **Segregação:** preferir props pequenas e focadas; não criar um objeto de configuração universal.
- **Inversão:** features dependem do cliente HTTP público e tipado, não de detalhes de `fetch` repetidos.

Não introduzir interfaces com uma única implementação, repositórios de front-end ou injeção de dependência sem necessidade concreta.

## TypeScript

- O modo estrito DEVE permanecer habilitado.
- NÃO usar `any`, `as unknown as`, `@ts-ignore` ou `!` para silenciar incerteza. Corrigir o modelo ou estreitar `unknown`.
- Tipos de respostas externas só são confiáveis depois de validação ou de uma fronteira contratual testada.
- Estados mutuamente exclusivos DEVEM usar união discriminada em vez de vários booleanos contraditórios.
- Usar `type` para uniões e composição; usar `interface` quando extensão pública de props melhorar a leitura. Consistência local é mais importante que dogma.

```ts
type ProductListState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'success'; products: Product[] }
  | { status: 'error'; message: string; correlationId?: string }
```

## Clareza e nomes

- Nomes DEVEM expressar intenção: `loadProducts`, `isSubmitting`, `ProductForm`.
- Evitar abreviações não convencionais, comentários que apenas repetem o código e booleanos com sentido invertido.
- Funções que fazem I/O DEVEM deixar isso perceptível no nome e no local em que vivem.
- Comentários explicam motivo, limitação ou decisão; o código explica o funcionamento.

## Segurança e contrato local

- O navegador DEVE chamar `NEXT_PUBLIC_API_URL` diretamente.
- NÃO criar Route Handlers, Server Actions, `proxy.ts`, `middleware.ts` ou endpoints `/api/*` para intermediar autenticação e CRUD.
- Todas as chamadas usam `credentials: 'include'`.
- `POST`, `PATCH` e `DELETE` incluem `X-CSRF-Protection: 1` no cliente HTTP compartilhado.
- O JWT NÃO pode ser lido, armazenado, logado ou enviado no corpo pela aplicação.
- Validação no cliente melhora a experiência, mas NÃO substitui a validação da API.
- O cursor de paginação é opaco: armazenar e reenviar, nunca decodificar ou inferir sua estrutura.

## Dependências

- Usar o gerenciador definido pelo `packageManager` e pelo lockfile.
- Antes de adicionar uma dependência, verificar se a plataforma, React, Next.js, Tailwind ou shadcn já resolvem o caso.
- Toda dependência nova precisa de uso atual, compatibilidade com a versão instalada, impacto de bundle aceitável e licença adequada.
- NÃO adicionar bibliotecas concorrentes para estado, formulário, ícones ou UI sem uma decisão explícita.
