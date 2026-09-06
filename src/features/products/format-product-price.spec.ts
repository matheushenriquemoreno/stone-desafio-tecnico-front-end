import { describe, expect, it } from 'vitest'

import {
  formatProductPrice,
  formatProductPriceInput,
  parseProductPriceInput,
} from './format-product-price'

describe('formatProductPrice', () => {
  it('formats Brazilian currency with two decimal places', () => {
    expect(formatProductPrice(99.9)).toBe('R$ 99,90')
    expect(formatProductPrice(1200)).toBe('R$ 1.200,00')
  })

  it('formata somente os algarismos digitados como centavos de Real', () => {
    expect(formatProductPriceInput('abc9990xyz')).toBe('R$ 99,90')
    expect(formatProductPriceInput('R$ 1.234,56')).toBe('R$ 1.234,56')
    expect(formatProductPriceInput('letras')).toBe('')
  })

  it('converte apenas a representação brasileira completa para número', () => {
    expect(parseProductPriceInput('R$ 99,90')).toBe(99.9)
    expect(parseProductPriceInput('R$ 1.234,56')).toBe(1234.56)
    expect(parseProductPriceInput('99.90')).toBeNaN()
  })
})
