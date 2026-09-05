import { apiErrorSchema, type ApiErrorDetails } from '@/lib/api-error'
import { z } from 'zod'

const defaultErrorStatuses = [400, 401, 403, 404, 409, 429] as const

type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

export type ApiRequestOptions<ResponseData> = Readonly<{
  path: string
  method?: HttpMethod
  body?: unknown
  responseSchema?: z.ZodType<ResponseData>
  expectedStatuses?: readonly number[]
  expectedErrorStatuses?: readonly number[]
  signal?: AbortSignal
}>

export type ApiResult<ResponseData> =
  | {
      kind: 'success-empty'
      status: 204
    }
  | {
      kind: 'success'
      status: number
      data: ResponseData
    }
  | {
      kind: 'api-error'
      status: number
      error: ApiErrorDetails
    }
  | {
      kind: 'failure'
      reason:
        | 'aborted'
        | 'configuration'
        | 'invalid-response'
        | 'network'
        | 'serialization'
        | 'unexpected-status'
      status?: number
    }

type UrlResult =
  | { kind: 'success'; url: URL }
  | Extract<ApiResult<never>, { kind: 'failure' }>

function buildApiUrl(path: string): UrlResult {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

  if (!configuredBaseUrl) {
    return { kind: 'failure', reason: 'configuration' }
  }

  try {
    const baseUrl = new URL(configuredBaseUrl)

    if (!['http:', 'https:'].includes(baseUrl.protocol)) {
      return { kind: 'failure', reason: 'configuration' }
    }

    if (!baseUrl.pathname.endsWith('/')) {
      baseUrl.pathname = `${baseUrl.pathname}/`
    }

    return {
      kind: 'success',
      url: new URL(path.replace(/^\/+/, ''), baseUrl),
    }
  } catch {
    return { kind: 'failure', reason: 'configuration' }
  }
}

function readRetryAfterSeconds(value: string | null): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined
  }

  const seconds = Number(value)

  if (!Number.isSafeInteger(seconds) || seconds < 1) {
    return undefined
  }

  return seconds
}

function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'AbortError'
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  )
}

async function readJson(response: Response): Promise<unknown | undefined> {
  const responseText = await response.text()

  if (!responseText.trim()) {
    return undefined
  }

  try {
    return JSON.parse(responseText)
  } catch {
    return undefined
  }
}

async function readApiError(
  response: Response,
  expectedErrorStatuses: readonly number[],
): Promise<ApiResult<never>> {
  if (!expectedErrorStatuses.includes(response.status)) {
    return {
      kind: 'failure',
      reason: 'unexpected-status',
      status: response.status,
    }
  }

  const responseBody = await readJson(response)
  const parsedError = apiErrorSchema.safeParse(responseBody)

  if (!parsedError.success || parsedError.data.statusCode !== response.status) {
    return {
      kind: 'failure',
      reason: 'invalid-response',
      status: response.status,
    }
  }

  const retryAfterSeconds = readRetryAfterSeconds(response.headers.get('Retry-After'))

  return {
    kind: 'api-error',
    status: response.status,
    error: {
      ...parsedError.data,
      ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
    },
  }
}

export async function requestApi<ResponseData>(
  options: ApiRequestOptions<ResponseData>,
): Promise<ApiResult<ResponseData>> {
  const urlResult = buildApiUrl(options.path)

  if (urlResult.kind === 'failure') {
    return urlResult
  }

  let serializedBody: string | undefined

  if (options.body !== undefined) {
    try {
      serializedBody = JSON.stringify(options.body)
    } catch {
      return { kind: 'failure', reason: 'serialization' }
    }

    if (serializedBody === undefined) {
      return { kind: 'failure', reason: 'serialization' }
    }
  }

  const headers = new Headers({ Accept: 'application/json' })

  if (serializedBody !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const expectedStatuses = options.expectedStatuses ?? [200]
  const expectedErrorStatuses = options.expectedErrorStatuses ?? defaultErrorStatuses

  try {
    const response = await fetch(urlResult.url, {
      method: options.method ?? 'GET',
      headers,
      body: serializedBody,
      credentials: 'include',
      signal: options.signal,
    })

    if (!expectedStatuses.includes(response.status)) {
      return await readApiError(response, expectedErrorStatuses)
    }

    if (response.status === 204) {
      return { kind: 'success-empty', status: 204 }
    }

    if (!options.responseSchema) {
      return { kind: 'failure', reason: 'invalid-response', status: response.status }
    }

    const responseBody = await readJson(response)
    const parsedResponse = options.responseSchema.safeParse(responseBody)

    if (!parsedResponse.success) {
      return { kind: 'failure', reason: 'invalid-response', status: response.status }
    }

    return {
      kind: 'success',
      status: response.status,
      data: parsedResponse.data,
    }
  } catch (error: unknown) {
    return {
      kind: 'failure',
      reason: isAbortError(error) ? 'aborted' : 'network',
    }
  }
}
