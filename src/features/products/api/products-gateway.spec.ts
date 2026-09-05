import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { listProducts } from '@/features/products/api/products-gateway'

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
})
