import type { Metadata } from 'next'

import { LogoutButton } from '@/features/auth/components/logout-button'
import { ProtectedHeader } from '@/features/auth/components/protected-shell'
import { ProductsScreen } from '@/features/products/components/products-screen'

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Catálogo protegido de produtos.',
}

export default function ProtectedHomePage() {
  return (
    <ProductsScreen protectedHeader={<ProtectedHeader actions={<LogoutButton />} />} />
  )
}
