# ADR-001: Organização do front-end por features

## Status

Aceita

## Data da decisão

2026-09-02

## Documentos relacionados

- [Requisitos do front-end](../Requisitos.md)
- [Decisões de tecnologia](../Decisao-tecnologias.md)
- [ADR-003: Consumo direto da API pelo navegador](./ADR-003-consumo-direto-api.md)

## Contexto

O front-end contém rotas de interface, componentes reutilizáveis, um cliente HTTP e funcionalidades de autenticação e produtos. Uma estrutura global separada apenas por tipo tende a espalhar os arquivos de uma mesma funcionalidade e criar diretórios genéricos sem limites claros.

## Decisão

O projeto utilizará o App Router para rotas e composição, mantendo regras e componentes específicos organizados por feature.

```text
src/
|-- app/
|   |-- (public)/
|   |   |-- login/
|   |   `-- register/
|   |-- (protected)/
|   |   |-- page.tsx
|   |   `-- products/
|   |-- layout.tsx
|   `-- globals.css
|-- features/
|   |-- auth/
|   `-- products/
|-- components/
|   `-- ui/
`-- lib/
    `-- api-client.ts

e2e/
public/
Dockerfile
package.json
```

Os diretórios serão criados sob demanda.

## Responsabilidades

### app

Contém páginas, layouts, estados de loading e erro e grupos de rotas. Páginas devem permanecer pequenas e delegar o comportamento para a feature correspondente.

### features

Cada feature agrupa seus componentes, schemas, tipos e integração:

```text
features/products/
|-- components/
|-- schemas/
|-- api/
|-- products.types.ts
`-- *.spec.tsx
```

O diretório `api` de cada feature conterá funções tipadas que usam o cliente HTTP compartilhado para chamar a API externa diretamente.

### components/ui e lib

`components/ui` contém componentes reutilizáveis sem regra específica. `lib` contém utilitários técnicos transversais. Nenhum dos dois será usado como destino genérico para regras de negócio.

### e2e

Contém cenários Playwright que atravessam páginas e serviços. Testes unitários permanecerão próximos aos arquivos testados.

## Regras de dependência

- `app` pode importar features, componentes de UI e `lib`.
- Features podem importar componentes de UI e `lib`.
- Uma feature não importa arquivos internos de outra diretamente.
- `components/ui` e `lib` não importam features.
- O cliente HTTP transversal não contém regras específicas de autenticação ou produtos.
- O front-end não importa entidades, repositórios ou casos de uso do back-end.
- O front-end não expõe endpoints HTTP que espelhem a API.

## Rotas iniciais

| Rota | Responsabilidade |
|---|---|
| `/login` | Autenticação e feedback de credenciais inválidas. |
| `/register` | Cadastro e tratamento de e-mail duplicado. |
| `/` | Página inicial protegida com listagem paginada e exclusão. |
| `/products/new` | Criação de produto. |
| `/products/[id]` | Consulta e edição de produto. |

## Testes

- Componentes e formulários serão testados com Vitest e React Testing Library.
- Arquivos unitários usarão `*.spec.ts` ou `*.spec.tsx` próximos ao código.
- Chamadas da API serão simuladas nos testes unitários.
- Playwright cobrirá os fluxos em `e2e`.
- O cliente HTTP terá testes para URL, credenciais, ausência de cabeçalho CSRF customizado, status e erros da API.

## Consequências

Arquivos relacionados evoluem juntos e a integração HTTP permanece centralizada sem criar uma camada de servidor. Em contrapartida, features pequenas podem parecer fragmentadas e os limites exigem disciplina.

## Alternativas consideradas

Pastas globais por tipo foram rejeitadas por espalhar arquivos relacionados. Concentrar tudo em `app` misturaria roteamento e regras das features. Reproduzir a Clean Architecture do back-end adicionaria abstrações sem benefício proporcional para esta interface.
