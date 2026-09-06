import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/products/components/products-screen', () => ({
  ProductsScreen: () => <h1>Stone</h1>,
}))

import ProtectedHomePage from './page'

describe('ProtectedHomePage', () => {
  it('composes the protected products screen', () => {
    render(<ProtectedHomePage />)

    expect(screen.getByRole('heading', { name: 'Stone' })).toBeVisible()
  })
})
