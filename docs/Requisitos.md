# Requisitos do front-end

## Objetivo

Desenvolver uma interface web que permita cadastrar e autenticar usuários e gerenciar produtos por meio da API NestJS. Após a autenticação, a página inicial deve apresentar a listagem paginada do catálogo.

## Tecnologia obrigatória

- Node.js e TypeScript.
- Next.js.

## Requisitos funcionais

### Cadastro de usuários

- O formulário solicitará nome, e-mail e senha.
- Após o cadastro bem-sucedido, o usuário será direcionado para o login.
- O cadastro não iniciará uma sessão automaticamente.
- E-mail duplicado e dados inválidos terão mensagens claras e seguras.

### Autenticação

- O usuário poderá realizar login com e-mail e senha.
- A API gravará o JWT em cookie `HttpOnly`, sem retorná-lo ao código JavaScript do navegador.
- A sessão autenticada terá duração de 15 minutos e exigirá novo login após expirar.
- Rotas protegidas redirecionarão usuários sem sessão válida para o login.
- O usuário poderá encerrar a sessão solicitando à API a remoção do cookie de autenticação.

### Produtos

- A página inicial protegida exibirá a listagem paginada de produtos.
- O usuário autenticado poderá criar, consultar, editar e excluir produtos.
- Nesta versão, o catálogo será compartilhado, sem diferenciação visual por proprietário, papel ou permissão; a autorização efetiva permanecerá na API.
- A interface tratará estados de carregamento, sucesso, lista vazia, validação, recurso não encontrado e erro da API.
- Os controles de paginação utilizarão o cursor opaco fornecido pela API, sem interpretar seu conteúdo.
- A navegação será sequencial, com ações de `Anterior` e `Próxima` e indicação da página atual.
- O front-end poderá guardar, durante a sessão de navegação, os cursores das páginas já visitadas para permitir o retorno a elas.
- Não será oferecido salto direto para uma página ainda não visitada, pois a API não fornece acesso por número de página ou deslocamento.

## Integração com a API

O navegador acessará diretamente a API configurada em `NEXT_PUBLIC_API_URL`:

```text
POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /products?limit=<limite>&cursor=<cursor>
POST   /products
GET    /products/:id
PATCH  /products/:id
DELETE /products/:id
```

Todas as chamadas usarão `credentials: include`. Operações mutáveis enviarão o cabeçalho de proteção CSRF exigido pelo contrato da API.

As respostas `400`, `401`, `403`, `404`, `409`, `429`, `500` e `503` da API deverão ser convertidas em feedback apropriado para o usuário, sem expor detalhes internos.

## Qualidade e segurança

- O código usará TypeScript em modo estrito.
- Formulários terão validação no cliente para melhorar a experiência, sem substituir a validação da API.
- O JWT não poderá aparecer no corpo das respostas, em logs do navegador, no `localStorage` ou no `sessionStorage`.
- Operações que alteram estado deverão enviar o cabeçalho CSRF definido pela API.
- O front-end não implementará Route Handlers, proxy ou endpoints intermediários para operações da API.
- Componentes e fluxos deverão ser responsivos e acessíveis por teclado.
- A interface seguirá o [design system e a identidade visual](./adr/ADR-004-design-system-identidade-visual.md), inspirados na linguagem do Ton e adaptados a uma identidade própria.
- Texto, estados e controles deverão atender ao contraste mínimo definido pelo WCAG 2.2 nível AA.

## Entregáveis

- Documentação dos fluxos de cadastro, login, acesso protegido e gestão de produtos.
- Testes unitários dos formulários, componentes, cliente HTTP e estados da listagem.
- Testes E2E para cadastro, login, proteção de acesso, listagem paginada, CRUD de produtos e logout.
- Instruções de configuração, execução, testes e build no `README.md` do projeto implementado.

## Critérios de entrega

- Cadastro e login funcionam pela interface com tratamento dos erros previstos.
- Todas as operações são enviadas diretamente à API, sem endpoint intermediário do Next.js.
- Uma sessão válida permite acessar e gerenciar produtos.
- Uma sessão ausente, inválida ou expirada volta ao fluxo de login.
- A página inicial apresenta a listagem e a paginação fornecidas pela API.
- Os principais fluxos possuem testes automatizados reproduzíveis.
- Lint, verificação de tipos, testes e build são executados com sucesso.
