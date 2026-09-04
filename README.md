# Stone — Desafio técnico | Front-end

Interface web em Next.js para cadastro e autenticação de usuários e para o CRUD de produtos. Depois do login, a página inicial protegida exibe o catálogo paginado consumindo diretamente a API NestJS pelo navegador.

## Responsabilidade deste repositório

Este repositório contém somente o front-end:

- páginas, layouts, formulários e cliente HTTP;
- formulários e componentes das funcionalidades de autenticação e produtos;
- consumo direto do cookie `HttpOnly` gerenciado pela API, sem acesso do JavaScript ao JWT;
- testes unitários, de componentes e E2E da experiência web;
- configuração de build e deploy na Vercel.

A API NestJS e a persistência no DynamoDB pertencem ao repositório de back-end. A URL pública consumida pelo navegador é configurada pela variável `NEXT_PUBLIC_API_URL`. Este repositório não implementa endpoints intermediários.

## Documentação

- [Requisitos do front-end](./docs/Requisitos.md)
- [Contrato de integração com a API](./docs/Contrato-de-integracao.md)
- [Decisões de tecnologia](./docs/Decisao-tecnologias.md)
- [Decisão de deploy](./docs/Decisao-deploy.md)
- [Architecture Decision Records](./docs/adr/README.md)
