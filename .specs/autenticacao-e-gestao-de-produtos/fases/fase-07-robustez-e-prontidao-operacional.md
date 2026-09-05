# Fase 07 — Robustez e prontidão operacional

| Status       | Pendente   |
|--------------|------------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

**Objetivo e resultado esperado:** demonstrar que o conjunto já implementado é acessível, seguro, reproduzível, operável e reversível nos ambientes aprovados.
**Capacidade ou fluxo coberto:** auditoria transversal → contrato e segurança → container/documentação → CI → publicação HTTPS → smoke e rollback.
**Requisitos relacionados:** `AGP-37` a `AGP-44`, `EXPECT-01` a `EXPECT-10`; entregáveis documentais e operacionais do PRD.
**Dependências externas:** Fases 01 a 06 aprovadas; API/OpenAPI controlada, origem e domínio definidos, dados E2E isoláveis, Vercel, GitHub Actions e DNS disponíveis.

## Tarefa T33 — Fechar o gate transversal de acessibilidade e responsividade

Revisar todas as telas e estados implementados com automação e evidência manual para teclado, ordem/devolução de foco, nomes/papéis/estados acessíveis, contraste, zoom de 200%, reflow, breakpoints, indicadores não baseados só em cor e movimento reduzido. Corrigir somente lacunas dentro dos contratos já aprovados.

- **Requisitos relacionados:** `EXPECT-01` a `EXPECT-06`, além dos estados de `AGP-37` a `AGP-43`.
- **Referência ao design:** `DEC-10`, `DEC-12`; ADR-004 e seção “Acessibilidade e validação”.
- **Dependências:** `T07`, `T12`, `T16`, `T21`, `T26`, `T32`.
- **Parte do sistema afetada:** todas as rotas e componentes compartilhados; configuração/testes automatizados de acessibilidade.
- **Testes e verificações:** executar ferramenta automatizada configurada nas telas principais; percorrer fluxos só por teclado; validar foco, 200%/reflow, viewports pequena/média/grande, contraste e `prefers-reduced-motion` com checklist registrável.
- **Critérios de conclusão:** nenhuma ação ou informação essencial se perde; violações automatizadas aplicáveis são zero; verificações manuais têm evidência por tela/estado; correções compartilhadas não quebram variantes existentes.
- **Riscos ou premissas:** automação não substitui verificação manual; qualquer mudança de identidade global identificada deve voltar à ADR-004, não ser aplicada silenciosamente.

## Tarefa T34 — Consolidar a conformidade de integração e segurança

Executar uma suíte transversal que prove a forma das chamadas, a validação de todas as respostas e a ausência das construções proibidas. Cobrir `Retry-After`, `correlationId`, falhas não confiáveis, aborto, concorrência e todos os status previstos por operação sem registrar payloads sensíveis.

- **Requisitos relacionados:** `AGP-13`, `AGP-14`, `AGP-38` a `AGP-44`, `EXPECT-07`, `EXPECT-09`, `EXPECT-10`.
- **Referência ao design:** `DEC-01`, `DEC-03`, `DEC-05`, `DEC-07`, `DEC-08`, `DEC-11`, `DEC-12`.
- **Dependências:** `T32`, `T33`.
- **Parte do sistema afetada:** testes do cliente/gateways, configuração do Next.js, código cliente e relatório de verificações da entrega.
- **Testes e verificações:** buscar `localStorage`, `sessionStorage`, `Authorization`, `Bearer`, cookie/JWT, `/api`, `route.ts`, `use server`, Middleware, Proxy, cabeçalho CSRF, `Origin`/`Referer` definidos, wildcards de imagem e silenciadores TypeScript; executar testes contratuais correspondentes.
- **Critérios de conclusão:** nenhuma ocorrência indevida permanece; cada ocorrência legítima está explicada pelo teste/documentação; cliente chama apenas `NEXT_PUBLIC_API_URL` com credenciais; mensagens e logs não expõem segredo ou detalhe bruto.
- **Riscos ou premissas:** busca textual produz falsos positivos em testes/documentação; cada ocorrência deve ser lida antes de classificar.

## Tarefa T35 — Entregar configuração, container e documentação executáveis

Criar `.env.example` sem segredos, Dockerfile independente para desenvolvimento/build e atualizar o `README.md` com pré-requisitos, variáveis, instalação, execução, testes, build, integração com API, imagens e limitações de preview. Usar somente os comandos reais do `package.json`.

- **Requisitos relacionados:** `EXPECT-08`, `EXPECT-09`, `EXPECT-10`; entregáveis do PRD.
- **Referência ao design:** `DEC-01`, `DEC-02`, `DEC-11`, `DEC-12`; seções “Tecnologias e responsabilidades” e “Riscos, dependências e migração”.
- **Dependências:** `T34`.
- **Parte do sistema afetada:** `.env.example`, `Dockerfile`, arquivos de ignore e `README.md`.
- **Testes e verificações:** construir a imagem a partir de checkout limpo, executar com configuração pública controlada, repetir comandos documentados, validar links relativos e confirmar ausência de segredos/cópia indevida de arquivos.
- **Critérios de conclusão:** outra pessoa consegue instalar, desenvolver, testar e buildar pelos passos publicados; imagem é reproduzível; configuração explica origem autorizada, same-site, allowlist de imagem e preview sem prometer sessão de produção.
- **Riscos ou premissas:** Docker não resolve CORS/cookie; a documentação deve separar execução local, integração autorizada e publicação.

## Tarefa T36 — Configurar CI com gates que bloqueiam promoção

Criar workflow do GitHub Actions com instalação reproduzível, formatação, lint, tipos, testes unitários/componentes e build. Executar E2E somente em job/ambiente que possua API controlada, origem autorizada e dados isoláveis, sem ocultar quando essa dependência não estiver disponível.

- **Requisitos relacionados:** `EXPECT-07` a `EXPECT-10`.
- **Referência ao design:** `DEC-12`; seção “Suítes de teste e pipeline”; decisão de deploy.
- **Dependências:** `T35`.
- **Parte do sistema afetada:** `.github/workflows/*`, configuração de cache/artefatos e documentação de CI.
- **Testes e verificações:** validar sintaxe do workflow; executar localmente os mesmos scripts; confirmar que falha de qualquer gate encerra o job e que segredos não aparecem em logs ou bundles.
- **Critérios de conclusão:** instalação usa lockfile; gates não são ignorados; build depende apenas de configuração pública permitida; E2E integrado declara e valida suas dependências externas.
- **Riscos ou premissas:** credenciais de ambiente não entram em pull requests de terceiros; previews sem domínio compatível não são tratados como validação de sessão de produção.

## Tarefa T37 — Publicar, executar smoke tests e provar reversão

Configurar a aplicação na Vercel com `NEXT_PUBLIC_API_URL`, origens de imagem e domínio HTTPS aprovados; coordenar a origem exata no CORS/política da API e a compatibilidade de mesmo site. Depois da promoção, executar smoke de login público, cadastro, catálogo protegido, paginação, CRUD e logout; registrar o deployment anterior e testar o roteiro de rollback.

- **Requisitos relacionados:** `AGP-01` a `AGP-44`, `EXPECT-07` a `EXPECT-10`.
- **Referência ao design:** `DEC-01`, `DEC-05`, `DEC-11`, `DEC-12`; decisão de deploy e seção “Riscos, dependências e migração”.
- **Dependências:** `T33` a `T36`.
- **Parte do sistema afetada:** configuração de Vercel/DNS/variáveis, allowlists coordenadas, suíte smoke/E2E e evidências de release/rollback.
- **Testes e verificações:** executar todos os gates em checkout limpo; inspecionar no navegador a chamada direta à API e os atributos observáveis da sessão; realizar smoke dos fluxos; reverter para deployment conhecido em ambiente seguro e repetir os smokes essenciais.
- **Critérios de conclusão:** aplicação publicada usa HTTPS e origem autorizada; nenhum endpoint intermediário participa; fluxos essenciais passam; rollback é reproduzível e associado a commit/deployment conhecidos; limitações de preview estão registradas.
- **Riscos ou premissas:** publicação depende de acesso e configuração externos; se indisponíveis, a tarefa permanece pendente e a entrega não é declarada operacional apenas por build local.

## Orientações de implementação

- Esta fase não é um depósito de testes tardios: cada fluxo já possui cobertura na fase que o criou; aqui ocorre validação transversal e operacional.
- Mudança funcional descoberta durante o gate retorna à fase responsável e passa por novo review.
- Não inserir segredos no repositório, bundle, imagem, artefato ou log de CI.

## Testes e verificações da fase

Executar `npm ci`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run test:e2e` no ambiente autorizado e `npm run build`; construir a imagem; executar `git diff --check`, validação de links, buscas residuais e smoke publicado.

## Critérios de aceitação da fase

1. Acessibilidade e responsividade possuem evidência automatizada e manual em todos os fluxos principais.
2. Contrato e segurança passam por testes e buscas residuais sem construções proibidas.
3. README, ambiente e Docker reproduzem instalação, execução, testes e build.
4. CI bloqueia promoção quando qualquer gate aplicável falha.
5. Publicação HTTPS, integração direta, smoke e rollback possuem evidência reproduzível.

## Riscos, premissas e dependências externas da fase

- Vercel, GitHub, DNS, API e dados de teste são dependências externas explícitas; indisponibilidade bloqueia apenas as tarefas que realmente dependem delas.
- Domínio e API precisam pertencer ao mesmo site para a sessão `SameSite=Strict` publicada.
- A conclusão desta fase também exige `review`; somente depois dele o escopo planejado pode ser declarado entregue.
