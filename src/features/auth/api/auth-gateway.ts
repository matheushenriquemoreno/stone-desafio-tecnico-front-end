import { requestApi, type ApiResult } from '@/lib/api-client'
import { loginCredentialsSchema } from '@/features/auth/schemas/login'
import { registerSchema } from '@/features/auth/schemas/register'
import { registeredUserSchema } from '@/features/auth/schemas/registered-user'
import type {
  AuthFieldError,
  AuthGatewayError,
  LoginResult,
  RegisterFieldError,
  RegisterGatewayError,
  RegisterResult,
} from '@/features/auth/types'

const loginErrorStatuses = [400, 401, 403, 429] as const
const registerErrorStatuses = [400, 403, 409, 429, 503] as const

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

function registerFieldError(
  field: RegisterFieldError['field'],
  message?: string,
): RegisterFieldError {
  return {
    code: 'invalid',
    field,
    message:
      message ??
      (field === 'name'
        ? 'O nome deve ter entre 2 e 100 caracteres.'
        : field === 'email'
          ? 'Informe um e-mail válido.'
          : 'A senha deve ter entre 8 e 128 caracteres.'),
  }
}

function mapRegisterValidationIssues(
  issues: readonly { message: string; path: PropertyKey[] }[],
): RegisterFieldError[] {
  const errors = new Map<RegisterFieldError['field'], RegisterFieldError>()

  for (const issue of issues) {
    const field = issue.path[0]

    if (field === 'email' || field === 'name' || field === 'password') {
      errors.set(field, registerFieldError(field, issue.message))
    }
  }

  return Array.from(errors.values())
}

function mapRegisterApiError(
  result: Extract<ApiResult<never>, { kind: 'api-error' }>,
): RegisterGatewayError {
  const { error, status } = result

  if (status === 400 && error.code === 'VALIDATION_ERROR') {
    const fieldErrors = error.errors?.flatMap(({ field }) =>
      field === 'email' || field === 'name' || field === 'password'
        ? [registerFieldError(field)]
        : [],
    )

    return {
      code: 'validation',
      correlationId: error.correlationId,
      ...(fieldErrors === undefined ? {} : { fieldErrors }),
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

  if (status === 409 && error.code === 'EMAIL_ALREADY_EXISTS') {
    return {
      code: 'email-already-exists',
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

export async function register(
  input: unknown,
  signal?: AbortSignal,
): Promise<RegisterResult> {
  const parsedInput = registerSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      kind: 'error',
      error: {
        code: 'validation',
        fieldErrors: mapRegisterValidationIssues(parsedInput.error.issues),
      },
    }
  }

  const result = await requestApi({
    body: parsedInput.data,
    expectedErrorStatuses: registerErrorStatuses,
    expectedStatuses: [201],
    method: 'POST',
    path: '/auth/register',
    responseSchema: registeredUserSchema,
    signal,
  })

  if (result.kind === 'success') {
    return { kind: 'success', user: result.data }
  }

  if (result.kind === 'api-error') {
    return { error: mapRegisterApiError(result), kind: 'error' }
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
