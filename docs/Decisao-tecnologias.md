# Decisões de tecnologia do front-end

## Contexto

O front-end deve oferecer cadastro, login e CRUD de produtos, com uma página inicial protegida que exibe a listagem paginada. Next.js, Node.js e TypeScript são requisitos do desafio. A API NestJS é uma dependência externa deste repositório.

As versões exatas das dependências serão fixadas no arquivo de lock. Será utilizada uma versão LTS do Node.js suportada pela versão escolhida do Next.js.

## Decisões arquiteturais relacionadas

- [ADR-001: Organização do front-end por features](./adr/ADR-001-organizacao-frontend.md)
- [ADR-002: Cadastro de usuários no front-end](./adr/ADR-002-cadastro-de-usuarios.md)
- [ADR-003: Consumo direto da API pelo navegador](./adr/ADR-003-consumo-direto-api.md)
- [ADR-004: Design system e identidade visual do front-end](./adr/ADR-004-design-system-identidade-visual.md)

## Tecnologias

| Área | Decisão | Motivo |
|---|---|---|
| Framework | Next.js com App Router | Requisito do desafio e suporte a páginas e composição de interface. |
| Linguagem | TypeScript em modo estrito | Reduz erros de contrato e facilita a evolução segura. |
| Interface | React | Base do Next.js e suficiente para os fluxos solicitados. |
| Estilos | Tailwind CSS + shadcn/ui | Oferece responsividade e componentes acessíveis e customizáveis. |
| Validação | Zod | Mantém regras de entrada explícitas e tipadas no cliente. |
| Testes unitários | Vitest, React Testing Library e `user-event` | Valida componentes e interações do usuário. |
| Testes E2E | Playwright | Valida a experiência completa no navegador. |

## Consumo direto da API

O navegador chamará a API NestJS diretamente por um cliente HTTP compartilhado.

- A URL pública da API ficará em `NEXT_PUBLIC_API_URL`.
- Todas as chamadas usarão `credentials: include`.
- A API criará e removerá o cookie JWT `HttpOnly`; o front-end não lerá nem persistirá o token.
- Operações mutáveis incluirão `X-CSRF-Protection: 1`.
- A API continuará sendo a autoridade de autenticação, autorização, CORS e CSRF.
- Não existirão Route Handlers que espelhem endpoints da API.

Os detalhes estão na [ADR-003](./adr/ADR-003-consumo-direto-api.md).

## Estilos e componentes

Tailwind CSS será responsável por layout, responsividade, espaçamento, tipografia, cores e estados visuais. Os componentes de shadcn/ui serão incorporados ao código do projeto, permitindo customização.

Não serão combinados MUI, Chakra UI, Bootstrap ou outro framework visual concorrente. Componentes genéricos ficarão em `src/components/ui`; componentes específicos permanecerão dentro de sua feature.

A paleta, as fontes, a escala tipográfica, os tokens semânticos, os estados dos componentes e os critérios de acessibilidade são definidos pela [ADR-004](./adr/ADR-004-design-system-identidade-visual.md). Valores visuais não serão escolhidos de forma independente pelas features.

## Estado e acesso a dados

- Server Components serão usados apenas quando não precisarem do cookie host-only da API.
- Client Components serão usados para interatividade, formulários e estado local.
- Dados autenticados serão carregados pelo navegador, pois o cookie pertence ao host da API e não é enviado ao servidor do Next.js.
- Não será adicionada inicialmente uma biblioteca global de estado.
- Parâmetros de navegação necessários à paginação serão mantidos na URL.
- O cursor retornado pela API será tratado como opaco.

## Desenvolvimento em container

O projeto terá seu próprio `Dockerfile` para desenvolvimento e geração de imagem independente. Um ambiente integrado poderá conectar este container a uma instância de desenvolvimento ou teste da API, sem exigir que o serviço pertença ao mesmo repositório.

O arquivo `.env.example` documentará as variáveis necessárias sem conter segredos reais.

## Estratégia de testes

- Testes unitários dos formulários de cadastro, login e produtos.
- Testes dos estados de carregamento, lista vazia, sucesso e erro.
- Testes do cliente HTTP para credenciais, cabeçalho CSRF, status e respostas da API.
- API simulada nos testes unitários para manter rapidez e determinismo.
- Testes E2E integrados cobrindo cadastro, login, listagem protegida, paginação, CRUD e logout.
- Verificação de que o JWT não aparece no corpo das respostas nem fica disponível ao JavaScript do navegador.

## Qualidade e automação

- ESLint para análise estática.
- Prettier para formatação consistente.
- Verificação de tipos com TypeScript.
- Scripts para `lint`, `typecheck`, `test`, `test:e2e` e `build`.
- Pipeline de integração contínua com instalação reproduzível, análise estática, testes e build.

## Fora do escopo inicial

Não serão adicionados inicialmente refresh tokens, biblioteca global de estado ou biblioteca de componentes fechada. Essas escolhas só serão revistas diante de requisitos concretos.
