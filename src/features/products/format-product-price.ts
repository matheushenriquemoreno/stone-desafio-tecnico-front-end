const productPriceFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
})

export function formatProductPrice(price: number): string {
  return productPriceFormatter.format(price).replace(/\u00a0/g, ' ')
}

export function formatProductPriceInput(value: string): string {
  const digits = value.replace(/\D/g, '')

  if (digits.length === 0) {
    return ''
  }

  return formatProductPrice(Number(digits) / 100)
}

export function parseProductPriceInput(value: string): number {
  const normalizedValue = value.trim()

  if (!/^R\$ \d{1,3}(?:\.\d{3})*,\d{2}$/.test(normalizedValue)) {
    return Number.NaN
  }

  return Number(
    normalizedValue.replace(/^R\$ /, '').replaceAll('.', '').replace(',', '.'),
  )
}
