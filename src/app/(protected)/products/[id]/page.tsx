import type { Metadata } from 'next'

import { ProductDetailScreen } from '@/features/products/components/product-detail-screen'

export const metadata: Metadata = {
  title: 'Produto',
  description: 'Detalhe de um produto do catálogo compartilhado.',
}

type ProductDetailPageProps = Readonly<{
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string | string[] | undefined }>
}>

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const created = query.created === 'success'

  return (
    <ProductDetailScreen key={id} productId={id} showCreatedConfirmation={created} />
  )
}
