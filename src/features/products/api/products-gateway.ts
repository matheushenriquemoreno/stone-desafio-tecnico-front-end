import { requestApi, type ApiResult } from '@/lib/api-client'
import { productPageSchema } from '@/features/products/schemas/product'
import type {
  ListProductsResult,
  ProductsGatewayError,
} from '@/features/products/types'

const defaultProductPageLimit = 20
const productListErrorStatuses = [400, 401, 429] as const

function mapApiError(
  result: Extract<ApiResult<never>, { kind: 'api-error' }>,
): ProductsGatewayError {
  const { error, status } = result

  if (status === 401 && error.code === 'UNAUTHORIZED') {
    return {
      code: 'unauthorized',
      correlationId: error.correlationId,
      status,
    }
  }

  if (status === 400 && error.code === 'VALIDATION_ERROR') {
    return {
      code: 'validation',
      correlationId: error.correlationId,
      status,
    }
  }

  if (status === 429 && error.code === 'RATE_LIMIT_EXCEEDED') {
    return {
      code: 'rate-limit',
      correlationId: error.correlationId,
      retryAfterSeconds: error.retryAfterSeconds,
      status,
    }
  }

  if (error.code === 'SERVICE_UNAVAILABLE') {
    return {
      code: 'unavailable',
      correlationId: error.correlationId,
      status,
    }
  }

  return {
    code: 'unknown',
    correlationId: error.correlationId,
    status,
  }
}

export async function listProducts(
  options: {
    cursor?: string
    signal?: AbortSignal
  } = {},
): Promise<ListProductsResult> {
  const query = new URLSearchParams({ limit: String(defaultProductPageLimit) })

  if (options.cursor !== undefined) {
    query.set('cursor', options.cursor)
  }

  const result = await requestApi<
    import('@/features/products/schemas/product').ProductPage
  >({
    expectedErrorStatuses: productListErrorStatuses,
    expectedStatuses: [200],
    method: 'GET',
    path: `/products?${query.toString()}`,
    responseSchema: productPageSchema,
    signal: options.signal,
  })

  if (result.kind === 'success') {
    return { kind: 'success', page: result.data }
  }

  if (result.kind === 'api-error') {
    return { error: mapApiError(result), kind: 'error' }
  }

  if (result.kind !== 'failure') {
    return {
      kind: 'failure',
      reason: 'invalid-response',
      status: result.status,
    }
  }

  return {
    kind: 'failure',
    reason: result.reason,
    ...(result.status === undefined ? {} : { status: result.status }),
  }
}
