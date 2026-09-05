# Interface web de autenticação e gestão de produtos

| Status       | Aprovado   |
|--------------|------------|
| Created      | 2026-09-05 |
| Last Updated | 2026-09-05 |

## Histórico de atualizações

| Data       | Alteração |
|------------|-----------|
| 2026-09-05 | Versão inicial consolidada a partir dos requisitos, do contrato de integração e das ADRs vigentes do front-end. |
| 2026-09-05 | PRD aprovado pelo solicitante (Gate 1). |

## Documentos de origem

- [Requisitos do front-end](../../docs/Requisitos.md)
- [Contrato de integração com a API](../../docs/Contrato-de-integracao.md)
- [Decisões de tecnologia do front-end](../../docs/Decisao-tecnologias.md)
- [Decisão de deploy do front-end](../../docs/Decisao-deploy.md)
- [ADR-001 — Organização do front-end por features](../../docs/adr/ADR-001-organizacao-frontend.md)
- [ADR-002 — Cadastro de usuários no front-end](../../docs/adr/ADR-002-cadastro-de-usuarios.md)
- [ADR-003 — Consumo direto da API pelo navegador](../../docs/adr/ADR-003-consumo-direto-api.md)
- [ADR-004 — Design system e identidade visual do front-end](../../docs/adr/ADR-004-design-system-identidade-visual.md)

## Visão geral

O produto é uma interface web para que uma pessoa possa criar sua conta, autenticar-se e administrar um catálogo compartilhado de produtos. A experiência começa por cadastro ou login e, após a autenticação, conduz à página inicial protegida com a listagem paginada do catálogo. A solução torna os fluxos da API acessíveis por uma interface responsiva, segura e operável por teclado, com feedback explícito para estados de carregamento, sucesso, ausência de dados e falha. O escopo também permite avaliar de ponta a ponta a autenticação e o CRUD de produtos sem preparação manual de usuários.

## Problema e impacto

**Problema:** as capacidades de cadastro, autenticação e gestão de produtos da API não possuem uma interface web que permita a uma pessoa utilizá-las com segurança, orientação e feedback compreensível.

**Quem é afetado:** visitantes que ainda precisam criar uma conta, usuários que precisam iniciar ou encerrar uma sessão e usuários autenticados que consultam ou mantêm o catálogo durante sua sessão. A pessoa avaliadora do desafio também é afetada quando precisa verificar os fluxos completos sem recorrer a chamadas manuais à API.

**Impacto se não for resolvido:** o produto fica restrito ao consumo técnico da API; usuários não conseguem concluir os fluxos pelo navegador; e a avaliação integrada de autenticação, proteção de acesso, paginação e gestão do catálogo permanece incompleta.

## Usuários e perfis afetados

| Perfil | Contexto de uso | Necessidade principal |
|--------|-----------------|----------------------|
| Visitante sem conta | Primeiro acesso à aplicação | Criar uma conta com orientação sobre dados válidos e seguir para o login. |
| Usuário não autenticado | Entrada ou retorno à aplicação | Iniciar uma sessão com suas credenciais e receber feedback seguro quando a tentativa falhar. |
| Usuário autenticado | Uso do catálogo durante uma sessão válida | Consultar a listagem paginada e criar, visualizar, editar ou excluir produtos. |
| Pessoa avaliadora | Verificação do desafio técnico | Percorrer e validar os fluxos completos pela interface, sem preparar usuários manualmente nem acessar o JWT. |

## Objetivos e critérios de sucesso

| Objetivo | Critério de sucesso | Forma de verificação |
|----------|--------------------|----------------------|
| Permitir entrada autônoma no produto | Uma pessoa consegue se cadastrar, é encaminhada ao login e consegue iniciar uma sessão sem que o cadastro autentique automaticamente. | Cenários automatizados de cadastro e login, incluindo respostas de sucesso e falhas contratadas. |
| Proteger o catálogo por sessão | Somente uma sessão válida permite usar as telas de produtos; sessão ausente, inválida ou expirada devolve o usuário ao login. | Cenários integrados de acesso protegido, expiração de sessão e logout. |
| Permitir a gestão completa do catálogo | Uma pessoa autenticada consegue listar, consultar, criar, editar e excluir produtos, incluindo navegação sequencial entre páginas. | Cenários automatizados do CRUD e da paginação por cursor. |
| Oferecer uma experiência previsível e inclusiva | Os fluxos principais apresentam estados e mensagens apropriados, funcionam por teclado e atendem ao contraste WCAG 2.2 AA. | Testes de componentes e acessibilidade, verificação automatizada de contraste e revisão manual responsiva e por teclado. |
| Preservar os limites de segurança e integração | A aplicação usa a sessão controlada pela API sem tornar o JWT acessível ao código do navegador nem intermediar as operações em endpoints próprios. | Testes do cliente de integração, testes E2E e buscas residuais no código. |

## Escopo e não objetivos

### Dentro do escopo

- Cadastro público de usuário com nome, e-mail e senha.
- Login e logout.
- Tratamento de sessão ausente, inválida ou expirada.
- Página inicial protegida com listagem paginada do catálogo compartilhado.
- Navegação sequencial entre páginas já alcançáveis pelo cursor da API.
- Criação, consulta, edição e exclusão de produtos.
- Validação de formulários e feedback seguro para respostas previstas e falhas inesperadas.
- Estados de carregamento, vazio, sucesso, validação, recurso não encontrado e erro.
- Experiência responsiva, acessível por teclado e aderente à identidade visual aprovada.
- Documentação de configuração, execução, testes e build.
- Testes automatizados dos fluxos e contratos essenciais.

### Fora do escopo

- Pedidos — o produto cobre somente autenticação e gestão de produtos.
- Upload ou armazenamento de imagens — produtos recebem uma URL HTTP(S) de imagem.
- Catálogo separado por proprietário — a versão inicial usa um catálogo compartilhado.
- Papéis, perfis de autorização ou diferenciação visual de permissões — a autorização efetiva permanece na API e não há requisito de papéis para a interface.
- Confirmação de e-mail — não é exigida pelo fluxo de cadastro aprovado.
- Recuperação ou alteração de senha — não faz parte dos endpoints nem dos requisitos aprovados.
- Login automático após o cadastro — cadastro e autenticação permanecem operações independentes.
- Renovação automática de sessão ou refresh token — após a expiração, o usuário realiza novo login.
- Busca, filtros e ordenação configurável de produtos — não há contrato aprovado para essas capacidades.
- Salto direto para página ainda não visitada ou paginação por número/offset — a API oferece somente cursor sequencial.
- Endpoints intermediários, BFF ou proxy no front-end — o navegador consome diretamente a API.
- Tema escuro — a primeira entrega contempla somente o tema claro definido pela identidade visual vigente.
- Uso da sessão de produção em domínios de preview de terceiros — essa combinação não é compatível com a política de cookie aprovada.

### Adiado

- Tema escuro — reconhecido como evolução possível, mas adiado para evitar duplicar combinações de contraste, estados e testes sem necessidade atual.
- Renovação de sessão — poderá ser reconsiderada somente diante de um requisito futuro que justifique refresh token.
- Estado global ou cache avançado no cliente — será reconsiderado apenas se necessidades reais de sincronização ou volume justificarem a complexidade.

## Requisitos funcionais

### Cadastro

- **Essencial** `AGP-01` O sistema deve oferecer cadastro público com os campos nome, e-mail e senha.
- **Essencial** `AGP-02` O sistema deve aceitar nome normalizado com 2 a 100 caracteres.
- **Essencial** `AGP-03` O sistema deve aceitar e-mail em formato válido e sem espaços nas extremidades.
- **Essencial** `AGP-04` O sistema deve aceitar senha com 8 a 128 caracteres.
- **Essencial** `AGP-05` O sistema deve associar mensagens de validação aos respectivos campos inválidos.
- **Essencial** `AGP-06` O sistema deve confirmar um cadastro concluído com sucesso.
- **Essencial** `AGP-07` O sistema deve direcionar o usuário ao login após um cadastro concluído com sucesso.
- **Essencial** `AGP-08` O sistema não deve iniciar uma sessão como consequência do cadastro.
- **Essencial** `AGP-09` O sistema deve informar de forma clara e segura quando o e-mail já estiver cadastrado.

### Autenticação e sessão

- **Essencial** `AGP-10` O sistema deve oferecer login com e-mail e senha.
- **Essencial** `AGP-11` O sistema deve direcionar o usuário autenticado à página inicial protegida.
- **Essencial** `AGP-12` O sistema deve informar de forma segura quando as credenciais forem inválidas.
- **Essencial** `AGP-13` O sistema deve manter o acesso autenticado durante a sessão válida de 15 minutos controlada pela API.
- **Essencial** `AGP-14` O sistema deve direcionar ao login quando uma operação protegida indicar sessão ausente, inválida ou expirada.
- **Essencial** `AGP-15` O sistema deve permitir que o usuário encerre a sessão.
- **Essencial** `AGP-16` O sistema deve direcionar o usuário ao login após o encerramento da sessão.

### Listagem e paginação de produtos

- **Essencial** `AGP-17` O sistema deve apresentar a listagem de produtos na página inicial protegida.
- **Essencial** `AGP-18` O sistema deve preservar os itens, o total e a indicação de continuidade recebidos para cada página da listagem.
- **Essencial** `AGP-19` O sistema deve apresentar um estado vazio quando a página inicial do catálogo não contiver produtos.
- **Essencial** `AGP-20` O sistema deve permitir avançar quando a página atual indicar a existência de uma próxima página.
- **Essencial** `AGP-21` O sistema não deve permitir avançar quando a página atual não indicar continuidade.
- **Essencial** `AGP-22` O sistema deve permitir voltar às páginas já visitadas na sequência de navegação atual.
- **Importante** `AGP-23` O sistema deve indicar ao usuário a posição atual na sequência de páginas visitadas.
- **Essencial** `AGP-24` O sistema não deve oferecer salto direto para uma página ainda não visitada.
- **Essencial** `AGP-25` O sistema deve reiniciar a navegação pela primeira página quando a sequência de paginação for descartada.

### Gestão de produtos

- **Essencial** `AGP-26` O sistema deve permitir criar um produto com nome, descrição, preço e URL HTTP(S) de imagem.
- **Essencial** `AGP-27` O sistema deve validar os campos de criação antes de solicitar a operação.
- **Essencial** `AGP-28` O sistema deve confirmar a criação concluída com sucesso.
- **Essencial** `AGP-29` O sistema deve permitir consultar os dados de um produto existente.
- **Essencial** `AGP-30` O sistema deve permitir editar um ou mais campos entre nome, descrição, preço e URL HTTP(S) de imagem.
- **Essencial** `AGP-31` O sistema não deve solicitar uma edição sem ao menos um campo alterado.
- **Essencial** `AGP-32` O sistema deve manter inalterados os campos omitidos de uma edição.
- **Essencial** `AGP-33` O sistema deve confirmar a edição concluída com sucesso.
- **Essencial** `AGP-34` O sistema deve solicitar confirmação antes de excluir um produto.
- **Essencial** `AGP-35` O sistema deve confirmar a exclusão concluída com sucesso.
- **Essencial** `AGP-36` O sistema deve informar quando o produto consultado, editado ou excluído não existir mais.

### Estados e falhas

- **Essencial** `AGP-37` O sistema deve apresentar carregamento enquanto aguarda o resultado de uma operação relevante.
- **Essencial** `AGP-38` O sistema deve impedir o reenvio acidental enquanto uma mutação estiver em andamento.
- **Essencial** `AGP-39` O sistema deve apresentar mensagens seguras para erros de validação, autenticação, origem, recurso inexistente, conflito e excesso de requisições conforme aplicável à operação.
- **Essencial** `AGP-40` O sistema deve orientar o usuário a aguardar quando o limite de requisições for excedido.
- **Importante** `AGP-41` O sistema deve considerar a duração indicada pela API ao orientar nova tentativa após excesso de requisições.
- **Essencial** `AGP-42` O sistema deve apresentar uma mensagem genérica e segura para falha de rede ou resposta não reconhecida.
- **Importante** `AGP-43` O sistema deve apresentar o identificador de correlação como referência de suporte quando ele estiver disponível.
- **Essencial** `AGP-44` O sistema não deve expor senha, token, cookie, stack trace ou detalhe interno em mensagens ou registros acessíveis pelo navegador.

## Expectativas não funcionais

- **`EXPECT-01`** Todos os controles interativos devem ser operáveis por teclado, possuir nome acessível e apresentar foco visível.
- **`EXPECT-02`** A interface deve preservar conteúdo e ações em telas pequenas, médias e grandes, sem depender exclusivamente de hover.
- **`EXPECT-03`** Texto, foco, ícones essenciais, bordas de campos e demais indicadores visuais devem atender ao WCAG 2.2 nível AA.
- **`EXPECT-04`** A interface deve permanecer utilizável com zoom de 200% e reflow, sem perda de conteúdo ou ação.
- **`EXPECT-05`** Estados de erro, sucesso, seleção e indisponibilidade não devem depender somente de cor.
- **`EXPECT-06`** Transições e animações não devem bloquear tarefas e devem respeitar a preferência por movimento reduzido.
- **`EXPECT-07`** Os fluxos de cadastro, login, proteção de acesso, listagem, paginação, CRUD e logout devem possuir testes automatizados reproduzíveis.
- **`EXPECT-08`** A entrega deve passar por análise estática, verificação de tipos, testes aplicáveis e build reproduzível.
- **`EXPECT-09`** A integração deve manter compatibilidade observável com o contrato publicado da API e oferecer fallback seguro para respostas não previstas.
- **`EXPECT-10`** A aplicação publicada deve trafegar por HTTPS e usar uma origem explicitamente autorizada pela API.

## Regras de negócio e restrições

### Regras de negócio

- O cadastro cria o usuário, mas não cria uma sessão autenticada.
- A autenticação válida dura 15 minutos; não há renovação automática nesta versão.
- A API é a autoridade para autenticação, autorização e validação definitiva dos dados.
- O catálogo é compartilhado e não possui diferenciação visual por proprietário, papel ou permissão.
- Um produto possui identificador, nome, descrição, preço, URL HTTP(S) de imagem e datas de criação e atualização.
- A criação de produto exige nome, descrição, preço e URL HTTP(S) de imagem.
- Uma edição aceita qualquer subconjunto editável, desde que ao menos um campo seja informado.
- Campos omitidos na edição permanecem inalterados; valores nulos e propriedades desconhecidas são inválidos.
- A listagem informa itens, total e, quando houver continuidade, um cursor para a próxima página.
- O total da listagem não representa total de páginas nem autoriza inferir uma ordenação global.
- O cursor é opaco, só vale na sequência de navegação em que foi recebido e não pode ser interpretado.
- A ausência de cursor de continuidade significa que não há próxima página.

### Restrições

- A aplicação deve usar Node.js, TypeScript em modo estrito e Next.js — tecnologias obrigatórias do desafio.
- O navegador deve consumir diretamente a API definida por `NEXT_PUBLIC_API_URL` — não pode existir BFF, proxy, Route Handler, Server Action ou endpoint intermediário para autenticação e produtos.
- Todas as operações devem incluir as credenciais controladas pelo navegador — requisito necessário para a sessão em cookie da API.
- Operações mutáveis devem partir de uma origem autorizada pela API e não devem adicionar cabeçalho CSRF customizado nem tentar definir `Origin` ou `Referer`.
- O JWT deve permanecer em cookie `HttpOnly` controlado pela API e nunca pode ser lido, persistido, copiado, registrado ou exposto pelo front-end.
- A identidade visual deve seguir os tokens, contrastes e princípios aprovados na ADR-004 — features não podem introduzir uma linguagem visual concorrente.
- O ambiente publicado deve usar uma origem HTTPS na allowlist exata da API e pertencer ao mesmo site da API para compatibilidade com `SameSite=Strict`.
- A documentação OpenAPI publicada pelo back-end é a fonte de verdade operacional do contrato de integração.

## Premissas

- A API NestJS disponibilizará os endpoints e schemas descritos no contrato de integração — risco: divergências impedem ou alteram os fluxos e exigem coordenação entre os repositórios.
- A URL configurada em `NEXT_PUBLIC_API_URL` estará acessível pelo navegador — risco: configuração ausente ou inválida impede todas as operações de autenticação e produtos.
- CORS, cookie, validação de origem, autenticação, autorização e rate limit estarão configurados pela API para a origem em uso — risco: a interface pode carregar, mas as operações diretas falharão.
- O ambiente integrado de testes usará uma origem controlada e autorizada — risco: os cenários de mutação e sessão produzirão falsos negativos fora dessa condição.
- As URLs de imagem aceitas pela API serão compatíveis com a política segura de exibição adotada pela aplicação — risco: um produto pode ser válido para a API, mas sua imagem não ser exibível até que o contrato seja alinhado.
- O catálogo e o volume inicial permanecem adequados à paginação sequencial fornecida pela API — risco: necessidades futuras de busca, filtros ou acesso aleatório exigirão evolução do contrato.

## Fluxos e casos de borda

### Fluxos principais

- **Cadastro:** o visitante abre o cadastro, informa nome, e-mail e senha, corrige eventuais validações, envia os dados, recebe confirmação e segue para o login sem sessão iniciada.
- **Login:** o usuário informa e-mail e senha, recebe feedback durante a tentativa e, com credenciais válidas, entra na página inicial protegida.
- **Acesso protegido:** a página inicia em carregamento enquanto a sessão é confirmada por uma operação protegida; sucesso apresenta o catálogo e resposta não autorizada conduz ao login.
- **Listagem:** a página inicial apresenta os produtos e o total informado; quando houver continuidade, o usuário avança e pode retornar pelas páginas já visitadas.
- **Criação:** o usuário abre o formulário, informa os quatro campos obrigatórios, corrige validações e recebe confirmação quando o produto é criado.
- **Consulta e edição:** o usuário abre um produto existente, consulta seus dados, altera ao menos um campo e recebe confirmação após salvar.
- **Exclusão:** o usuário solicita a exclusão, confirma a ação irreversível e recebe confirmação após a conclusão.
- **Logout:** o usuário solicita o encerramento, a API remove ou expira a sessão e a interface retorna ao login.

### Estados vazios

- Quando a primeira página não tiver produtos, a interface deve explicar que o catálogo está vazio e oferecer a ação de criar produto.
- Quando ainda não houver página anterior visitada, a ação `Anterior` deve permanecer indisponível.
- Quando não houver continuidade, a ação `Próxima` deve permanecer indisponível.

### Erros e falhas

- Dados inválidos devem produzir mensagens próximas aos campos correspondentes e manter os demais dados necessários para correção.
- E-mail duplicado deve produzir mensagem clara sem expor detalhe interno.
- Credenciais inválidas devem produzir mensagem segura e não revelar qual credencial falhou.
- Sessão ausente, inválida ou expirada durante fluxo protegido deve encerrar o estado local protegido e conduzir ao login.
- Origem rejeitada deve informar que a operação não pôde ser autorizada, sem orientar tentativa de contornar a proteção.
- Produto inexistente deve substituir a operação por um estado de não encontrado e oferecer caminho seguro para retornar ao catálogo.
- Excesso de requisições deve orientar espera e considerar a duração comunicada pela API quando disponível.
- Falha de rede ou resposta não prevista deve apresentar fallback genérico, preservar dados sensíveis e permitir nova tentativa quando seguro.
- Um erro importante deve permanecer visível na área afetada; feedback transitório isolado não é suficiente.

### Limites

- Nome de usuário aceita de 2 a 100 caracteres após normalização.
- Senha aceita de 8 a 128 caracteres.
- A listagem solicita por padrão 20 itens e só pode usar limites entre 1 e 100.
- A sessão autenticada expira após 900 segundos.
- A paginação não possui total de páginas, acesso por número nem salto para posição não visitada.
- Cursores armazenados deixam de valer quando a sequência de navegação é reiniciada ou descartada.
- Reenvios de mutação devem permanecer bloqueados enquanto a tentativa atual estiver em andamento.

## Critérios de aceitação

1. O cadastro aceita nome, e-mail e senha dentro dos limites, apresenta erros de campo e, no sucesso, confirma a operação e direciona ao login sem iniciar sessão. (`AGP-01` a `AGP-09`)
2. O login com credenciais válidas conduz à página inicial protegida; credenciais inválidas produzem mensagem segura. (`AGP-10` a `AGP-12`)
3. Uma sessão válida permite acessar o catálogo durante o período controlado pela API; sessão ausente, inválida ou expirada conduz ao login. (`AGP-13`, `AGP-14`)
4. O logout encerra a sessão mesmo quando ela já estiver ausente ou inválida e conduz ao login. (`AGP-15`, `AGP-16`)
5. A página inicial protegida apresenta os produtos e preserva `items`, `total` e a indicação de continuidade recebidos, sem inferir total de páginas ou ordenação global. (`AGP-17`, `AGP-18`)
6. Um catálogo sem produtos apresenta estado vazio com acesso à criação. (`AGP-19`)
7. A paginação permite avançar somente quando houver continuidade, voltar por páginas visitadas, indicar a posição atual e reiniciar sem cursor quando a sequência for descartada. (`AGP-20` a `AGP-25`)
8. Um usuário autenticado consegue criar um produto válido com nome, descrição, preço e URL HTTP(S) de imagem e recebe confirmação. (`AGP-26` a `AGP-28`)
9. Um usuário autenticado consegue consultar um produto existente e editar ao menos um de seus campos, mantendo inalterados os campos omitidos e recebendo confirmação. (`AGP-29` a `AGP-33`)
10. Uma exclusão exige confirmação, informa o sucesso e reflete a remoção no catálogo. (`AGP-34`, `AGP-35`)
11. Consulta, edição ou exclusão de produto inexistente apresenta estado de não encontrado e oferece retorno seguro ao catálogo. (`AGP-36`)
12. Operações relevantes apresentam carregamento e mutações em andamento não podem ser reenviadas acidentalmente. (`AGP-37`, `AGP-38`)
13. Cada operação trata os status contratados, excesso de requisições e falhas inesperadas com mensagens seguras, usando o identificador de correlação como referência quando disponível. (`AGP-39` a `AGP-43`)
14. Nenhum fluxo ou registro acessível pelo navegador expõe senha, JWT, cookie, stack trace ou detalhe interno. (`AGP-44`)
15. Todos os controles principais são operáveis por teclado, têm foco visível e mantêm nome, papel e estado acessíveis. (`EXPECT-01`)
16. As telas preservam conteúdo e ações nos breakpoints pequeno, médio e grande, com zoom de 200% e sem depender de hover. (`EXPECT-02`, `EXPECT-04`)
17. Pares de cor e indicadores visuais atendem ao WCAG 2.2 AA e não usam somente cor para transmitir estado. (`EXPECT-03`, `EXPECT-05`)
18. Movimento não bloqueia tarefas e respeita a preferência por movimento reduzido. (`EXPECT-06`)
19. Testes automatizados reproduzíveis cobrem cadastro, login, acesso protegido, listagem, paginação, CRUD e logout, incluindo o contrato de integração. (`EXPECT-07`, `EXPECT-09`)
20. Lint, verificação de tipos, testes aplicáveis e build terminam com sucesso em instalação reproduzível. (`EXPECT-08`)
21. O ambiente publicado usa HTTPS, origem explicitamente autorizada e integração direta com a API, sem endpoint intermediário do front-end. (`EXPECT-10`)

## Perguntas em aberto

Nenhuma. Os documentos de origem resolvem as decisões necessárias para submeter este PRD à revisão do solicitante.
