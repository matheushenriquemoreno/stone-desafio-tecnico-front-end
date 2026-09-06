/* eslint-disable @next/next/no-img-element */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

type MockImageProps = Pick<ComponentProps<'img'>, 'alt' | 'className' | 'src'> & {
  onError?: () => void
}

vi.mock('next/image', () => ({
  default: ({ alt, className, onError, src }: MockImageProps) => (
    <img
      alt={alt ?? ''}
      className={className}
      data-src={src}
      onError={() => onError?.()}
      src={src}
    />
  ),
}))

import { ProductCard } from './product-card'

const product = {
  createdAt: '2026-09-02T12:00:00.000Z',
  description: 'Descrição do produto',
  id: 'product-1',
  imageUrl: 'https://images.example.com/product.png',
  name: 'Produto principal',
  price: 99.9,
  updatedAt: '2026-09-02T12:00:00.000Z',
}

describe('ProductCard', () => {
  afterEach(() => {
    cleanup()
  })

  it('torna o card inteiro um único link acessível para consulta e edição', async () => {
    const user = userEvent.setup()
    render(<ProductCard product={product} />)

    const link = screen.getByRole('link', {
      name: 'Ver e editar Produto principal',
    })

    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(link).toHaveAttribute('href', '/products/product-1')
    expect(screen.getByText('Ver e editar')).toBeVisible()
    expect(screen.getByText('Produto principal')).toBeInTheDocument()
    expect(screen.getByText('Descrição do produto')).toBeInTheDocument()
    expect(screen.getByText('R$ 99,90')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Imagem de Produto principal' }),
    ).toHaveAttribute('data-src', product.imageUrl)

    await user.tab()
    expect(link).toHaveFocus()
  })

  it('codifica o identificador do produto no destino do card', () => {
    render(<ProductCard product={{ ...product, id: 'produto/com espaço' }} />)

    expect(
      screen.getByRole('link', { name: 'Ver e editar Produto principal' }),
    ).toHaveAttribute('href', '/products/produto%2Fcom%20espa%C3%A7o')
  })

  it('preserva a imagem completa sem depender de allowlist', () => {
    render(<ProductCard product={product} />)

    const image = screen.getByRole('img', { name: 'Imagem de Produto principal' })

    expect(image).toHaveAttribute('data-src', product.imageUrl)
    expect(image).toHaveClass('object-contain')
    expect(image).not.toHaveClass('object-cover')
  })

  it('troca uma imagem que falhou pelo fallback acessível', () => {
    render(<ProductCard product={product} />)
    fireEvent.error(screen.getByRole('img', { name: 'Imagem de Produto principal' }))

    expect(
      screen.getByRole('img', {
        name: 'Imagem indisponível: Imagem de Produto principal',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Imagem indisponível')).toBeInTheDocument()
  })
})
