# Contrato de integração com a API

Este documento registra o contrato mínimo consumido pelo front-end. A documentação OpenAPI publicada pelo back-end é a fonte de verdade operacional e deve ser usada para detectar incompatibilidades.

## Autenticação e cadastro

| Operação direta da API | Respostas esperadas |
|---|---|
| `POST /auth/register` | `201`, `400`, `403`, `409`, `429`, `500` |
| `POST /auth/login` | `204`, `400`, `401`, `403`, `429`, `500` |
| `POST /auth/logout` | `204`, `403`, `429`, `500` |

Cadastro:

```json
{
  "name": "Maria Silva",
  "email": "maria@example.com",
  "password": "senha-segura"
}
```

A resposta bem-sucedida do cadastro contém `id`, `name` e `email`. Senha, hash e credenciais internas nunca fazem parte da resposta.

Login enviado pelo navegador à API:

```json
{
  "email": "maria@example.com",
  "password": "senha-segura"
}
```

Resposta da API ao navegador:

```http
HTTP/1.1 204 No Content
Set-Cookie: __Host-stone_access_token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
```

A API grava por 900 segundos o access token no cookie e nunca o inclui no corpo. O navegador armazena e envia o cookie automaticamente, mas o JavaScript do front-end não consegue lê-lo.

Logout chama `POST /auth/logout` diretamente. A API responde `204` e expira o cookie com `Max-Age=0`, mesmo quando a sessão já estiver ausente ou inválida.

Todas as chamadas usam `credentials: include`. Requisições `POST`, `PATCH` e `DELETE` enviam `X-CSRF-Protection: 1`.

O cliente poderá ler `Retry-After` porque a API o expõe em CORS. Requisições automáticas `OPTIONS` de preflight não representam operações da interface e não são contabilizadas nos limites dos endpoints de negócio.

## Produtos

| Operação direta da API | Requisitos do cliente | Respostas de erro possíveis |
|---|---|---|
| `GET /products?limit=20&cursor=<cursor>` | `credentials: include` | `400`, `401`, `403`, `429`, `500` |
| `POST /products` | Credenciais e cabeçalho CSRF | `400`, `401`, `403`, `429`, `500` |
| `GET /products/:id` | `credentials: include` | `401`, `403`, `404`, `429`, `500` |
| `PATCH /products/:id` | Credenciais e cabeçalho CSRF | `400`, `401`, `403`, `404`, `429`, `500` |
| `DELETE /products/:id` | Credenciais e cabeçalho CSRF | `401`, `403`, `404`, `429`, `500` |

Um produto expõe, no mínimo:

```json
{
  "id": "identificador",
  "name": "Produto",
  "description": "Descrição",
  "price": 99.9,
  "imageUrl": "https://example.com/produto.png",
  "createdAt": "2026-09-02T12:00:00.000Z",
  "updatedAt": "2026-09-02T12:00:00.000Z"
}
```

`imageUrl` deve ser uma URL HTTP(S). A listagem retorna `items` e, quando houver outra página, `nextCursor`.

A criação exige `name`, `description`, `price` e `imageUrl`. O `PATCH` aceita qualquer subconjunto desses campos, mas exige ao menos um. Campos omitidos não mudam; valores `null` e propriedades desconhecidas produzem `400`.

Nesta versão, o catálogo é compartilhado: não há filtragem visual por proprietário, papel ou permissão. A autorização efetiva continua sendo responsabilidade da API.

## Paginação

```text
GET /products?limit=20&cursor=<cursor-opaco>
```

O front-end deve reenviar `nextCursor` sem decodificá-lo ou depender de sua estrutura. A ausência de `nextCursor` indica que não há outra página.

A paginação é sequencial. A interface oferecerá `Anterior` e `Próxima`, poderá manter em memória os cursores recebidos durante a sessão e reutilizá-los para retornar a páginas já visitadas. Não é possível saltar diretamente para uma página ainda não visitada, pois não existe contrato baseado em número de página ou `offset`.

Os cursores armazenados valem apenas para a sequência de navegação atual. Uma nova busca, alteração dos parâmetros ou recarregamento que descarte o estado deve reiniciar a paginação sem cursor.

## Erros

O front-end tratará o status e o `code` retornados diretamente pela API. Todo erro segue:

```json
{
  "statusCode": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Limite de requisições excedido.",
  "correlationId": "identificador-da-requisicao"
}
```

Erros de validação acrescentam `errors`, uma lista de `{ field, code, message }`. O cliente usa `code` para decidir o comportamento, apresenta somente mensagens seguras e pode mostrar `correlationId` como referência de suporte. Códigos contratados: `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `REQUEST_FORBIDDEN`, `PRODUCT_NOT_FOUND`, `EMAIL_ALREADY_EXISTS`, `RATE_LIMIT_EXCEEDED`, `SERVICE_UNAVAILABLE` e `INTERNAL_ERROR`.

- `400 Bad Request`: entrada inválida;
- `401 Unauthorized`: credenciais ou sessão inválidas;
- `403 Forbidden`: origem não permitida ou proteção CSRF ausente;
- `404 Not Found`: produto inexistente;
- `409 Conflict`: e-mail já cadastrado ou conflito equivalente;
- `429 Too Many Requests`: limite de requisições excedido;
- `500 Internal Server Error`: falha inesperada sem detalhes sensíveis.
- `503 Service Unavailable`: API ainda não está pronta para receber tráfego.

## Compatibilidade

Mudanças incompatíveis em campos, endpoints, autenticação, paginação ou semântica de erros exigem coordenação entre os repositórios. Os testes do cliente HTTP devem simular o contrato, e os testes E2E integrados devem detectar divergências reais.

Não existem endpoints `/api/*` do Next.js para intermediar estas operações. A URL base vem de `NEXT_PUBLIC_API_URL`, e a API é responsável por CORS, cookie, CSRF, autenticação, autorização e rate limit.
