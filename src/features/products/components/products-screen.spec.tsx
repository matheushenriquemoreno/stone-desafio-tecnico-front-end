import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getSearchParam, push, replace } = vi.hoisted(() => ({
  getSearchParam: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}))
const { listProductsMock } = vi.hoisted(() => ({ listProductsMock: vi.fn() }))
const router = { push, replace }

vi.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => ({ get: getSearchParam }),
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
    getSearchParam.mockReturnValue(null)
    push.mockReset()
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
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Sua sessão não está mais disponível. Redirecionando para o login…',
    )
    expect(screen.queryByText('mensagem externa')).not.toBeInTheDocument()
  })

  it('remove conteúdo protegido anterior antes de redirecionar após nova leitura 401', async () => {
    listProductsMock
      .mockResolvedValueOnce({ kind: 'success', page: productPage })
      .mockResolvedValueOnce({
        error: { code: 'unauthorized', status: 401 },
        kind: 'error',
      })

    const { rerender } = render(<ProductsScreen key="first-read" />)

    expect(await screen.findByText('Produto principal')).toBeVisible()
    replace.mockReset()

    rerender(<ProductsScreen key="expired-read" />)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
    expect(screen.queryByText('Produto principal')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Sua sessão não está mais disponível. Redirecionando para o login…',
    )
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
    expect(screen.getByRole('link', { name: 'Criar produto' })).toHaveAttribute(
      'href',
      '/products/new',
    )
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
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Produto principal')).toBeInTheDocument()
    expect(listProductsMock).toHaveBeenCalledTimes(2)
  })

  it('avança, retorna apenas por cursores visitados e bloqueia saltos inéditos', async () => {
    const pageOne = { ...productPage, nextCursor: 'cursor-one' }
    const pageTwo = {
      ...productPage,
      items: [{ ...productPage.items[0], id: 'product-2', name: 'Produto dois' }],
      nextCursor: 'cursor-two',
    }
    const pageThree = {
      ...productPage,
      items: [{ ...productPage.items[0], id: 'product-3', name: 'Produto três' }],
    }
    listProductsMock
      .mockResolvedValueOnce({ kind: 'success', page: pageOne })
      .mockResolvedValueOnce({ kind: 'success', page: pageTwo })
      .mockResolvedValueOnce({ kind: 'success', page: pageThree })
      .mockResolvedValueOnce({ kind: 'success', page: pageTwo })
      .mockResolvedValueOnce({ kind: 'success', page: pageOne })
    const user = userEvent.setup()

    render(<ProductsScreen />)

    expect(await screen.findByText('Produto principal')).toBeVisible()
    expect(screen.getByText('Página 1')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await waitFor(() => expect(listProductsMock).toHaveBeenCalledTimes(2))
    expect(listProductsMock.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({ cursor: 'cursor-one' }),
    )
    expect(await screen.findByText('Produto dois')).toBeVisible()
    expect(screen.getByText('Página 2')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await waitFor(() => expect(listProductsMock).toHaveBeenCalledTimes(3))
    expect(listProductsMock.mock.calls[2]?.[0]).toEqual(
      expect.objectContaining({ cursor: 'cursor-two' }),
    )
    expect(await screen.findByText('Produto três')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    await waitFor(() => expect(listProductsMock).toHaveBeenCalledTimes(4))
    expect(listProductsMock.mock.calls[3]?.[0]).toEqual(
      expect.objectContaining({ cursor: 'cursor-one' }),
    )
    expect(await screen.findByText('Produto dois')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Anterior' }))
    await waitFor(() => expect(listProductsMock).toHaveBeenCalledTimes(5))
    expect(listProductsMock.mock.calls[4]?.[0]).not.toHaveProperty('cursor')
    expect(await screen.findByText('Produto principal')).toBeVisible()
    expect(screen.getByText('Página 1')).toBeVisible()
  })

  it('publica somente a posição humana ao navegar', async () => {
    listProductsMock.mockResolvedValue({
      kind: 'success',
      page: { ...productPage, nextCursor: 'opaque/cursor' },
    })
    const user = userEvent.setup()

    render(<ProductsScreen />)
    await screen.findByText('Produto principal')

    await user.click(screen.getByRole('button', { name: 'Próxima' }))

    expect(push).toHaveBeenCalledWith('/?page=2')
    expect(push.mock.calls[0]?.[0]).not.toContain('cursor')
  })

  it('canonicaliza um deep link impossível e carrega a primeira página sem cursor', async () => {
    getSearchParam.mockReturnValue('2')
    listProductsMock.mockResolvedValue({ kind: 'success', page: productPage })

    render(<ProductsScreen />)

    await screen.findByText('Produto principal')

    expect(replace).toHaveBeenCalledWith('/')
    expect(listProductsMock.mock.calls[0]?.[0]).not.toHaveProperty('cursor')
  })

  it('descarta a pilha quando a URL diverge para uma posição não visitada', async () => {
    const pageOne = { ...productPage, nextCursor: 'cursor-one' }
    const pageTwo = {
      ...productPage,
      items: [{ ...productPage.items[0], id: 'product-2', name: 'Produto dois' }],
    }
    listProductsMock
      .mockResolvedValueOnce({ kind: 'success', page: pageOne })
      .mockResolvedValueOnce({ kind: 'success', page: pageTwo })
      .mockResolvedValueOnce({ kind: 'success', page: pageOne })
    const user = userEvent.setup()
    const rendered = render(<ProductsScreen />)

    await screen.findByText('Produto principal')
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Produto dois')

    getSearchParam.mockReturnValue('2')
    rendered.rerender(<ProductsScreen />)
    getSearchParam.mockReturnValue('3')
    rendered.rerender(<ProductsScreen />)

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'))
    await waitFor(() => expect(listProductsMock).toHaveBeenCalledTimes(3))
    expect(listProductsMock.mock.calls[2]?.[0]).not.toHaveProperty('cursor')
    expect(await screen.findByText('Produto principal')).toBeVisible()
  })

  it('sincroniza voltar e avançar do navegador somente com posições visitadas', async () => {
    const pageOne = { ...productPage, nextCursor: 'cursor-one' }
    const pageTwo = {
      ...productPage,
      items: [{ ...productPage.items[0], id: 'product-2', name: 'Produto dois' }],
    }
    listProductsMock
      .mockResolvedValueOnce({ kind: 'success', page: pageOne })
      .mockResolvedValueOnce({ kind: 'success', page: pageTwo })
      .mockResolvedValueOnce({ kind: 'success', page: pageOne })
      .mockResolvedValueOnce({ kind: 'success', page: pageTwo })
    const user = userEvent.setup()

    const rendered = render(<ProductsScreen />)
    await screen.findByText('Produto principal')
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await screen.findByText('Produto dois')

    getSearchParam.mockReturnValue('2')
    rendered.rerender(<ProductsScreen />)

    getSearchParam.mockReturnValue(null)
    rendered.rerender(<ProductsScreen />)
    await waitFor(() => expect(listProductsMock).toHaveBeenCalledTimes(3))
    expect(listProductsMock.mock.calls[2]?.[0]).not.toHaveProperty('cursor')
    expect(await screen.findByText('Produto principal')).toBeVisible()

    getSearchParam.mockReturnValue('2')
    rendered.rerender(<ProductsScreen />)
    await waitFor(() => expect(listProductsMock).toHaveBeenCalledTimes(4))
    expect(listProductsMock.mock.calls[3]?.[0]).toEqual(
      expect.objectContaining({ cursor: 'cursor-one' }),
    )
    expect(await screen.findByText('Produto dois')).toBeVisible()
  })

  it('descarta a sequência quando o cursor deixa de ser válido e reinicia sem cursor', async () => {
    const pageOne = { ...productPage, nextCursor: 'cursor-one' }
    listProductsMock
      .mockResolvedValueOnce({ kind: 'success', page: pageOne })
      .mockResolvedValueOnce({
        error: { code: 'validation', status: 400 },
        kind: 'error',
      })
      .mockResolvedValueOnce({ kind: 'success', page: pageOne })
    const user = userEvent.setup()

    render(<ProductsScreen />)
    await screen.findByText('Produto principal')
    await user.click(screen.getByRole('button', { name: 'Próxima' }))

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/'))
    await waitFor(() => expect(listProductsMock).toHaveBeenCalledTimes(3))
    expect(listProductsMock.mock.calls[2]?.[0]).not.toHaveProperty('cursor')
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
