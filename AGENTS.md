# AGENTS.md

## Idioma

Responder ao usuário em português do Brasil.

## Escopo do repositório

Este repositório contém somente o front-end Next.js de autenticação e CRUD de produtos. O navegador consome diretamente a API NestJS. Não criar BFF, endpoints intermediários, pedidos, upload de imagens, papéis ou outras funcionalidades fora dos requisitos aprovados.

## Leitura obrigatória antes de implementar

Ler, nesta ordem:

1. [índice das regras](./rules/README.md);
2. [princípios de implementação](./rules/principios-de-implementacao.md);
3. [componentes e reutilização](./rules/componentes-e-reutilizacao.md);
4. a regra temática aplicável: [Next.js](./rules/nextjs.md), [Tailwind CSS](./rules/tailwind-css.md) e/ou [shadcn/ui](./rules/shadcn-ui.md);
5. [testes e qualidade](./rules/testes-e-qualidade.md);
6. [checklist de implementação](./rules/checklist-de-implementacao.md).

Também ler os requisitos, o contrato e as ADRs relacionados à tarefa. As regras não substituem esses documentos.

## Regras essenciais

- Aplicar KISS, DRY, SOLID e responsabilidade única sem abstração prematura.
- Organizar por feature e respeitar `app → features → components/ui|lib`.
- Buscar componente e implementação existentes antes de criar novos.
- Manter Server Components como padrão e limitar `'use client'` à menor fronteira interativa.
- Não criar Route Handlers, Server Actions, Proxy ou Middleware para intermediar a API.
- Centralizar acesso HTTP, usar `credentials: 'include'` e adicionar `X-CSRF-Protection: 1` em mutações.
- Nunca ler, persistir, registrar ou expor o JWT.
- Usar tokens semânticos da ADR-004; não introduzir valores visuais locais ou framework concorrente.
- Com shadcn/ui, conferir `components.json`, contexto do projeto e documentação da versão antes de compor ou alterar componentes.
- Implementar acessibilidade e estados de loading, vazio, erro e sucesso como parte do contrato.
- Alterar ou criar testes proporcionais à mudança e executar os gates aplicáveis.

## Fluxo de trabalho

1. Inspecionar contexto, documentação, versões, código equivalente e worktree.
2. Explicar trade-offs antes de propor mudança que altere arquitetura, contrato ou design system.
3. Implementar a menor solução completa.
4. Revisar o diff e executar lint, typecheck, testes, E2E quando aplicável e build.
5. Aplicar o checklist e relatar evidências, limitações e arquivos alterados.

Não declarar uma funcionalidade implementada com base apenas em documentação. Se ainda não houver `package.json` ou aplicação executável, limitar a validação ao conteúdo documental e registrar essa limitação.
