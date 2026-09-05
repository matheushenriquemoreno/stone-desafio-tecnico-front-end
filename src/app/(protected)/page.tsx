import type { Metadata } from 'next'

import { ProductsScreen } from '@/features/products/components/products-screen'

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Catálogo protegido de produtos.',
}

export default function ProtectedHomePage() {
  return <ProductsScreen />
}
