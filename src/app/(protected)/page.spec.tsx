import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/features/products/components/products-screen', () => ({
  ProductsScreen: ({ protectedHeader }: { protectedHeader?: ReactNode }) => (
    <>
      {protectedHeader}
      <h1>Stone</h1>
    </>
  ),
}))

vi.mock('@/features/auth/components/logout-button', () => ({
  LogoutButton: () => <button type="button">Sair</button>,
}))

vi.mock('@/features/auth/components/protected-shell', () => ({
  ProtectedHeader: ({ actions }: { actions?: ReactNode }) => (
    <header>
      <nav aria-label="Navegação protegida">{actions}</nav>
    </header>
  ),
}))

import ProtectedHomePage from './page'

describe('ProtectedHomePage', () => {
  it('composes the protected products screen', () => {
    render(<ProtectedHomePage />)

    expect(screen.getByRole('heading', { name: 'Stone' })).toBeVisible()
    expect(screen.getByRole('banner')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeVisible()
  })
})
