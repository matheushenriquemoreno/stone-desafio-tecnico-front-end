import { StrictMode } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))
const { listProductsMock } = vi.hoisted(() => ({ listProductsMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('@/features/products/api/products-gateway', () => ({
  listProducts: listProductsMock,
}))

import { ProductCreationGate } from './product-creation-gate'

describe('ProductCreationGate', () => {
  beforeEach(() => {
    replace.mockReset()
    listProductsMock.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('confirma a sessão com limit=1 e libera o conteúdo somente após sucesso', async () => {
    listProductsMock.mockResolvedValue({
      kind: 'success',
      page: { items: [{ id: 'probe-only' }], total: 1 },
    })

    render(
      <ProductCreationGate>
        <h1>Novo produto</h1>
      </ProductCreationGate>,
    )

    expect(screen.getByRole('status', { name: 'Confirmando sessão' })).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: 'Novo produto' }),
    ).not.toBeInTheDocument()

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Novo produto' })).toBeVisible(),
    )
    expect(listProductsMock).toHaveBeenCalledOnce()
    expect(listProductsMock.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ limit: 1, signal: expect.any(AbortSignal) }),
    )
  })

  it('não duplica o probe sob Strict Mode', async () => {
    listProductsMock.mockResolvedValue({
      kind: 'success',
      page: { items: [], total: 0 },
    })

    render(
      <StrictMode>
        <ProductCreationGate>
          <p>Formulário liberado</p>
        </ProductCreationGate>
      </StrictMode>,
    )

    await screen.findByText('Formulário liberado')
    expect(listProductsMock).toHaveBeenCalledOnce()
  })

  it('redireciona em sessão inválida e não exibe o formulário', async () => {
    listProductsMock.mockResolvedValue({
      error: { code: 'unauthorized', status: 401 },
      kind: 'error',
    })

    render(
      <ProductCreationGate>
        <h1>Novo produto</h1>
      </ProductCreationGate>,
    )

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Sua sessão não está mais disponível. Redirecionando para o login…',
    )
    expect(
      screen.queryByRole('heading', { name: 'Novo produto' }),
    ).not.toBeInTheDocument()
  })

  it('redireciona quando a API fica indisponível durante a confirmação da sessão', async () => {
    listProductsMock.mockResolvedValueOnce({ kind: 'failure', reason: 'network' })

    render(
      <ProductCreationGate>
        <p>Formulário liberado</p>
      </ProductCreationGate>,
    )

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Sua sessão não está mais disponível. Redirecionando para o login…',
    )
    expect(screen.queryByText('Formulário liberado')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('aborta probe pendente ao desmontar fora do Strict Mode', async () => {
    let signal: AbortSignal | undefined
    listProductsMock.mockImplementation(
      ({ signal: requestSignal }: { signal: AbortSignal }) => {
        signal = requestSignal
        return new Promise(() => undefined)
      },
    )

    const { unmount } = render(
      <ProductCreationGate>
        <p>Formulário liberado</p>
      </ProductCreationGate>,
    )
    await waitFor(() => expect(signal).toBeDefined())

    unmount()

    await waitFor(() => expect(signal?.aborted).toBe(true))
  })
})
