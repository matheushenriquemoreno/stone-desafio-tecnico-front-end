/* eslint-disable @next/next/no-img-element */

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))
const { getProductMock, patchProductMock } = vi.hoisted(() => ({
  getProductMock: vi.fn(),
  patchProductMock: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('@/features/products/api/products-gateway', () => ({
  getProduct: getProductMock,
  patchProduct: patchProductMock,
}))

vi.mock('next/image', () => ({
  default: ({ alt, src }: { alt?: string; src: string }) => (
    <img alt={alt ?? ''} src={src} />
  ),
}))

import { ProductDetailScreen } from './product-detail-screen'

const product = {
  createdAt: '2026-09-02T12:00:00.000Z',
  description: 'Descrição do produto',
  id: 'product-1',
  imageUrl: 'https://images.example.com/product.png',
  name: 'Produto principal',
  price: 99.9,
  updatedAt: '2026-09-02T12:00:00.000Z',
}

describe('ProductDetailScreen', () => {
  beforeEach(() => {
    getProductMock.mockReset()
    patchProductMock.mockReset()
    replace.mockReset()
    vi.stubEnv('NEXT_PUBLIC_IMAGE_ORIGINS', 'https://images.example.com')
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  it('confirma criação após leitura validada e consome somente o sinal público', async () => {
    getProductMock.mockResolvedValue({ kind: 'success', product })

    render(<ProductDetailScreen productId={product.id} showCreatedConfirmation />)

    expect(
      await screen.findByRole('heading', { name: 'Produto principal' }),
    ).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Produto criado')
    expect(screen.getByText('R$ 99,90')).toBeVisible()
    expect(replace).not.toHaveBeenCalled()
    expect(getProductMock).toHaveBeenCalledWith(product.id, expect.any(AbortSignal))
  })

  it('substitui o conteúdo por não encontrado e oferece retorno seguro', async () => {
    getProductMock.mockResolvedValue({
      error: { code: 'not-found', correlationId: 'corr-not-found', status: 404 },
      kind: 'error',
    })

    render(<ProductDetailScreen productId="gone-product" />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Produto não encontrado')
    expect(screen.getByRole('alert')).toHaveTextContent('Referência: corr-not-found')
    expect(screen.getByRole('link', { name: 'Voltar ao catálogo' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.queryByText('Produto principal')).not.toBeInTheDocument()
  })

  it('redireciona em sessão expirada sem preservar produto anterior', async () => {
    getProductMock.mockResolvedValue({
      error: { code: 'unauthorized', status: 401 },
      kind: 'error',
    })

    render(<ProductDetailScreen productId="expired-product" />)

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Sua sessão não está mais disponível. Redirecionando para o login…',
    )
    expect(screen.queryByText('Produto principal')).not.toBeInTheDocument()
  })

  it('mostra rate limit com referência e permite retry manual de falha de rede', async () => {
    getProductMock
      .mockResolvedValueOnce({
        error: {
          code: 'rate-limit',
          correlationId: 'corr-detail-rate-limit',
          retryAfterSeconds: 8,
          status: 429,
        },
        kind: 'error',
      })
      .mockResolvedValueOnce({ kind: 'failure', reason: 'network' })
      .mockResolvedValueOnce({ kind: 'success', product })
    const user = userEvent.setup()

    render(<ProductDetailScreen productId={product.id} />)

    const rateLimitAlert = await screen.findByRole('alert')
    expect(rateLimitAlert).toHaveTextContent('Aguarde 8 segundos')
    expect(rateLimitAlert).toHaveTextContent('Referência: corr-detail-rate-limit')

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar',
    )
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(
      await screen.findByRole('heading', { name: 'Produto principal' }),
    ).toBeVisible()
    expect(getProductMock).toHaveBeenCalledTimes(3)
  })

  it('edita somente o campo alterado, atualiza o detalhe e confirma o sucesso', async () => {
    const updatedProduct = { ...product, name: 'Produto atualizado' }
    getProductMock.mockResolvedValue({ kind: 'success', product })
    patchProductMock.mockResolvedValue({ kind: 'success', product: updatedProduct })
    const user = userEvent.setup()

    render(<ProductDetailScreen productId={product.id} />)
    await user.click(await screen.findByRole('button', { name: 'Editar produto' }))
    const nameInput = screen.getByLabelText('Nome')
    await user.clear(nameInput)
    await user.type(nameInput, 'Produto atualizado')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    await vi.waitFor(() =>
      expect(patchProductMock).toHaveBeenCalledWith(product.id, {
        name: 'Produto atualizado',
      }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Produto atualizado' }),
    ).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Produto atualizado')
  })

  it('impede salvar sem alteração e preserva os dados editáveis', async () => {
    getProductMock.mockResolvedValue({ kind: 'success', product })
    const user = userEvent.setup()

    render(<ProductDetailScreen productId={product.id} />)
    await user.click(await screen.findByRole('button', { name: 'Editar produto' }))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Altere ao menos um campo do produto.',
    )
    expect(screen.getByLabelText('Nome')).toHaveValue(product.name)
    expect(patchProductMock).not.toHaveBeenCalled()
  })

  it('mostra erro de validação seguro e mantém o valor corrigível', async () => {
    getProductMock.mockResolvedValue({ kind: 'success', product })
    patchProductMock.mockResolvedValue({
      error: {
        code: 'validation',
        correlationId: 'corr-update',
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

    render(<ProductDetailScreen productId={product.id} />)
    await user.click(await screen.findByRole('button', { name: 'Editar produto' }))
    const nameInput = screen.getByLabelText('Nome')
    await user.clear(nameInput)
    await user.type(nameInput, 'Produto rejeitado')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('O nome deve ter entre 2 e 100 caracteres.')
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Referência de suporte: corr-update',
    )
    expect(screen.getByLabelText('Nome')).toHaveValue('Produto rejeitado')
    expect(screen.getByLabelText('Nome')).toHaveFocus()
  })

  it('trata produto removido durante a edição sem manter ações obsoletas', async () => {
    getProductMock.mockResolvedValue({ kind: 'success', product })
    patchProductMock.mockResolvedValue({
      error: { code: 'not-found', correlationId: 'corr-gone', status: 404 },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<ProductDetailScreen productId={product.id} />)
    await user.click(await screen.findByRole('button', { name: 'Editar produto' }))
    await user.clear(screen.getByLabelText('Nome'))
    await user.type(screen.getByLabelText('Nome'), 'Produto removido')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Produto não encontrado')
    expect(screen.getByRole('alert')).toHaveTextContent('Referência: corr-gone')
    expect(
      screen.queryByRole('button', { name: 'Editar produto' }),
    ).not.toBeInTheDocument()
  })
})
