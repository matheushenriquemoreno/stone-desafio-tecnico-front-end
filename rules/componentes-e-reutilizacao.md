# Componentes e reutilização

## Camadas permitidas

```text
src/app                         rotas, layouts e boundaries
src/features/<feature>          comportamento e UI da feature
src/components/ui               primitivas visuais reutilizáveis
src/lib                         infraestrutura técnica transversal
```

- `app` pode importar features, UI e `lib`.
- Features podem importar UI e `lib`.
- `components/ui` e `lib` NÃO importam features.
- Componentes de UI NÃO conhecem `Product`, endpoints, códigos de erro da API ou regras de autenticação.
- Os diretórios são criados sob demanda; NÃO criar esqueletos vazios.

## Decisão de extração

Antes de extrair um componente, responder:

1. Há uma responsabilidade ou conceito com nome claro?
2. Ele é repetido ou complexo o suficiente para ser testado isoladamente?
3. A API de props fica menor e mais clara que o JSX original?
4. O novo componente respeita a direção de dependências?

Se a maioria for “não”, manter a composição local.

## APIs de componentes

- PREFIRA composição com `children` e subcomponentes a props booleanas que combinam muitos modos.
- Variantes visuais finitas e reais DEVEM ser modeladas com `variant` e `size`, centralizadas com CVA.
- NÃO expor props como `isGreen`, `hasShadow`, `rounded` ou `compactAndCentered`; elas vazam detalhes visuais.
- Repassar props nativas úteis e preservar semântica, teclado, foco e `ref` conforme a versão de React instalada.
- Eventos usam nomes do ponto de vista do consumidor: `onConfirm`, `onRetry`, `onProductDeleted`.
- Props opcionais precisam de comportamento padrão inequívoco.

```tsx
// Ruim: combinações inválidas e aparência exposta.
<ActionButton green danger compact loading />

// Bom: contrato finito e semântico.
<Button variant="destructive" size="sm" disabled={isDeleting}>
  <Spinner data-icon="inline-start" />
  Excluindo
</Button>
```

## Estado e comportamento

- Manter estado no nível mais próximo que precisa dele.
- Derivar valores durante a renderização; NÃO sincronizar estado derivável com `useEffect`.
- Extrair hook quando houver comportamento reutilizável ou coordenação de efeitos, não para esconder uma única chamada de `useState`.
- Efeitos DEVEM sincronizar com sistemas externos e possuir limpeza quando registrarem listeners, timers ou assinaturas.
- Não duplicar dados remotos em vários estados locais sem uma fonte de verdade explícita.
- Carregamento, vazio, erro, sucesso e confirmação são estados diferentes e testáveis.

## Formulários

- Um schema da feature concentra validação e mensagens.
- Tipos do formulário DEVEM ser derivados do schema quando a biblioteca permitir.
- Campos reutilizam primitivas shadcn; o componente de formulário da feature liga schema, submissão e mensagens da API.
- Erros de campo permanecem próximos do controle; erro geral e `correlationId` ficam em feedback do formulário.
- Durante submissão, impedir repetição da operação e manter rótulo que descreva o estado.
- NÃO criar um “formulário universal” configurado por dezenas de objetos. Compartilhar campos e padrões, não regras de negócio distintas.

## Listas e itens

- Usar chave estável do domínio, nunca índice quando itens podem mudar.
- Separar `ProductList`, `ProductCard` e estado vazio quando cada um tiver responsabilidade clara.
- Formatação de preço e data deve ser centralizada e determinística, com locale e timezone explícitos quando relevantes.
- Componentes de item recebem os dados mínimos necessários ou um tipo de apresentação próprio; não recebem resposta HTTP completa.

## Acessibilidade como contrato

- Usar elemento HTML correto antes de adicionar ARIA.
- Todo controle possui nome acessível; labels são associadas ao campo.
- Ações só com ícone precisam de nome acessível.
- Foco visível, ordem de teclado e devolução de foco em overlays DEVEM funcionar.
- Informação não depende apenas de cor, hover ou animação.
- Dialog, Sheet e Drawer sempre possuem título acessível.

## Imports e módulos

- Usar os aliases reais do `tsconfig.json` e `components.json`.
- Evitar caminhos profundos para dentro de outra feature.
- NÃO criar barrels globais que aumentem ciclos ou escondam a origem de imports. Um `index.ts` local só é aceito quando define uma API pública pequena e estável.
- Imports de servidor não podem alcançar o bundle cliente. Marcar fronteiras client/server de forma mínima e explícita.
