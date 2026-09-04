# Regras de implementação do front-end

Esta pasta transforma as decisões aprovadas do projeto em regras práticas para escrever, revisar e validar o código. As regras valem para pessoas e agentes de IA.

## Ordem de leitura

1. [Princípios de implementação](./principios-de-implementacao.md)
2. [Componentes e reutilização](./componentes-e-reutilizacao.md)
3. [Next.js](./nextjs.md)
4. [Tailwind CSS](./tailwind-css.md)
5. [shadcn/ui](./shadcn-ui.md)
6. [Testes e qualidade](./testes-e-qualidade.md)
7. [Checklist de implementação](./checklist-de-implementacao.md)

O [AGENTS.md](../AGENTS.md) resume o fluxo obrigatório e aponta para estes documentos.

## Hierarquia das fontes de verdade

Quando houver divergência, seguir esta ordem:

1. solicitação atual e explícita do usuário;
2. [requisitos](../docs/Requisitos.md) e [contrato de integração](../docs/Contrato-de-integracao.md);
3. [ADRs aceitas](../docs/adr/README.md), em especial organização, consumo direto da API e design system;
4. estas regras;
5. convenções já presentes no código.

Não contornar uma decisão aceita silenciosamente. Se uma implementação exigir outra arquitetura, contrato ou identidade visual, registrar o trade-off e atualizar a documentação responsável antes do código.

## Vocabulário

- **DEVE / NÃO DEVE:** obrigatório.
- **PREFIRA:** padrão esperado; desviar somente com motivo verificável.
- **PODE:** opção permitida, não uma exigência.

## Referências adotadas

- [ADR-001 — organização por features](../docs/adr/ADR-001-organizacao-frontend.md)
- [ADR-003 — consumo direto da API](../docs/adr/ADR-003-consumo-direto-api.md)
- [ADR-004 — design system](../docs/adr/ADR-004-design-system-identidade-visual.md)
- [Next.js Best Practices, da Vercel Labs](https://agenticskills.io/skills/next-best-practices), snapshot consultado para convenções de App Router, limites RSC, dados, imagens, fontes, erros e hidratação
- documentação da versão instalada do Next.js, que prevalece sobre exemplos externos quando a API do framework tiver mudado
- documentação e CLI do shadcn/ui correspondentes ao `components.json` do projeto

As referências externas orientam a implementação, mas não alteram o contrato local. Neste projeto, por exemplo, o navegador consome diretamente a API NestJS; portanto, a recomendação genérica de usar Server Actions para mutações não autoriza criar uma camada intermediária no Next.js.
