# Stone — Desafio técnico | Front-end

Interface web em Next.js para cadastro e autenticação de usuários e para o CRUD de produtos. Depois do login, a página inicial protegida exibe o catálogo paginado consumindo diretamente a API NestJS pelo navegador.

## Responsabilidade deste repositório

Este repositório contém somente o front-end:

- páginas, layouts, formulários e cliente HTTP;
- funcionalidades de autenticação e produtos;
- consumo direto do cookie `HttpOnly` gerenciado pela API, sem acesso do JavaScript ao JWT;
- testes unitários, de componentes e E2E da experiência web;
- build local e imagem Docker independente.

A API NestJS e a persistência no DynamoDB pertencem ao repositório de back-end. A aplicação não possui BFF, Route Handlers, Server Actions, Middleware ou endpoints intermediários. A URL consumida pelo navegador vem de `NEXT_PUBLIC_API_URL`.

## Documentação

- [Requisitos do front-end](./docs/Requisitos.md)
- [Contrato de integração com a API](./docs/Contrato-de-integracao.md)
- [Decisões de tecnologia](./docs/Decisao-tecnologias.md)
- [Decisão de deploy](./docs/Decisao-deploy.md)
- [Architecture Decision Records](./docs/adr/README.md)


## Entrega do desafio

O objetivo do desafio era entragar somente a api, porém com o front-end opcional, eu quiz fazer a entrega de ambos para poder ficar mais facil a utilização da api, e demostrar uma entrega mais confiavel. Além dos desafios que o front-end nos proporcina no dia a dia de desenvolvedor.

Segue os links dos projetos hospedados.

[Front-end](https://products.devmoreno.com.br) em products.devmoreno.com.br
 
[Documentação do back-end](https://apiproducts.devmoreno.com.br/reference) em apiproducts.devmoreno.com.br

## Processo de deploy

O deloy do front-end foi realizado utilizando a infraestrutura da propria versel, com configuração do github actions somente para rodar os testes de qualidade.
Para gerenciamento do dns foi escolhido a cloudflare visando ter toda a segurança que eles fornecem.


## Pré-requisitos

- Node.js `>=24.0.0 <25`;
- npm `11.12.1` ou compatível com o `packageManager` do `package.json`;
- API NestJS disponível para os fluxos integrados;
- Docker apenas para a execução em container.

## Configuração local

Copie `.env.example` para `.env.local` e ajuste os valores:

```text
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`NEXT_PUBLIC_API_URL` é uma URL pública e direta da API. A origem exata usada pelo navegador deve estar autorizada no CORS e na política de origem da API. Em ambiente publicado, use HTTPS e coordene a compatibilidade de mesmo site exigida pelo cookie `SameSite=Strict`.

As imagens dos produtos são carregadas diretamente pelo navegador a partir da
`imageUrl` retornada pela API. O componente mantém um fallback acessível quando
a URL falha, sem exigir configuração de origens no front-end.

`NEXT_PUBLIC_API_URL` é incorporada ao bundle durante o build; alterá-la exige
executar o build novamente.

## Instalação e desenvolvimento

```bash
npm ci
npm run dev
```

Acesse `http://localhost:3000`. O navegador chama a API configurada diretamente; não há uma rota `/api` do Next.js.

## Qualidade e build

```bash
npm run format:check
npm run lint
npm run typecheck
npm test -- --run
npm run build
npm start
```

Os testes E2E com interceptação local podem ser executados com:

```bash
npm run test:e2e
```

Para E2E integrado, configure uma API controlada, uma origem do front-end autorizada e dados isoláveis:

```powershell
$env:E2E_API_URL = 'http://localhost:3001'
$env:E2E_WEB_URL = 'http://localhost:3000'
npm run test:e2e
```

Não use sessão, credenciais ou domínio da API de produção nos testes.

## Docker

A imagem usa o build standalone do Next.js e executa como usuário não-root. Os argumentos públicos precisam ser informados no build:

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://host.docker.internal:3001 -t stone-front .
docker run --rm -p 3000:3000 stone-front
```

O container expõe a interface em `http://localhost:3000`. Docker não configura CORS, cookie ou DNS da API.