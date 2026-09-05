import { requestApi, type ApiResult } from '@/lib/api-client'
import { loginCredentialsSchema } from '@/features/auth/schemas/login'
import type {
  AuthFieldError,
  AuthGatewayError,
  LoginResult,
} from '@/features/auth/types'

const loginErrorStatuses = [400, 401, 403, 429] as const

function fieldError(field: AuthFieldError['field']): AuthFieldError {
  return {
    code: 'invalid',
    field,
    message:
      field === 'email'
        ? 'Informe um e-mail válido.'
        : 'A senha deve ter entre 8 e 128 caracteres.',
  }
}

function mapValidationErrors(
  issues: readonly { path: PropertyKey[] }[],
): AuthFieldError[] {
  const fields = new Set<AuthFieldError['field']>()

  for (const issue of issues) {
    const field = issue.path[0]

    if (field === 'email' || field === 'password') {
      fields.add(field)
    }
  }

  return Array.from(fields, (field) => fieldError(field))
}

function mapApiError(
  result: Extract<ApiResult<never>, { kind: 'api-error' }>,
): AuthGatewayError {
  const { error, status } = result

  if (status === 401 && error.code === 'INVALID_CREDENTIALS') {
    return {
      code: 'invalid-credentials',
      correlationId: error.correlationId,
      status,
    }
  }

  if (status === 400 && error.code === 'VALIDATION_ERROR') {
    return {
      code: 'validation',
      correlationId: error.correlationId,
      fieldErrors: error.errors?.flatMap(({ field }) =>
        field === 'email' || field === 'password' ? [fieldError(field)] : [],
      ),
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

export async function login(
  input: unknown,
  signal?: AbortSignal,
): Promise<LoginResult> {
  const parsedInput = loginCredentialsSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      kind: 'error',
      error: {
        code: 'validation',
        fieldErrors: mapValidationErrors(parsedInput.error.issues),
      },
    }
  }

  const result = await requestApi<void>({
    body: parsedInput.data,
    expectedErrorStatuses: loginErrorStatuses,
    expectedStatuses: [204],
    method: 'POST',
    path: '/auth/login',
    signal,
  })

  if (result.kind === 'success-empty') {
    return { kind: 'success' }
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
