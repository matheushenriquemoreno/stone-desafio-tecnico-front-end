import type { ApiResult } from '@/lib/api-client'
import type { Product, ProductPage } from '@/features/products/schemas/product'

export type { Product, ProductPage } from '@/features/products/schemas/product'
export type {
  ProductFormValues,
  ProductInput,
} from '@/features/products/schemas/product-input-schema'

export type ProductsGatewayErrorCode =
  | 'forbidden'
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

export type ProductInputField = 'description' | 'imageUrl' | 'name' | 'price'

export type ProductFieldError = Readonly<{
  code: 'invalid'
  field: ProductInputField
  message: string
}>

export type ProductMutationGatewayErrorCode =
  | 'forbidden'
  | 'not-found'
  | 'rate-limit'
  | 'unauthorized'
  | 'validation'
  | 'unavailable'
  | 'unknown'

export type ProductMutationGatewayError = Readonly<{
  code: ProductMutationGatewayErrorCode
  correlationId?: string
  fieldErrors?: readonly ProductFieldError[]
  retryAfterSeconds?: number
  status?: number
}>

export type CreateProductResult =
  | Readonly<{ kind: 'success'; product: Product }>
  | Readonly<{ kind: 'error'; error: ProductMutationGatewayError }>
  | Readonly<{
      kind: 'failure'
      reason: Extract<ApiResult<never>, { kind: 'failure' }>['reason']
      status?: number
    }>

export type ProductDetailResult =
  | Readonly<{ kind: 'success'; product: Product }>
  | Readonly<{ kind: 'error'; error: ProductMutationGatewayError }>
  | Readonly<{
      kind: 'failure'
      reason: Extract<ApiResult<never>, { kind: 'failure' }>['reason']
      status?: number
    }>
