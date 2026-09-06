# Review — Build da Vercel falha ao procurar o trace do servidor

| Status       | Aprovado       |
|--------------|----------------|
| Created      | 2026-09-06     |
| Last Updated | 2026-09-06     |

**Escopo revisado:** correção do bug `build-vercel-missing-next-server-trace`
**Versão da avaliação:** 1

## Artefatos analisados

- Relatório do bug: `.specs/bugs/build-vercel-missing-next-server-trace.md`
- Configuração: `next.config.ts`
- Teste de regressão: `src/lib/next-config.spec.ts`
- Build Docker: `Dockerfile` e instruções do `README.md`
- Convenções: `AGENTS.md`, regras de Next.js e testes/qualidade
- Evidências: teste anterior falhando, teste posterior passando, builds com e
  sem `VERCEL` e commit `beb2714`

## Resumo executivo

A correção remove `output: 'standalone'` somente quando a variável de ambiente
da Vercel está presente, mantendo o output exigido pelo Docker fora da Vercel.
O teste de regressão falha no estado anterior e passa depois da correção; os
177 testes, lint, typecheck e os dois cenários de build também passaram. A
execução de um novo deployment real não foi feita, pois publicação externa e
configuração da Vercel permanecem fora do escopo autorizado deste checkout.

## Resultado das verificações obrigatórias

| Verificação | Resultado | Evidência |
|-------------|-----------|-----------|
| Reprodução original | Atendida com limitação | Log do usuário e reprodução pública do problema; pós-build real não foi executado localmente |
| Causa raiz | Atendida | Next.js 16.3.x + adaptador Vercel + `standalone` deixam o pós-build procurando o trace ausente |
| Teste de regressão | Atendida | Antes: 1 falha (`expected 'standalone' to be undefined`); depois: 2 testes passam |
| Eliminação da causa | Atendida no cenário local equivalente | `VERCEL=1 npm run build` passou e não gerou `.next/standalone` |
| Preservação Docker | Atendida | `npm run build` sem `VERCEL` passou e gerou `.next/standalone/server.js` |
| Testes do projeto | Atendida | 25 arquivos e 177 testes passaram |
| Qualidade estática | Atendida | `npm run lint` e `npm run typecheck` passaram |
| Contrato/arquitetura | Atendida | Nenhum endpoint, BFF, API, autenticação ou contrato foi alterado |
| Escopo | Atendida | Apenas configuração, teste de regressão e relatório do bug no commit |
| Formatação e higiene | Atendida com limitação | Arquivos tocados passam no Prettier direcionado; `git diff --check` passou |

## Matriz de rastreabilidade

| Requisito | Código | Teste | Evidência | Status |
|-----------|--------|-------|-----------|--------|
| O build nativo da Vercel não deve solicitar o trace standalone incompatível | `next.config.ts` | `omits standalone output on Vercel` | `VERCEL=1 npm run build` passou sem `.next/standalone` | Comprovado localmente |
| O build Docker deve manter o output standalone | `next.config.ts` | `keeps standalone output outside Vercel for Docker` | Build sem `VERCEL` gerou `.next/standalone/server.js` | Comprovado |
| A correção deve impedir regressão da configuração | `src/lib/next-config.spec.ts` | 2 casos de configuração | Teste falhou antes e passou depois | Comprovado |
| O problema deve ser documentado com causa, reprodução e limitação | `.specs/bugs/build-vercel-missing-next-server-trace.md` | N/A | Relatório em status `Resolvido` | Comprovado |

## Achados

| ID | Severidade | Achado | Evidência | Impacto | Recomendação | Encaminhamento |
|----|------------|--------|-----------|---------|--------------|----------------|
| A-01 | Informativo | O pós-build de um novo deployment Vercel ainda não foi observado após a correção | Registro no relatório do bug e ausência de integração Vercel neste ambiente | A confirmação final da plataforma permanece pendente | Publicar esta branch quando autorizado e repetir o smoke/build da Vercel | Operação de publicação |
| A-02 | Informativo | O `format:check` global falha em 96 arquivos preexistentes | Saída do comando lista arquivos fora do escopo, incluindo `next-env.d.ts` | O gate global não pode ser usado como prova verde desta branch | Tratar a normalização global em mudança separada | Manutenção de qualidade |

## Riscos residuais e ressalvas aceitas

- O risco residual é exclusivamente a confirmação do pós-build na infraestrutura
  da Vercel; o cenário equivalente com `VERCEL=1` passou localmente.
- A alteração pré-existente em `next-env.d.ts` foi preservada e não entrou no
  commit.

## Veredito

**Veredito:** Aprovado

**Fundamentação:** a causa foi confirmada, a menor correção foi aplicada, o
teste falhou antes e passou depois, o comportamento Docker foi preservado e
os gates relevantes passaram. A ausência de um novo deployment é uma
limitação operacional documentada, não um defeito adicional no patch.

## Próxima ação

Trabalho de código concluído. Quando a publicação for autorizada, executar um
novo deployment da branch e confirmar o pós-build da Vercel.

## Histórico de revisões anteriores

| Versão | Data | Veredito | Resumo |
|--------|------|----------|--------|
| 1 | 2026-09-06 | Aprovado | Correção condicional validada; deployment real pendente |
