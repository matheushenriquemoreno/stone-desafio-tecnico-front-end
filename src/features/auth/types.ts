import type { ApiResult } from '@/lib/api-client'
import type { ApiErrorDetails } from '@/lib/api-error'
import type { RegisteredUser } from '@/features/auth/schemas/registered-user'

export type { LoginCredentials } from '@/features/auth/schemas/login'
export type { RegisterCredentials } from '@/features/auth/schemas/register'
export type { RegisteredUser } from '@/features/auth/schemas/registered-user'

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

export type RegisterFieldError = Readonly<{
  code: 'invalid'
  field: 'email' | 'name' | 'password'
  message: string
}>

export type RegisterGatewayErrorCode =
  | 'email-already-exists'
  | 'forbidden'
  | 'rate-limit'
  | 'validation'
  | 'unavailable'
  | 'unknown'

export type RegisterGatewayError = Readonly<{
  code: RegisterGatewayErrorCode
  correlationId?: string
  fieldErrors?: readonly RegisterFieldError[]
  retryAfterSeconds?: number
  status?: number
}>

export type RegisterResult =
  | Readonly<{ kind: 'success'; user: RegisteredUser }>
  | Readonly<{ kind: 'error'; error: RegisterGatewayError }>
  | Readonly<{
      kind: 'failure'
      reason: Extract<ApiResult<never>, { kind: 'failure' }>['reason']
      status?: number
    }>

export type LogoutGatewayErrorCode = 'forbidden' | 'rate-limit' | 'unknown'

export type LogoutGatewayError = Readonly<{
  code: LogoutGatewayErrorCode
  correlationId?: string
  retryAfterSeconds?: number
  status?: number
}>

export type LogoutResult =
  | Readonly<{ kind: 'success' }>
  | Readonly<{ kind: 'error'; error: LogoutGatewayError }>
  | Readonly<{
      kind: 'failure'
      reason: Extract<ApiResult<never>, { kind: 'failure' }>['reason']
      status?: number
    }>

export type AuthApiError = ApiErrorDetails
