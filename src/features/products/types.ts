import type { ApiResult } from '@/lib/api-client'
import type { ProductPage } from '@/features/products/schemas/product'

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
      page: ProductPage
    }>
  | Readonly<{ kind: 'error'; error: ProductsGatewayError }>
  | Readonly<{
      kind: 'failure'
      reason: Extract<ApiResult<never>, { kind: 'failure' }>['reason']
      status?: number
    }>
