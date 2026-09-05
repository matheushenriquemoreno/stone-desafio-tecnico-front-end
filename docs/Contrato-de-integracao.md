# Contrato de integração com a API

Este documento registra o contrato mínimo consumido pelo front-end. A documentação OpenAPI publicada pelo back-end é a fonte de verdade operacional e deve ser usada para detectar incompatibilidades.

## Autenticação e cadastro

| Operação direta da API | Respostas esperadas |
|---|---|
| `POST /auth/register` | `201`, `400`, `403`, `409`, `429` |
| `POST /auth/login` | `204`, `400`, `401`, `403`, `429` |
| `POST /auth/logout` | `204`, `403`, `429` |

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

Após credenciais válidas, a API responde `204 No Content`, cria o cookie de autenticação e nunca inclui o token no corpo. No ambiente publicado, o cookie é `HttpOnly`, `Secure`, `SameSite=Strict`, tem `Path=/`, não define `Domain` e expira em 900 segundos. O navegador o armazena e envia automaticamente; o JavaScript do front-end não lê, interpreta ou configura o nome do cookie.

Logout chama `POST /auth/logout` diretamente. A API responde `204` e expira o cookie com `Max-Age=0`, mesmo quando a sessão já estiver ausente ou inválida.

Todas as chamadas usam `credentials: include`. Não há cabeçalho CSRF customizado. Em operações mutáveis, o navegador envia `Origin` automaticamente; a API aceita somente a própria origem ou uma origem HTTP(S) incluída na allowlist. O cliente não deve tentar forjar `Origin` nem `Referer`.

O cliente poderá ler `Retry-After` porque a API o expõe em CORS; seu valor é um número inteiro de segundos, no mínimo `1`. Requisições automáticas `OPTIONS` de preflight não representam operações da interface e não são contabilizadas nos limites dos endpoints de negócio.

## Produtos

| Operação direta da API | Requisitos do cliente | Respostas de erro possíveis |
|---|---|---|
| `GET /products?limit=20&cursor=<cursor>` | `credentials: include` | `400`, `401`, `429` |
| `POST /products` | Credenciais; origem autorizada | `400`, `401`, `403`, `429` |
| `GET /products/:id` | `credentials: include` | `401`, `404`, `429` |
| `PATCH /products/:id` | Credenciais; origem autorizada | `400`, `401`, `403`, `404`, `429` |
| `DELETE /products/:id` | Credenciais; origem autorizada | `401`, `403`, `404`, `429` |

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

`imageUrl` deve ser uma URL HTTP(S). A listagem retorna `items`, `total` (inteiro maior ou igual a zero) e, quando houver outra página, `nextCursor`.

A criação exige `name`, `description`, `price` e `imageUrl`. O `PATCH` aceita qualquer subconjunto desses campos, mas exige ao menos um. Campos omitidos não mudam; valores `null` e propriedades desconhecidas produzem `400`.

Nesta versão, o catálogo é compartilhado: não há filtragem visual por proprietário, papel ou permissão. A autorização efetiva continua sendo responsabilidade da API.

## Paginação

```text
GET /products?limit=20&cursor=<cursor-opaco>
```

O front-end deve reenviar `nextCursor` sem decodificá-lo ou depender de sua estrutura. A ausência de `nextCursor` indica que não há outra página.

`limit` é opcional, tem padrão `20` e aceita valores de `1` a `100`. `cursor` também é opcional e é válido somente como valor opaco retornado pela página anterior.

A paginação é sequencial. A interface oferecerá `Anterior` e `Próxima`, poderá manter em memória os cursores recebidos durante a sessão e reutilizá-los para retornar a páginas já visitadas. Não é possível saltar diretamente para uma página ainda não visitada, pois não existe contrato baseado em número de página ou `offset`.

Os cursores armazenados valem apenas para a sequência de navegação atual. Uma nova busca, alteração dos parâmetros ou recarregamento que descarte o estado deve reiniciar a paginação sem cursor.

## Erros

O front-end tratará o status e o `code` retornados diretamente pela API. Os status contratados por operação são os das tabelas anteriores; falhas de rede ou respostas não previstas recebem feedback genérico e seguro. Todo erro retornado pela API segue:

```json
{
  "statusCode": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Limite de requisições excedido.",
  "correlationId": "identificador-da-requisicao"
}
```

Erros de validação acrescentam `errors`, uma lista de `{ field, code, message }`. O cliente usa `code` quando o fluxo o reconhecer, apresenta somente mensagens seguras e pode mostrar `correlationId` como referência de suporte; códigos não reconhecidos usam o mesmo fallback seguro.

- `400 Bad Request`: entrada inválida;
- `401 Unauthorized`: credenciais ou sessão inválidas;
- `403 Forbidden`: origem não permitida;
- `404 Not Found`: produto inexistente;
- `409 Conflict`: e-mail já cadastrado ou conflito equivalente;
- `429 Too Many Requests`: limite de requisições excedido;

## Compatibilidade

Mudanças incompatíveis em campos, endpoints, autenticação, paginação ou semântica de erros exigem coordenação entre os repositórios. Os testes do cliente HTTP devem simular o contrato, e os testes E2E integrados devem detectar divergências reais.

Não existem endpoints `/api/*` do Next.js para intermediar estas operações. A URL base vem de `NEXT_PUBLIC_API_URL`, e a API é responsável por CORS, cookie, validação de origem, autenticação, autorização e rate limit.
