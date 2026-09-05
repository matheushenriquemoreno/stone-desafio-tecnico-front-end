const productPriceFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
})

export function formatProductPrice(price: number): string {
  return productPriceFormatter.format(price).replace(/\u00a0/g, ' ')
}
