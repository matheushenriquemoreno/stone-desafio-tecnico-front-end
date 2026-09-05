import type { ApiResult } from '@/lib/api-client'
import type { ApiErrorDetails } from '@/lib/api-error'

export type { LoginCredentials } from '@/features/auth/schemas/login'

export type AuthFieldError = Readonly<{
  code: 'invalid'
  field: 'email' | 'password'
  message: string
}>

export type AuthGatewayErrorCode =
  | 'invalid-credentials'
  | 'rate-limit'
  | 'validation'
  | 'forbidden'
  | 'unauthorized'
  | 'unavailable'
  | 'unknown'

export type AuthGatewayError = Readonly<{
  code: AuthGatewayErrorCode
  correlationId?: string
  fieldErrors?: readonly AuthFieldError[]
  retryAfterSeconds?: number
  status?: number
}>

export type LoginResult =
  | Readonly<{ kind: 'success' }>
  | Readonly<{ kind: 'error'; error: AuthGatewayError }>
  | Readonly<{
      kind: 'failure'
      reason: Extract<ApiResult<never>, { kind: 'failure' }>['reason']
      status?: number
    }>

export type AuthApiError = ApiErrorDetails
