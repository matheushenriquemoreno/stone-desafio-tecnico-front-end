import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { login } from '@/features/auth/api/auth-gateway'

describe('auth gateway', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.test'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl
    }
  })

  it('valida e normaliza credenciais antes de chamar o endpoint de login', async () => {
    const result = await login({
      email: '  Maria@Example.com ',
      password: 'senha-segura',
    })
    const fetchMock = vi.mocked(fetch)

    expect(result).toEqual({ kind: 'success' })
    expect(fetchMock).toHaveBeenCalledOnce()
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      'https://api.example.test/auth/login',
    )
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      email: 'maria@example.com',
      password: 'senha-segura',
    })
  })

  it('rejeita entrada inválida sem acessar a rede', async () => {
    const result = await login({ email: 'invalido', password: 'curta' })

    expect(result).toEqual({
      error: {
        code: 'validation',
        fieldErrors: [
          { code: 'invalid', field: 'email', message: 'Informe um e-mail válido.' },
          {
            code: 'invalid',
            field: 'password',
            message: 'A senha deve ter entre 8 e 128 caracteres.',
          },
        ],
      },
      kind: 'error',
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each([
    [401, 'INVALID_CREDENTIALS', 'invalid-credentials'],
    [403, 'REQUEST_FORBIDDEN', 'forbidden'],
    [429, 'RATE_LIMIT_EXCEEDED', 'rate-limit'],
  ] as const)('mapeia %s/%s para erro estável', async (status, code, expectedCode) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              code,
              correlationId: 'corr-login',
              message: 'mensagem externa',
              statusCode: status,
            }),
            {
              headers: status === 429 ? { 'Retry-After': '9' } : undefined,
              status,
            },
          ),
      ),
    )

    const result = await login({ email: 'maria@example.com', password: 'senha-segura' })

    expect(result.kind).toBe('error')
    if (result.kind === 'error') {
      expect(result.error.code).toBe(expectedCode)
      expect(result.error.correlationId).toBe('corr-login')
      expect(result.error.retryAfterSeconds).toBe(status === 429 ? 9 : undefined)
    }
  })

  it('converte falha de transporte em resultado explícito', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('segredo'))),
    )

    await expect(
      login({ email: 'maria@example.com', password: 'senha-segura' }),
    ).resolves.toEqual({
      kind: 'failure',
      reason: 'network',
    })
  })
})
