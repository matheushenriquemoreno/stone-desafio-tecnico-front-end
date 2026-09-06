import type { Metadata } from 'next'

import { ProductCreationGate } from '@/features/products/components/product-creation-gate'
import { ProductCreationScreen } from '@/features/products/components/product-creation-screen'

export const metadata: Metadata = {
  title: 'Novo produto',
  description: 'Criação de um produto no catálogo compartilhado.',
}

export default function NewProductPage() {
  return (
    <ProductCreationGate>
      <ProductCreationScreen />
    </ProductCreationGate>
  )
}
