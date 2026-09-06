/* eslint-disable @next/next/no-img-element */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

type MockImageProps = Pick<ComponentProps<'img'>, 'alt' | 'src'> & {
  onError?: () => void
}

vi.mock('next/image', () => ({
  default: ({ alt, onError, src }: MockImageProps) => (
    <img alt={alt ?? ''} data-src={src} onError={() => onError?.()} src={src} />
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

  it('apresenta os dados do produto e a imagem com texto alternativo', () => {
    render(<ProductCard product={product} />)

    expect(screen.getByRole('link', { name: 'Produto principal' })).toHaveAttribute(
      'href',
      '/products/product-1',
    )
    expect(screen.getByText('Produto principal')).toBeInTheDocument()
    expect(screen.getByText('Descrição do produto')).toBeInTheDocument()
    expect(screen.getByText('R$ 99,90')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Imagem de Produto principal' }),
    ).toHaveAttribute('data-src', product.imageUrl)
  })

  it('renderiza uma URL HTTP(S) válida sem depender de allowlist', () => {
    render(<ProductCard product={product} />)

    expect(
      screen.getByRole('img', { name: 'Imagem de Produto principal' }),
    ).toHaveAttribute('data-src', product.imageUrl)
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
