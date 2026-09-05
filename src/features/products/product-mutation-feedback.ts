import type {
  ProductFieldError,
  ProductMutationGatewayError,
} from '@/features/products/types'

export type ProductMutationFeedback = Readonly<{
  correlationId?: string
  fieldErrors: readonly ProductFieldError[]
  generalMessage?: string
}>

const validationMessage = 'Confira os dados informados e tente novamente.'

export function getProductMutationFeedback(
  error: ProductMutationGatewayError,
  genericMessage: string,
  forbiddenMessage: string,
  rateLimitPrefix = 'Muitas tentativas.',
): ProductMutationFeedback {
  if (error.code === 'validation') {
    const fieldErrors = error.fieldErrors ?? []

    return {
      correlationId: error.correlationId,
      fieldErrors,
      generalMessage: fieldErrors.length ? undefined : validationMessage,
    }
  }

  if (error.code === 'forbidden') {
    return {
      correlationId: error.correlationId,
      fieldErrors: [],
      generalMessage: forbiddenMessage,
    }
  }

  if (error.code === 'rate-limit') {
    return {
      correlationId: error.correlationId,
      fieldErrors: [],
      generalMessage:
        error.retryAfterSeconds === undefined
          ? `${rateLimitPrefix} Aguarde alguns instantes antes de tentar novamente.`
          : `${rateLimitPrefix} Aguarde ${error.retryAfterSeconds} segundos antes de tentar novamente.`,
    }
  }

  return {
    correlationId: error.correlationId,
    fieldErrors: [],
    generalMessage: genericMessage,
  }
}
