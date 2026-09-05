import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createProduct,
  getProduct,
  listProducts,
} from '@/features/products/api/products-gateway'

const page = {
  items: [
    {
      createdAt: '2026-09-02T12:00:00.000Z',
      description: 'Descrição',
      id: 'product-1',
      imageUrl: 'https://example.com/product.png',
      name: 'Produto',
      price: 99.9,
      updatedAt: '2026-09-02T12:00:00.000Z',
    },
  ],
  nextCursor: 'opaque/+/=',
  total: 1,
}

const product = page.items[0]

describe('products gateway', () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.test'
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(page), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }),
      ),
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

  it('lista a primeira página com limite 20 e resposta tipada', async () => {
    const result = await listProducts()
    const requestUrl = String(vi.mocked(fetch).mock.calls[0]?.[0])

    expect(result).toEqual({ kind: 'success', page })
    expect(new URL(requestUrl).pathname).toBe('/products')
    expect(new URL(requestUrl).search).toBe('?limit=20')
  })

  it('reenvia cursor opaco sem interpretar seu conteúdo', async () => {
    await listProducts({ cursor: 'opaque/+/=' })
    const requestUrl = String(vi.mocked(fetch).mock.calls[0]?.[0])

    expect(new URL(requestUrl).searchParams.get('limit')).toBe('20')
    expect(new URL(requestUrl).searchParams.get('cursor')).toBe('opaque/+/=')
  })

  it('mapeia 401, 429 e schema de resposta inválido', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              code: 'UNAUTHORIZED',
              correlationId: 'corr-products',
              message: 'mensagem externa',
              statusCode: 401,
            }),
            { status: 401 },
          ),
      ),
    )

    await expect(listProducts()).resolves.toEqual({
      error: {
        code: 'unauthorized',
        correlationId: 'corr-products',
        status: 401,
      },
      kind: 'error',
    })

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify({ items: [], total: '1' }), { status: 200 }),
      ),
    )

    await expect(listProducts()).resolves.toEqual({
      kind: 'failure',
      reason: 'invalid-response',
      status: 200,
    })
  })

  it('cria produto com payload público, credenciais e resposta validada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(product), {
            headers: { 'Content-Type': 'application/json' },
            status: 201,
          }),
      ),
    )

    const result = await createProduct({
      description: 'Descrição',
      imageUrl: 'https://example.com/product.png',
      name: 'Produto',
      price: 99.9,
    })

    expect(result).toEqual({ kind: 'success', product })
    expect(vi.mocked(fetch)).toHaveBeenCalledOnce()

    const [requestUrl, requestInit] = vi.mocked(fetch).mock.calls[0] ?? []
    const requestHeaders = new Headers(requestInit?.headers)
    expect(String(requestUrl)).toBe('https://api.example.test/products')
    expect(requestInit?.credentials).toBe('include')
    expect(requestInit?.method).toBe('POST')
    expect(JSON.parse(String(requestInit?.body))).toEqual({
      description: 'Descrição',
      imageUrl: 'https://example.com/product.png',
      name: 'Produto',
      price: 99.9,
    })
    expect(requestHeaders.get('Authorization')).toBeNull()
    expect(requestHeaders.get('X-CSRF-Protection')).toBeNull()
  })

  it('não chama a API quando a entrada de criação é inválida', async () => {
    const result = await createProduct({
      description: '',
      imageUrl: 'javascript:alert(1)',
      name: 'A',
      price: 0,
    })

    expect(result).toEqual({
      error: {
        code: 'validation',
        fieldErrors: [
          {
            code: 'invalid',
            field: 'description',
            message: 'A descrição deve ter entre 1 e 500 caracteres.',
          },
          {
            code: 'invalid',
            field: 'imageUrl',
            message: 'A URL da imagem deve usar HTTP(S) e ter até 2048 caracteres.',
          },
          {
            code: 'invalid',
            field: 'name',
            message: 'O nome deve ter entre 2 e 100 caracteres.',
          },
          {
            code: 'invalid',
            field: 'price',
            message: 'O preço deve ser maior que zero e ter até duas casas decimais.',
          },
        ],
      },
      kind: 'error',
    })
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
  })

  it.each([
    [400, 'VALIDATION_ERROR', 'validation'],
    [401, 'UNAUTHORIZED', 'unauthorized'],
    [403, 'REQUEST_FORBIDDEN', 'forbidden'],
    [429, 'RATE_LIMIT_EXCEEDED', 'rate-limit'],
  ] as const)(
    'mapeia %s sem expor mensagem externa',
    async (status, code, expectedCode) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(
              JSON.stringify({
                code,
                correlationId: 'corr-create',
                errors:
                  status === 400
                    ? [{ code: 'invalid', field: 'name', message: 'mensagem externa' }]
                    : undefined,
                message: 'mensagem externa',
                statusCode: status,
              }),
              {
                headers: status === 429 ? { 'Retry-After': '8' } : undefined,
                status,
              },
            ),
        ),
      )

      const result = await createProduct({
        description: 'Descrição',
        imageUrl: 'https://example.com/product.png',
        name: 'Produto',
        price: 99.9,
      })

      expect(result.kind).toBe('error')
      if (result.kind === 'error') {
        expect(result.error.code).toBe(expectedCode)
        expect(result.error.correlationId).toBe('corr-create')
        expect(JSON.stringify(result)).not.toContain('mensagem externa')
        if (status === 400) {
          expect(result.error.fieldErrors).toEqual([
            {
              code: 'invalid',
              field: 'name',
              message: 'O nome deve ter entre 2 e 100 caracteres.',
            },
          ])
        }
        if (status === 429) {
          expect(result.error.retryAfterSeconds).toBe(8)
        }
      }
      expect(vi.mocked(fetch)).toHaveBeenCalledOnce()
    },
  )

  it('converge resposta de sucesso inválida para falha segura sem retry', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify({ id: 'incompleto' }), { status: 201 }),
      ),
    )

    await expect(
      createProduct({
        description: 'Descrição',
        imageUrl: 'https://example.com/product.png',
        name: 'Produto',
        price: 99.9,
      }),
    ).resolves.toEqual({ kind: 'failure', reason: 'invalid-response', status: 201 })
    expect(vi.mocked(fetch)).toHaveBeenCalledOnce()
  })

  it('lê produto por id codificado e valida a resposta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(JSON.stringify(product), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }),
      ),
    )

    const result = await getProduct('product/id')

    expect(result).toEqual({ kind: 'success', product })
    const [requestUrl, requestInit] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(String(requestUrl)).toBe('https://api.example.test/products/product%2Fid')
    expect(requestInit?.credentials).toBe('include')
    expect(requestInit?.method).toBe('GET')
  })

  it('mapeia produto inexistente sem expor mensagem externa', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              code: 'PRODUCT_NOT_FOUND',
              correlationId: 'corr-detail',
              message: 'mensagem externa',
              statusCode: 404,
            }),
            { status: 404 },
          ),
      ),
    )

    await expect(getProduct('missing-product')).resolves.toEqual({
      error: {
        code: 'not-found',
        correlationId: 'corr-detail',
        status: 404,
      },
      kind: 'error',
    })
  })
})
