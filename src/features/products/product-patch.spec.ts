import { describe, expect, it } from 'vitest'

import { buildProductPatch } from './product-patch'

const initialProduct = {
  description: 'Descrição inicial',
  imageUrl: 'https://example.com/initial.png',
  name: 'Produto inicial',
  price: 99.9,
}

describe('product patch', () => {
  it.each([
    { field: 'name', label: 'nome', value: 'Produto atualizado' },
    { field: 'description', label: 'descrição', value: 'Descrição atualizada' },
    { field: 'price', label: 'preço', value: 109.9 },
    {
      field: 'imageUrl',
      label: 'imagem',
      value: 'https://example.com/updated.png',
    },
  ] as const)('envia somente o campo $label alterado', ({ field, value }) => {
    const result = buildProductPatch(initialProduct, {
      ...initialProduct,
      [field]: value,
    })

    expect(result).toEqual({ kind: 'success', patch: { [field]: value } })
  })

  it('envia múltiplos campos alterados e omite os demais', () => {
    const result = buildProductPatch(initialProduct, {
      ...initialProduct,
      description: 'Descrição atualizada',
      name: 'Produto atualizado',
    })

    expect(result).toEqual({
      kind: 'success',
      patch: {
        description: 'Descrição atualizada',
        name: 'Produto atualizado',
      },
    })
  })

  it('compara a forma normalizada e rejeita retorno ao valor original', () => {
    expect(
      buildProductPatch(initialProduct, {
        ...initialProduct,
        name: ' Produto inicial ',
        price: 99.9,
      }),
    ).toEqual({
      fieldErrors: [],
      kind: 'error',
      message: 'Altere ao menos um campo do produto.',
    })
  })

  it('rejeita valores inválidos antes de gerar o patch', () => {
    expect(
      buildProductPatch(initialProduct, {
        ...initialProduct,
        price: 0,
      }),
    ).toEqual({
      fieldErrors: [
        {
          code: 'invalid',
          field: 'price',
          message: 'O preço deve ser maior que zero e ter até duas casas decimais.',
        },
      ],
      kind: 'error',
      message: 'Confira os dados informados e tente novamente.',
    })
  })

  it('rejeita valor null com erro de campo seguro', () => {
    const result = buildProductPatch(initialProduct, {
      ...initialProduct,
      name: null,
    })

    expect(result).toEqual({
      fieldErrors: [
        {
          code: 'invalid',
          field: 'name',
          message: 'Informe o nome do produto.',
        },
      ],
      kind: 'error',
      message: 'Confira os dados informados e tente novamente.',
    })
  })

  it('rejeita chave desconhecida sem expor detalhe estrutural', () => {
    const result = buildProductPatch(initialProduct, {
      ...initialProduct,
      unknown: 'não permitido',
    })

    expect(result).toEqual({
      fieldErrors: [],
      kind: 'error',
      message: 'Confira os dados informados e tente novamente.',
    })
  })
})
