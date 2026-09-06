import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))
const { createProductMock } = vi.hoisted(() => ({ createProductMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}))

vi.mock('@/features/products/api/products-gateway', () => ({
  createProduct: createProductMock,
}))

import { ProductCreationScreen } from './product-creation-screen'

const product = {
  createdAt: '2026-09-02T12:00:00.000Z',
  description: 'Descrição do produto',
  id: 'product-1',
  imageUrl: 'https://example.com/product.png',
  name: 'Produto principal',
  price: 99.9,
  updatedAt: '2026-09-02T12:00:00.000Z',
}

describe('ProductCreationScreen', () => {
  beforeEach(() => {
    createProductMock.mockReset()
    push.mockReset()
    replace.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('valida campos antes do gateway e foca o primeiro erro', async () => {
    const user = userEvent.setup()

    render(<ProductCreationScreen />)
    await user.click(screen.getByRole('button', { name: 'Criar produto' }))

    expect(screen.getByLabelText('Nome')).toHaveFocus()
    expect(screen.getByText('O nome deve ter entre 2 e 100 caracteres.')).toBeVisible()
    expect(
      screen.getByText('A descrição deve ter entre 1 e 500 caracteres.'),
    ).toBeVisible()
    expect(screen.getByText('Informe o preço.')).toBeVisible()
    expect(
      screen.getByText('A URL da imagem deve usar HTTP(S) e ter até 2048 caracteres.'),
    ).toBeVisible()
    expect(createProductMock).not.toHaveBeenCalled()
  })

  it('formata o preço em Real e não mantém letras no campo', async () => {
    const user = userEvent.setup()

    render(<ProductCreationScreen />)
    const priceInput = screen.getByLabelText('Preço')

    await user.type(priceInput, 'abc9990xyz')

    expect(priceInput).toHaveValue('R$ 99,90')
  })

  it('bloqueia duplo envio e navega somente após criação validada', async () => {
    let resolveCreate:
      | ((value: { kind: 'success'; product: typeof product }) => void)
      | undefined
    createProductMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve
        }),
    )
    const user = userEvent.setup()

    render(<ProductCreationScreen />)
    await user.type(screen.getByLabelText('Nome'), 'Produto principal')
    await user.type(screen.getByLabelText('Descrição'), 'Descrição do produto')
    await user.type(screen.getByLabelText('Preço'), '99.90')
    await user.type(screen.getByLabelText('URL da imagem'), product.imageUrl)

    const submitButton = screen.getByRole('button', { name: 'Criar produto' })
    await user.dblClick(submitButton)

    expect(createProductMock).toHaveBeenCalledOnce()
    expect(createProductMock).toHaveBeenCalledWith({
      description: 'Descrição do produto',
      imageUrl: product.imageUrl,
      name: 'Produto principal',
      price: 99.9,
    })
    expect(submitButton).toBeDisabled()
    expect(push).not.toHaveBeenCalled()

    resolveCreate?.({ kind: 'success', product })

    await vi.waitFor(() =>
      expect(push).toHaveBeenCalledWith('/products/product-1?created=success'),
    )
    expect(screen.getByLabelText('Nome')).toHaveValue('Produto principal')
  })

  it('preserva valores corrigíveis e mostra erro seguro da API', async () => {
    createProductMock.mockResolvedValue({
      error: {
        code: 'validation',
        correlationId: 'corr-create',
        fieldErrors: [
          {
            code: 'invalid',
            field: 'name',
            message: 'O nome deve ter entre 2 e 100 caracteres.',
          },
        ],
      },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<ProductCreationScreen />)
    await user.type(screen.getByLabelText('Nome'), 'Produto principal')
    await user.type(screen.getByLabelText('Descrição'), 'Descrição do produto')
    await user.type(screen.getByLabelText('Preço'), '99.90')
    await user.type(screen.getByLabelText('URL da imagem'), product.imageUrl)
    await user.click(screen.getByRole('button', { name: 'Criar produto' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('O nome deve ter entre 2 e 100 caracteres.')
    expect(screen.getByRole('status')).toHaveTextContent(
      'Referência de suporte: corr-create',
    )
    expect(alert).not.toHaveTextContent('mensagem externa')
    expect(screen.getByLabelText('Nome')).toHaveValue('Produto principal')
    expect(push).not.toHaveBeenCalled()
  })

  it('direciona sessão expirada ao login sem repetir a mutação', async () => {
    createProductMock.mockResolvedValue({
      error: { code: 'unauthorized', status: 401 },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<ProductCreationScreen />)
    await user.type(screen.getByLabelText('Nome'), 'Produto principal')
    await user.type(screen.getByLabelText('Descrição'), 'Descrição do produto')
    await user.type(screen.getByLabelText('Preço'), '99.90')
    await user.type(screen.getByLabelText('URL da imagem'), product.imageUrl)
    await user.click(screen.getByRole('button', { name: 'Criar produto' }))

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
    expect(createProductMock).toHaveBeenCalledOnce()
  })
})
