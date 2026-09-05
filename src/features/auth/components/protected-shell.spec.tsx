import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ProtectedShell } from './protected-shell'

describe('ProtectedShell', () => {
  it('oferece navegação protegida e preserva as ações recebidas', () => {
    render(
      <ProtectedShell actions={<button type="button">Sair</button>}>
        <h1>Conteúdo protegido</h1>
      </ProtectedShell>,
    )

    expect(screen.getByRole('banner')).toBeVisible()
    expect(
      screen.getByRole('navigation', { name: 'Navegação protegida' }),
    ).toBeVisible()
    expect(screen.getByRole('link', { name: 'Stone, catálogo' })).toHaveAttribute(
      'href',
      '/',
    )
    expect(screen.getByRole('link', { name: 'Catálogo' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Novo produto' })).toHaveAttribute(
      'href',
      '/products/new',
    )
    expect(screen.getByRole('button', { name: 'Sair' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Conteúdo protegido' })).toBeVisible()
  })
})
