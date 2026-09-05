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
    vi.unstubAllEnvs()
  })

  it('apresenta os dados do produto e a imagem com texto alternativo', () => {
    vi.stubEnv('NEXT_PUBLIC_IMAGE_ORIGINS', 'https://images.example.com')

    render(<ProductCard product={product} />)

    expect(screen.getByText('Produto principal')).toBeInTheDocument()
    expect(screen.getByText('Descrição do produto')).toBeInTheDocument()
    expect(screen.getByText('R$ 99,90')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Imagem de Produto principal' }),
    ).toHaveAttribute('data-src', product.imageUrl)
  })

  it('troca uma imagem permitida que falhou pelo fallback acessível', () => {
    vi.stubEnv('NEXT_PUBLIC_IMAGE_ORIGINS', 'https://images.example.com')

    render(<ProductCard product={product} />)
    fireEvent.error(screen.getByRole('img', { name: 'Imagem de Produto principal' }))

    expect(
      screen.getByRole('img', {
        name: 'Imagem indisponível: Imagem de Produto principal',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Imagem indisponível')).toBeInTheDocument()
  })

  it('mantém o cartão compreensível quando a origem não é permitida', () => {
    vi.stubEnv('NEXT_PUBLIC_IMAGE_ORIGINS', 'https://other.example.com')

    render(<ProductCard product={product} />)

    expect(
      screen.queryByRole('img', { name: 'Imagem de Produto principal' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('img', {
        name: 'Imagem indisponível: Imagem de Produto principal',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('Produto principal')).toBeInTheDocument()
  })
})
