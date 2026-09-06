import type { ListProductsResult, ProductDetailResult } from '@/features/products/types'

type ProtectedReadResult = ListProductsResult | ProductDetailResult

export function shouldRedirectToLoginForProtectedRead(
  result: ProtectedReadResult,
): boolean {
  if (result.kind === 'error') {
    return result.error.code === 'unavailable'
  }

  return result.kind === 'failure' && result.reason !== 'aborted'
}
