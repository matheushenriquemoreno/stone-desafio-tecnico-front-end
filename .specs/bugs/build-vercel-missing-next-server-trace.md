# Bug — Build da Vercel falha ao procurar o trace do servidor

| Status       | Resolvido       |
|--------------|-----------------|
| Created      | 2026-09-06      |
| Last Updated | 2026-09-06      |

## Comportamento esperado e observado

**Esperado:** o build do front-end deve ser concluído pela Vercel usando o
pipeline nativo de Next.js.

**Observado:** a compilação termina, mas o pós-build da Vercel falha com:

```text
Error: ENOENT: no such file or directory, open '/vercel/path0/.next/next-server.js.nft.json'
Error: Command "npm run build" exited with 1
```

## Contexto e evidências

- **Entradas:** `npm run build` na publicação da Vercel.
- **Ambiente:** Vercel, Next.js `16.3.4`, Node.js 24.x, Turbopack.
- **Frequência:** sempre, conforme o log fornecido.
- **Evidências:** o projeto usa `output: 'standalone'` em `next.config.ts`; o
  build local com a mesma configuração conclui com sucesso, pois não executa
  o `onBuildComplete` do adaptador da Vercel. A documentação local do Next.js
  identifica `next-server.js.nft.json` como artefato do output tracing. O
  problema é reproduzido na integração Vercel/Next.js 16.3.x quando
  `standalone` permanece habilitado, conforme a reprodução registrada no
  [issue #96646 do Next.js](https://github.com/vercel/next.js/issues/96646).

## Reprodução

1. Usar Next.js `16.3.x` com `output: 'standalone'` em `next.config.ts`.
2. Publicar a raiz do repositório na Vercel com o comando `npm run build`.
3. Observar o erro após a finalização do build, ao acessar
   `.next/next-server.js.nft.json`.

**Confirmação:** sim. O log apresentado contém exatamente o erro de arquivo
ausente no pós-build da Vercel. A reprodução integral não foi executada neste
ambiente porque o adaptador e o pipeline `onBuildComplete` da Vercel só existem
na infraestrutura de publicação; o substituto local é o build completo, que
passa e confirma que a falha está no pós-build específico da plataforma.

## Hipóteses testadas e resultados

| # | Hipótese | Teste (uma variável por vez) | Resultado |
|---|----------|------------------------------|-----------|
| H1 | `output: 'standalone'` é incompatível com o pós-build da Vercel no Next 16.3.x | Comparação entre a configuração atual, o log informado e o issue de reprodução do Next.js; `npm run build` local passou | Confirmada |

## Causa raiz confirmada

No Next.js 16.3.x, o build com o adaptador da Vercel deixa de produzir o trace
raiz `next-server.js.nft.json`, enquanto o caminho de finalização de
`output: 'standalone'` ainda tenta lê-lo. O erro é causado pela combinação do
modo standalone, adequado ao Docker deste projeto, com o adaptador nativo da
Vercel — não pelo código das páginas ou pela API.

## Proposta de correção

Em `next.config.ts`, habilitar `output: 'standalone'` apenas fora da Vercel.
Assim, Docker e execução local mantêm o artefato standalone, enquanto o
deploy nativo da Vercel usa seu próprio empacotamento e não solicita o trace
ausente.

## Teste de regressão

Um teste de configuração deve falhar enquanto `VERCEL` ainda resultar em
`output: 'standalone'` e passar quando o output for omitido nesse ambiente.

## Validações realizadas

- Teste de regressão antes da correção: falhou pelo motivo certo — esperava
  `config.output` ausente com `VERCEL=1`, mas recebeu `standalone`.
- Correção aplicada: `next.config.ts` agora omite `output` quando `VERCEL` está
  definido; `src/lib/next-config.spec.ts` cobre Vercel e Docker.
- Teste de regressão depois: passou — 2 testes.
- Reprodução original: a simulação local com `VERCEL=1` concluiu o build e não
  gerou `.next/standalone`; o deployment real na Vercel ainda precisa ser
  executado para confirmar o pós-build da plataforma.
- Testes relevantes do projeto: 177 testes passaram, lint passou, typecheck
  passou, build Vercel-like passou e build local/Docker passou com
  `.next/standalone/server.js`.
- `git diff --check` passou. A checagem global de Prettier continua falhando em
  96 arquivos preexistentes; os arquivos tocados passam na checagem direcionada.

## Riscos e prevenções futuras

- O deploy Docker deve continuar validando a existência de `.next/standalone`;
  o build local confirmou `.next/standalone/server.js`.
- A confirmação final do pós-build exige um novo deployment na Vercel; o
  ambiente local não substitui essa prova de plataforma.
