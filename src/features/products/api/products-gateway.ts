import { requestApi, type ApiResult } from '@/lib/api-client'
import type { ApiFieldError } from '@/lib/api-error'
import {
  productSchema,
  productPageSchema,
  type ProductPage,
} from '@/features/products/schemas/product'
import { productInputSchema } from '@/features/products/schemas/product-input-schema'
import type {
  CreateProductResult,
  ListProductsResult,
  ProductFieldError,
  ProductDetailResult,
  ProductInputField,
  ProductMutationGatewayError,
  ProductsGatewayError,
} from '@/features/products/types'

const defaultProductPageLimit = 20
const productListErrorStatuses = [400, 401, 429] as const
const productCreateErrorStatuses = [400, 401, 403, 429, 503] as const

const productFieldMessages: Record<ProductInputField, string> = {
  description: 'A descrição deve ter entre 1 e 500 caracteres.',
  imageUrl: 'A URL da imagem deve usar HTTP(S) e ter até 2048 caracteres.',
  name: 'O nome deve ter entre 2 e 100 caracteres.',
  price: 'O preço deve ser maior que zero e ter até duas casas decimais.',
}

function isProductInputField(field: string): field is ProductInputField {
  return field in productFieldMessages
}

function productFieldError(
  field: ProductInputField,
  message = productFieldMessages[field],
): ProductFieldError {
  return { code: 'invalid', field, message }
}

function mapValidationIssues(
  issues: readonly { message: string; path: PropertyKey[] }[],
): ProductFieldError[] {
  const errors = new Map<ProductInputField, ProductFieldError>()

  for (const issue of issues) {
    const field = issue.path[0]

    if (typeof field === 'string' && isProductInputField(field)) {
      errors.set(field, productFieldError(field, issue.message))
    }
  }

  return Array.from(errors.values())
}

function mapApiFieldErrors(
  errors: readonly ApiFieldError[] | undefined,
): ProductFieldError[] | undefined {
  if (errors === undefined) {
    return undefined
  }

  return errors.flatMap(({ field }) =>
    isProductInputField(field) ? [productFieldError(field)] : [],
  )
}

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

function mapProductMutationApiError(
  result: Extract<ApiResult<never>, { kind: 'api-error' }>,
): ProductMutationGatewayError {
  const { error, status } = result

  if (status === 400 && error.code === 'VALIDATION_ERROR') {
    return {
      code: 'validation',
      correlationId: error.correlationId,
      fieldErrors: mapApiFieldErrors(error.errors),
      status,
    }
  }

  if (status === 401 && error.code === 'UNAUTHORIZED') {
    return {
      code: 'unauthorized',
      correlationId: error.correlationId,
      status,
    }
  }

  if (status === 403 && error.code === 'REQUEST_FORBIDDEN') {
    return {
      code: 'forbidden',
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

  if (status === 503 && error.code === 'SERVICE_UNAVAILABLE') {
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

function mapProductDetailApiError(
  result: Extract<ApiResult<never>, { kind: 'api-error' }>,
): ProductMutationGatewayError {
  const { error, status } = result

  if (status === 401 && error.code === 'UNAUTHORIZED') {
    return {
      code: 'unauthorized',
      correlationId: error.correlationId,
      status,
    }
  }

  if (status === 404 && error.code === 'PRODUCT_NOT_FOUND') {
    return {
      code: 'not-found',
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

  if (status === 503 && error.code === 'SERVICE_UNAVAILABLE') {
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
    limit?: number
    signal?: AbortSignal
  } = {},
): Promise<ListProductsResult> {
  const query = new URLSearchParams({
    limit: String(options.limit ?? defaultProductPageLimit),
  })

  if (options.cursor !== undefined) {
    query.set('cursor', options.cursor)
  }

  const result = await requestApi<ProductPage>({
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

export async function createProduct(
  input: unknown,
  signal?: AbortSignal,
): Promise<CreateProductResult> {
  const parsedInput = productInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      kind: 'error',
      error: {
        code: 'validation',
        fieldErrors: mapValidationIssues(parsedInput.error.issues),
      },
    }
  }

  const result = await requestApi({
    body: parsedInput.data,
    expectedErrorStatuses: productCreateErrorStatuses,
    expectedStatuses: [201],
    method: 'POST',
    path: '/products',
    responseSchema: productSchema,
    signal,
  })

  if (result.kind === 'success') {
    return { kind: 'success', product: result.data }
  }

  if (result.kind === 'api-error') {
    return { error: mapProductMutationApiError(result), kind: 'error' }
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

export async function getProduct(
  productId: string,
  signal?: AbortSignal,
): Promise<ProductDetailResult> {
  const result = await requestApi({
    expectedErrorStatuses: [401, 404, 429, 503],
    expectedStatuses: [200],
    method: 'GET',
    path: `/products/${encodeURIComponent(productId)}`,
    responseSchema: productSchema,
    signal,
  })

  if (result.kind === 'success') {
    return { kind: 'success', product: result.data }
  }

  if (result.kind === 'api-error') {
    return { error: mapProductDetailApiError(result), kind: 'error' }
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
