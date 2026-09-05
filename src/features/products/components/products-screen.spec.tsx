import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))
const { listProductsMock } = vi.hoisted(() => ({ listProductsMock: vi.fn() }))
const router = { replace }

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}))

vi.mock('@/features/products/api/products-gateway', () => ({
  listProducts: listProductsMock,
}))

import { ProductsScreen } from '@/features/products/components/products-screen'

const productPage = {
  items: [
    {
      createdAt: '2026-09-02T12:00:00.000Z',
      description: 'Descrição do produto',
      id: 'product-1',
      imageUrl: 'https://example.com/product.png',
      name: 'Produto principal',
      price: 99.9,
      updatedAt: '2026-09-02T12:00:00.000Z',
    },
  ],
  total: 12,
}

describe('ProductsScreen', () => {
  beforeEach(() => {
    replace.mockReset()
    listProductsMock.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('mostra skeleton durante a leitura e o total após resposta válida', async () => {
    let resolveRequest:
      | ((value: { kind: 'success'; page: typeof productPage }) => void)
      | undefined
    listProductsMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve
        }),
    )

    render(<ProductsScreen />)
    expect(
      screen.getByRole('status', { name: 'Carregando catálogo' }),
    ).toBeInTheDocument()

    resolveRequest?.({ kind: 'success', page: productPage })

    expect(await screen.findByRole('heading', { name: 'Catálogo' })).toBeInTheDocument()
    expect(screen.getByText('12 produtos')).toBeInTheDocument()
    expect(screen.getByText('Produto principal')).toBeInTheDocument()
  })

  it('redireciona para login quando a primeira leitura retorna não autorizado', async () => {
    listProductsMock.mockResolvedValue({
      error: { code: 'unauthorized', status: 401 },
      kind: 'error',
    })

    render(<ProductsScreen />)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
    expect(screen.queryByText('mensagem externa')).not.toBeInTheDocument()
  })

  it('distingue catálogo vazio de erro e preserva o total recebido', async () => {
    listProductsMock.mockResolvedValue({
      kind: 'success',
      page: { items: [], total: 0 },
    })

    render(<ProductsScreen />)

    expect(
      await screen.findByRole('heading', { name: 'Catálogo vazio' }),
    ).toBeInTheDocument()
    expect(screen.getByText('0 produtos')).toBeInTheDocument()
  })

  it('apresenta falha recuperável e permite nova tentativa manual', async () => {
    listProductsMock
      .mockResolvedValueOnce({
        kind: 'failure',
        reason: 'invalid-response',
        status: 200,
      })
      .mockResolvedValueOnce({ kind: 'success', page: productPage })

    render(<ProductsScreen />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o catálogo. Tente novamente em instantes.',
    )
    await userClick(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Produto principal')).toBeInTheDocument()
    expect(listProductsMock).toHaveBeenCalledTimes(2)
  })

  it('aborta a leitura quando a tela é desmontada', async () => {
    let capturedSignal: AbortSignal | undefined
    listProductsMock.mockImplementation(({ signal }: { signal: AbortSignal }) => {
      capturedSignal = signal
      return new Promise(() => undefined)
    })

    const { unmount } = render(<ProductsScreen />)
    await waitFor(() => expect(capturedSignal).toBeDefined())

    unmount()

    expect(capturedSignal?.aborted).toBe(true)
  })
})

async function userClick(element: HTMLElement) {
  element.click()
  await waitFor(() => undefined)
}
