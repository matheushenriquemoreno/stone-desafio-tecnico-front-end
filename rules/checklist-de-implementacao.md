# Checklist de implementação

Use este arquivo como gate. Marcar mentalmente ou na descrição da tarefa apenas itens aplicáveis; itens ignorados precisam de motivo.

## Antes de editar

- [ ] Li `AGENTS.md`, este índice e as regras temáticas aplicáveis.
- [ ] Li requisitos, contrato e ADRs relacionados.
- [ ] Confirmei o estado do worktree e preservei alterações do usuário.
- [ ] Busquei código, componente, schema, variante ou teste equivalente com `rg`.
- [ ] Confirmei versões, gerenciador, lockfile, aliases e scripts reais.
- [ ] Se houver shadcn, conferi `components.json`, `shadcn info` e docs do componente.
- [ ] Consigo descrever a menor mudança e seus critérios observáveis de conclusão.

## Durante a implementação

- [ ] Mantive `page.tsx`/`layout.tsx` focados em composição.
- [ ] Mantive `'use client'` na menor fronteira possível e não criei Client Component assíncrono.
- [ ] Respeitei `app → features → components/ui|lib`.
- [ ] Não criei import interno entre features.
- [ ] Reutilizei componente/variante existente antes de criar outro.
- [ ] Removi duplicação de regra ou classe sem criar abstração prematura.
- [ ] Usei TypeScript estrito sem silenciadores inseguros.
- [ ] Modelei loading, vazio, erro, sucesso e confirmação aplicáveis.
- [ ] Usei tokens semânticos, `gap-*`, `size-*`, `cn()` e variantes centralizadas.
- [ ] Preservei semântica HTML, labels, foco, teclado e nomes acessíveis.
- [ ] Não adicionei Route Handler, Server Action, Proxy ou Middleware para intermediar a API.
- [ ] Mantive credenciais, CSRF, erros e cursor no cliente HTTP/feature adequados.
- [ ] Não li, persisti, registrei ou expus JWT.

## Revisão de shadcn e Tailwind

- [ ] O componente shadcn existe e usa a API da base configurada.
- [ ] Items estão dentro de Groups; overlays têm Title; Avatar tem Fallback.
- [ ] Formulários usam FieldGroup/Field e estados ARIA/data corretos.
- [ ] Ícones usam a biblioteca configurada e `data-icon` em botões.
- [ ] Não há cores cruas, hexadecimal local, `space-*`, `z-*` de overlay ou classe dinâmica incompleta.
- [ ] `className` não está sobrescrevendo repetidamente uma variante que deveria ser central.
- [ ] Layout é mobile-first e não esconde ação essencial em hover/breakpoint.

## Testes

- [ ] Adicionei ou atualizei o menor teste que prova o comportamento.
- [ ] Testes consultam a interface por semântica, não por implementação.
- [ ] Cliente HTTP tem cobertura do contrato alterado.
- [ ] Cobri regressão, erros e limites relevantes.
- [ ] Validei acessibilidade e responsividade proporcionais à mudança.

## Verificações finais

- [ ] Rodei os scripts reais de lint, tipos, testes e build aplicáveis.
- [ ] Rodei E2E quando a mudança afeta fluxo integrado e o ambiente está disponível.
- [ ] Rodei `git diff --check`.
- [ ] Revisei `git diff` e arquivos novos; não incluí mudanças alheias.
- [ ] Confirmei que documentação e código continuam coerentes.
- [ ] Registrei comandos, resultados e qualquer limitação sem chamar documentação de prova de runtime.

## Buscas residuais sugeridas

Adaptar caminhos e padrões ao escopo para evitar falsos positivos:

```powershell
rg -n "localStorage|sessionStorage|Authorization|Bearer" src
rg -n "src/app/api|route\.ts|use server|middleware|proxy" src
rg -n "<img|<script|<a\s+href=" src
rg -n "space-[xy]-|z-\[|z-[0-9]|#[0-9A-Fa-f]{3,8}" src
rg -n "bg-(red|green|blue|lime)-|text-(red|green|blue|lime)-" src
rg -n "as unknown as|@ts-ignore|:\s*any\b" src
```

Uma ocorrência não é automaticamente defeito. Ler o contexto e aplicar as exceções documentadas antes de alterar.
