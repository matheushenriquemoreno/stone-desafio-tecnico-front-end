import { describe, expect, it } from 'vitest'

import { formatProductPrice } from './format-product-price'

describe('formatProductPrice', () => {
  it('formats Brazilian currency with two decimal places', () => {
    expect(formatProductPrice(99.9)).toBe('R$ 99,90')
    expect(formatProductPrice(1200)).toBe('R$ 1.200,00')
  })
})
