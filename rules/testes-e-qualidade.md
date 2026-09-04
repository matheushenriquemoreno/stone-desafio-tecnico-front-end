# Testes e qualidade

## Princípio

Testar comportamento observável e contratos de fronteira. Um teste deve falhar por uma regressão real, não por reorganização interna sem efeito para o usuário.

## Pirâmide do projeto

- **Unitários:** formatadores, mapeadores, schemas, paginação e cliente HTTP.
- **Componentes:** formulário, lista, estados, teclado e integração entre componentes da feature.
- **E2E:** cadastro, login, proteção, listagem, paginação, CRUD e logout contra ambiente integrado controlado.

Testes unitários ficam próximos ao código com `*.spec.ts` ou `*.spec.tsx`; cenários Playwright ficam em `e2e`.

## Componentes

- Usar React Testing Library e `user-event` pelo papel, nome e texto acessível.
- NÃO selecionar por classes Tailwind, árvore interna do shadcn ou `data-testid` quando houver consulta semântica.
- Cobrir loading, vazio, sucesso, validação, erro, retry, disabled e confirmação quando aplicáveis.
- Validar foco, teclado, nome acessível e mensagens associadas.
- Evitar snapshots grandes. Assertions explícitas comunicam melhor o contrato.

```tsx
await user.click(screen.getByRole('button', { name: /salvar produto/i }))
expect(await screen.findByText(/nome é obrigatório/i)).toBeVisible()
```

## Cliente HTTP

Os testes DEVEM provar:

- URL baseada em `NEXT_PUBLIC_API_URL`, sem prefixo intermediário `/api`;
- `credentials: 'include'` em todas as chamadas;
- `X-CSRF-Protection: 1` em `POST`, `PATCH` e `DELETE`, sem tratá-lo como segredo;
- ausência de `Authorization: Bearer`, leitura de cookie ou persistência de JWT;
- interpretação do schema de erro e preservação de `correlationId`;
- tratamento de `400`, `401`, `403`, `404`, `409`, `429`, `500` e `503` conforme o fluxo;
- cursor reenviado sem transformação;
- payload e resposta compatíveis com o contrato.

## E2E

- Testes DEVEM ser determinísticos e independentes na medida do possível.
- Preparar dados por mecanismo de teste autorizado, não clicando por telas não relacionadas em todos os cenários.
- Seletores priorizam papel, label e nome acessível.
- Cobrir navegação anterior/próxima sem assumir conteúdo interno do cursor.
- Confirmar que sessão expirada ou resposta `401` retorna ao login.
- Não usar sessão da API de produção nem domínios de preview não autorizados.

## Acessibilidade e visual

- Executar verificação automatizada de acessibilidade nas telas principais quando a ferramenta estiver configurada.
- Validar manualmente teclado, foco, zoom/reflow e breakpoints pequeno, médio e grande.
- Mudança em tokens ou variantes compartilhadas exige verificar todos os estados afetados.
- Contraste de texto, foco e limites essenciais deve atender WCAG 2.2 AA.

## Gate de qualidade

Antes de concluir uma mudança de código, executar os scripts existentes equivalentes a:

```text
lint
typecheck
test
test:e2e   # quando o ambiente aplicável estiver disponível
build
```

- Usar os nomes reais de `package.json`; não inventar comandos.
- Falha preexistente deve ser separada da regressão e registrada com evidência.
- NÃO desabilitar regra, teste ou checagem para obter verde sem corrigir a causa.
- Um build bem-sucedido não substitui testes; testes bem-sucedidos não substituem lint e tipos.

## Mudanças somente documentais

Quando não existir aplicação executável ou a mudança alterar apenas Markdown:

- validar links relativos;
- executar `git diff --check`;
- buscar referências contraditórias ou obsoletas com `rg`;
- informar claramente que não houve prova de runtime.
