import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { requestApi } from './api-client'

const responseSchema = z.object({ ok: z.boolean() })

function createResponse(
  status: number,
  body: unknown,
  headers?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

describe('requestApi', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it.each([
    ['GET', undefined, 200],
    ['POST', { email: 'user@example.com' }, 200],
    ['PATCH', { name: 'Produto' }, 200],
    ['DELETE', undefined, 204],
  ] as const)(
    'uses the direct API URL, credentials, method, and safe headers for %s',
    async (method, body, expectedStatus) => {
      fetchMock.mockResolvedValue(
        expectedStatus === 204
          ? new Response(null, { status: expectedStatus })
          : createResponse(expectedStatus, { ok: true }),
      )

      const result = await requestApi({
        path: '/products',
        method,
        body,
        expectedStatuses: [expectedStatus],
        responseSchema: expectedStatus === 204 ? undefined : responseSchema,
      })

      expect(result.kind).toBe(expectedStatus === 204 ? 'success-empty' : 'success')

      const [requestUrl, requestInit] = fetchMock.mock.calls[0] ?? []
      const requestHeaders = new Headers(requestInit?.headers)

      expect(String(requestUrl)).toBe('https://api.example.com/products')
      expect(requestInit?.credentials).toBe('include')
      expect(requestInit?.method).toBe(method)
      expect(requestHeaders.get('Authorization')).toBeNull()
      expect(requestHeaders.get('X-CSRF-Protection')).toBeNull()
      expect(requestHeaders.get('Origin')).toBeNull()
      expect(requestHeaders.get('Referer')).toBeNull()

      if (body) {
        expect(requestHeaders.get('Content-Type')).toBe('application/json')
        expect(JSON.parse(String(requestInit?.body))).toEqual(body)
      } else {
        expect(requestInit?.body).toBeUndefined()
      }
    },
  )

  it('returns a validated response body and forwards the abort signal', async () => {
    const controller = new AbortController()
    fetchMock.mockResolvedValue(createResponse(200, { ok: true }))

    const result = await requestApi({
      path: 'products?limit=20',
      responseSchema,
      signal: controller.signal,
    })

    expect(result).toEqual({ kind: 'success', status: 200, data: { ok: true } })
    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
  })

  it('returns a safe failure for an invalid success body without exposing it', async () => {
    const internalBody = { secret: 'internal detail' }
    fetchMock.mockResolvedValue(createResponse(200, internalBody))

    const result = await requestApi({
      path: '/products',
      responseSchema,
    })

    expect(result).toEqual({
      kind: 'failure',
      reason: 'invalid-response',
      status: 200,
    })
    expect(JSON.stringify(result)).not.toContain(internalBody.secret)
  })

  it('validates API errors and reads a safe Retry-After value', async () => {
    fetchMock.mockResolvedValue(
      createResponse(
        429,
        {
          statusCode: 429,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Limite de requisições excedido.',
          correlationId: 'request-123',
        },
        { 'Retry-After': '7' },
      ),
    )

    const result = await requestApi({
      path: '/products',
      expectedErrorStatuses: [429],
    })

    expect(result).toEqual({
      kind: 'api-error',
      status: 429,
      error: {
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Limite de requisições excedido.',
        correlationId: 'request-123',
        retryAfterSeconds: 7,
      },
    })
  })

  it('uses a safe fallback for malformed and unexpected error responses', async () => {
    fetchMock.mockResolvedValue(new Response('detalhe interno', { status: 400 }))

    const malformedResult = await requestApi({
      path: '/products',
      expectedErrorStatuses: [400],
    })

    expect(malformedResult).toEqual({
      kind: 'failure',
      reason: 'invalid-response',
      status: 400,
    })
    expect(JSON.stringify(malformedResult)).not.toContain('detalhe interno')

    fetchMock.mockResolvedValue(
      createResponse(500, {
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'detalhe interno',
      }),
    )

    const unexpectedResult = await requestApi({ path: '/products' })

    expect(unexpectedResult).toEqual({
      kind: 'failure',
      reason: 'unexpected-status',
      status: 500,
    })
    expect(JSON.stringify(unexpectedResult)).not.toContain('detalhe interno')
  })

  it('ignores invalid Retry-After values instead of inventing a wait', async () => {
    fetchMock.mockResolvedValue(
      createResponse(
        429,
        {
          statusCode: 429,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Limite de requisições excedido.',
        },
        { 'Retry-After': '0' },
      ),
    )

    const result = await requestApi({ path: '/products' })

    expect(result.kind).toBe('api-error')

    if (result.kind === 'api-error') {
      expect(result.error.retryAfterSeconds).toBeUndefined()
    }
  })

  it('differentiates abort and network failures without exposing error details', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'))

    const abortedResult = await requestApi({ path: '/products' })

    expect(abortedResult).toEqual({ kind: 'failure', reason: 'aborted' })

    fetchMock.mockRejectedValueOnce(new Error('private network detail'))

    const networkResult = await requestApi({ path: '/products' })

    expect(networkResult).toEqual({ kind: 'failure', reason: 'network' })
    expect(JSON.stringify(networkResult)).not.toContain('private network detail')
  })

  it('fails before fetch when configuration or body serialization is unsafe', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', '')

    const configurationResult = await requestApi({ path: '/products' })

    expect(configurationResult).toEqual({
      kind: 'failure',
      reason: 'configuration',
    })
    expect(fetchMock).not.toHaveBeenCalled()

    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.example.com')
    const circularBody: Record<string, unknown> = {}
    circularBody.self = circularBody

    const serializationResult = await requestApi({
      path: '/products',
      method: 'POST',
      body: circularBody,
    })

    expect(serializationResult).toEqual({
      kind: 'failure',
      reason: 'serialization',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
