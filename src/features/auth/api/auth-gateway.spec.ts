import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { login, register } from '@/features/auth/api/auth-gateway'

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

  it('cadastra com payload normalizado e valida a resposta pública', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              email: 'maria@example.com',
              id: 'user-1',
              name: 'Maria Silva',
            }),
            { status: 201 },
          ),
      ),
    )

    const result = await register({
      email: '  Maria@Example.com ',
      name: '  Maria Silva  ',
      password: ' senha-segura ',
    })
    const fetchMock = vi.mocked(fetch)
    const request = fetchMock.mock.calls[0]?.[1]
    const headers = new Headers(request?.headers)

    expect(result).toEqual({
      kind: 'success',
      user: { email: 'maria@example.com', id: 'user-1', name: 'Maria Silva' },
    })
    expect(JSON.parse(String(request?.body))).toEqual({
      email: 'maria@example.com',
      name: 'Maria Silva',
      password: ' senha-segura ',
    })
    expect(request?.credentials).toBe('include')
    expect(headers.has('Authorization')).toBe(false)
    expect(headers.has('X-CSRF-Protection')).toBe(false)
  })

  it('rejeita cadastro inválido sem acessar a rede', async () => {
    const result = await register({ email: 'invalido', name: 'A', password: 'curta' })

    expect(result).toEqual({
      error: {
        code: 'validation',
        fieldErrors: [
          {
            code: 'invalid',
            field: 'name',
            message: 'O nome deve ter entre 2 e 100 caracteres.',
          },
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
    [400, 'VALIDATION_ERROR', 'validation'],
    [403, 'REQUEST_FORBIDDEN', 'forbidden'],
    [409, 'EMAIL_ALREADY_EXISTS', 'email-already-exists'],
    [429, 'RATE_LIMIT_EXCEEDED', 'rate-limit'],
    [503, 'SERVICE_UNAVAILABLE', 'unavailable'],
  ] as const)(
    'mapeia %s/%s para erro de cadastro estável',
    async (status, code, expectedCode) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(
              JSON.stringify({
                code,
                correlationId: 'corr-register',
                errors:
                  status === 400
                    ? [{ code: 'invalid', field: 'email', message: 'mensagem externa' }]
                    : undefined,
                message: 'mensagem externa',
                statusCode: status,
              }),
              {
                headers: status === 429 ? { 'Retry-After': '11' } : undefined,
                status,
              },
            ),
        ),
      )

      const result = await register({
        email: 'maria@example.com',
        name: 'Maria Silva',
        password: 'senha-segura',
      })

      expect(result.kind).toBe('error')
      if (result.kind === 'error') {
        expect(result.error.code).toBe(expectedCode)
        expect(result.error.correlationId).toBe('corr-register')
        expect(result.error.retryAfterSeconds).toBe(status === 429 ? 11 : undefined)
        expect(result.error.fieldErrors?.[0]?.message).not.toBe('mensagem externa')
      }
    },
  )

  it('trata uma resposta de sucesso com campo sensível como inválida', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              email: 'maria@example.com',
              id: 'user-1',
              name: 'Maria Silva',
              token: 'segredo',
            }),
            { status: 201 },
          ),
      ),
    )

    await expect(
      register({
        email: 'maria@example.com',
        name: 'Maria Silva',
        password: 'senha-segura',
      }),
    ).resolves.toEqual({ kind: 'failure', reason: 'invalid-response', status: 201 })
  })

  it('converte falha de rede do cadastro sem expor a exceção', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new Error('segredo da infraestrutura'))),
    )

    await expect(
      register({
        email: 'maria@example.com',
        name: 'Maria Silva',
        password: 'senha-segura',
      }),
    ).resolves.toEqual({ kind: 'failure', reason: 'network' })
  })
})
