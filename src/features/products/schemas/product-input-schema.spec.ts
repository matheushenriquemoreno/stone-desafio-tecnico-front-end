import { describe, expect, it } from 'vitest'

import { productFormSchema, productInputSchema } from './product-input-schema'

const validFormValues = {
  description: 'Descrição do produto',
  imageUrl: ' https://images.example.com/product.png ',
  name: ' Produto principal ',
  price: 'R$ 99,90',
}

describe('product input schemas', () => {
  it('normaliza formulário e converte preço para o payload público', () => {
    expect(productFormSchema.parse(validFormValues)).toEqual({
      description: 'Descrição do produto',
      imageUrl: 'https://images.example.com/product.png',
      name: 'Produto principal',
      price: 99.9,
    })
  })

  it.each([
    ['nome curto', { ...validFormValues, name: 'A' }],
    ['descrição vazia', { ...validFormValues, description: '   ' }],
    ['preço zero', { ...validFormValues, price: '0' }],
    ['preço negativo', { ...validFormValues, price: '-1' }],
    ['preço com três casas', { ...validFormValues, price: '10.123' }],
    ['protocolo proibido', { ...validFormValues, imageUrl: 'javascript:alert(1)' }],
  ])('rejeita %s antes do transporte', (_caseName, values) => {
    expect(productFormSchema.safeParse(values).success).toBe(false)
  })

  it('rejeita URL maior que 2048 caracteres', () => {
    const values = {
      ...validFormValues,
      imageUrl: `https://example.com/${'a'.repeat(2030)}`,
    }

    expect(productFormSchema.safeParse(values).success).toBe(false)
  })

  it('rejeita null e chaves desconhecidas no payload público', () => {
    expect(
      productInputSchema.safeParse({
        ...productFormSchema.parse(validFormValues),
        description: null,
      }).success,
    ).toBe(false)
    expect(
      productInputSchema.safeParse({
        ...productFormSchema.parse(validFormValues),
        extra: 'não permitido',
      }).success,
    ).toBe(false)
  })
})
