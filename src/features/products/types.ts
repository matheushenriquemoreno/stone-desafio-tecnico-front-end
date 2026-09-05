import type { ApiResult } from '@/lib/api-client'

export type { Product, ProductPage } from '@/features/products/schemas/product'

export type ProductsGatewayErrorCode =
  | 'unauthorized'
  | 'rate-limit'
  | 'validation'
  | 'unavailable'
  | 'unknown'

export type ProductsGatewayError = Readonly<{
  code: ProductsGatewayErrorCode
  correlationId?: string
  retryAfterSeconds?: number
  status?: number
}>

export type ListProductsResult =
  | Readonly<{
      kind: 'success'
      page: import('@/features/products/schemas/product').ProductPage
    }>
  | Readonly<{ kind: 'error'; error: ProductsGatewayError }>
  | Readonly<{
      kind: 'failure'
      reason: Extract<ApiResult<never>, { kind: 'failure' }>['reason']
      status?: number
    }>
