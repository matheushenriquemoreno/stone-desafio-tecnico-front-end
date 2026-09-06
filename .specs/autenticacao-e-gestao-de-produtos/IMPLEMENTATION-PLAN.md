# Plano de Implementação — Interface web de autenticação e gestão de produtos

| Status       | Aprovado   |
|--------------|------------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

PRD de referência: `.specs/autenticacao-e-gestao-de-produtos/PRODUCT-REQUIREMENTS.md` (Aprovado)
Design técnico: `.specs/autenticacao-e-gestao-de-produtos/TECHNICAL-DESIGN.md` (Aprovado)

## Histórico de atualizações

| Data       | Alteração |
|------------|-----------|
| 2026-09-05 | Versão inicial do plano, com fases, tarefas, verificações e estado de implementação derivados dos Gates 1 e 2. |
| 2026-09-05 | Plano submetido à revisão do solicitante (Gate 3). |
| 2026-09-05 | Plano aprovado novamente pelo solicitante após reversão causada por merge antecipado (Gate 3). |

## Objetivo geral da implementação

Entregar uma aplicação Next.js executável, testada e publicável que permita cadastro, login, proteção de sessão, logout e CRUD paginado do catálogo compartilhado, consumindo diretamente a API NestJS e preservando os contratos de segurança, acessibilidade e identidade visual aprovados.

## Estratégia de execução

A execução começa por um *tracer bullet* que prova o caminho navegador → API com login e primeira leitura protegida antes de ampliar o produto. As fases seguintes completam a entrada pública, o ciclo de sessão, a paginação, as mutações de produto e, por último, a prontidão operacional. Cada comportamento recebe testes na própria fase; a fase final apenas consolida evidências de publicação e operação. Uma fase é executada por vez e só libera a seguinte após `review` independente.

Como o repositório ainda não possui aplicação executável, a Fase 01 também fixa a fundação reproduzível: npm, Node.js 24 LTS, Next.js 16, TypeScript estrito, Tailwind CSS 4 e os scripts exigidos pela documentação. As versões exatas das dependências serão registradas no `package-lock.json` produzido na implementação.

## Fases

| #  | Fase | Arquivo | Status |
|----|------|---------|--------|
| 01 | Fundação e tracer bullet autenticado | [fase-01-fundacao-e-tracer-bullet.md](fases/fase-01-fundacao-e-tracer-bullet.md) | Pendente |
| 02 | Cadastro e autenticação pública completa | [fase-02-cadastro-e-autenticacao-publica.md](fases/fase-02-cadastro-e-autenticacao-publica.md) | Pendente |
| 03 | Sessão protegida e logout | [fase-03-sessao-protegida-e-logout.md](fases/fase-03-sessao-protegida-e-logout.md) | Pendente |
| 04 | Catálogo e paginação sequencial | [fase-04-catalogo-e-paginacao.md](fases/fase-04-catalogo-e-paginacao.md) | Pendente |
| 05 | Criação de produtos | [fase-05-criacao-de-produtos.md](fases/fase-05-criacao-de-produtos.md) | Pendente |
| 06 | Consulta, edição e exclusão | [fase-06-consulta-edicao-e-exclusao.md](fases/fase-06-consulta-edicao-e-exclusao.md) | Pendente |
| 07 | Robustez e prontidão operacional | [fase-07-robustez-e-prontidao-operacional.md](fases/fase-07-robustez-e-prontidao-operacional.md) | Pendente |

## Cobertura bidirecional resumida

| Requisitos | Tarefas que os implementam ou verificam |
|------------|------------------------------------------|
| `AGP-01`, `AGP-02`, `AGP-03`, `AGP-04`, `AGP-05` | `T08`, `T10`, `T12` |
| `AGP-06`, `AGP-07`, `AGP-08`, `AGP-09` | `T09`, `T10`, `T12` |
| `AGP-10`, `AGP-11`, `AGP-12` | `T04` a `T07`, `T11`, `T12` |
| `AGP-13`, `AGP-14`, `AGP-15`, `AGP-16` | `T06`, `T07`, `T13` a `T16`, `T24`, `T26`, `T27`, `T32`, `T34`, `T37` |
| `AGP-17`, `AGP-18`, `AGP-19` | `T04`, `T06`, `T07`, `T17`, `T20`, `T21`, `T37` |
| `AGP-20`, `AGP-21`, `AGP-22`, `AGP-23`, `AGP-24`, `AGP-25` | `T18`, `T19`, `T21`, `T31`, `T37` |
| `AGP-26`, `AGP-27`, `AGP-28` | `T22` a `T26`, `T37` |
| `AGP-29`, `AGP-30`, `AGP-31`, `AGP-32`, `AGP-33`, `AGP-34`, `AGP-35`, `AGP-36` | `T27` a `T32`, `T37` |
| `AGP-37`, `AGP-38` | `T02`, `T03`, `T05` a `T07`, `T09` a `T21`, `T23` a `T34`, `T37` |
| `AGP-39`, `AGP-40`, `AGP-41`, `AGP-42`, `AGP-43`, `AGP-44` | `T03` a `T07`, `T09`, `T11`, `T14` a `T18`, `T21`, `T23` a `T27`, `T29`, `T31` a `T34`, `T37` |
| `EXPECT-01`, `EXPECT-02`, `EXPECT-03`, `EXPECT-04`, `EXPECT-05`, `EXPECT-06` | `T02`, `T05`, `T06`, `T10`, `T11`, `T13`, `T17`, `T20`, `T21`, `T25`, `T27`, `T29`, `T30`, `T33`, `T37` |
| `EXPECT-07`, `EXPECT-08`, `EXPECT-09`, `EXPECT-10` | `T01`, `T03`, `T04`, `T07`, `T09`, `T12`, `T16`, `T21`, `T23`, `T26`, `T27`, `T32`, `T34` a `T37` |

Toda tarefa possui requisito, critério de aceitação ou necessidade técnica rastreável no design. Não há requisito Desejável sem tratamento: o PRD contém apenas requisitos Essenciais, Importantes e expectativas não funcionais, todos cobertos acima.

## Dependências e ordem entre as fases

A Fase 01 cria o runtime, o design system mínimo, o cliente HTTP e o primeiro fluxo autenticado. A Fase 02 reutiliza essa fundação para concluir cadastro e feedback público. A Fase 03 transforma a proteção inicial em comportamento comum de sessão e acrescenta logout. A Fase 04 depende da sessão estabilizada para completar o catálogo paginado. A Fase 05 reutiliza contratos, shell e feedback para criar produtos. A Fase 06 depende do modelo e formulário de produto já validados para consulta, patch e exclusão. A Fase 07 só começa depois que todos os fluxos funcionais passaram por review, pois valida o conjunto em ambiente integrado e prepara publicação e reversão. Não há ciclo entre fases.

## Marcos de entrega

- Marco 1 — Fase 01 concluída e aprovada: aplicação executável prova login e primeira leitura protegida diretamente na API.
- Marco 2 — Fases 02 e 03 concluídas e aprovadas: entrada autônoma, tratamento de sessão e logout funcionam de ponta a ponta.
- Marco 3 — Fases 04 a 06 concluídas e aprovadas: catálogo compartilhado oferece paginação sequencial e CRUD completo.
- Marco 4 — Fase 07 concluída e aprovada: qualidade, segurança, container, CI, deploy, smoke tests e rollback possuem evidência reproduzível.

## Riscos e verificações gerais

- CORS, origem autorizada e cookie `SameSite=Strict` podem impedir a integração mesmo com a interface correta — validar cedo no tracer bullet e novamente no ambiente integrado.
- A OpenAPI e os schemas locais podem divergir — validar respostas em runtime, cobrir o cliente por contrato e executar E2E contra versão controlada da API.
- O probe de sessão da criação consome rate limit — limitar a `GET /products?limit=1`, impedir chamadas duplicadas e provar o comportamento em teste.
- URLs de imagem aceitas pela API podem apontar para serviços externos indisponíveis — carregar diretamente no navegador e manter fallback acessível.
- Cursores podem expirar ou se perder após reload — nunca interpretá-los; reiniciar e canonicalizar a sequência quando o estado em memória não existir.
- Respostas atrasadas podem substituir estado recente — cancelar ou ignorar leituras obsoletas e testar trocas rápidas de página.
- Mutações podem ser duplicadas por reenvio ou retry — desabilitar a ação durante o envio e não aplicar retry automático.
- Previews de terceiros não reutilizam a sessão de produção — usar API/origem próprias ou limitar o preview a verificações compatíveis.
- Reversão de publicação — manter deployment anterior da Vercel associado a commit conhecido e executar o roteiro de smoke após promover ou reverter.

## Perguntas que bloqueiam a implementação

| Pergunta | Por que bloqueia | Status |
|----------|------------------|--------|
| Nenhuma | PRD e design aprovados resolvem as decisões de produto e arquitetura necessárias; valores concretos de ambiente serão registrados na configuração sem segredos. | Resolvida |
