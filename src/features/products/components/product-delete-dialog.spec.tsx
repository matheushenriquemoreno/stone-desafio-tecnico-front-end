import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductDeleteDialog } from './product-delete-dialog'

describe('ProductDeleteDialog', () => {
  afterEach(() => {
    cleanup()
  })

  it('abre confirmação acessível com o nome do produto e inicia somente ao confirmar', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    render(
      <ProductDeleteDialog onConfirm={onConfirm} productName="Produto principal" />,
    )

    await user.click(screen.getByRole('button', { name: 'Excluir produto' }))

    expect(screen.getByRole('alertdialog')).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Excluir produto?' })).toBeVisible()
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Produto principal')
    expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus()
    expect(onConfirm).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Excluir produto' }))

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('cancela com botão ou Escape sem acionar a confirmação e devolve o foco', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    render(
      <ProductDeleteDialog onConfirm={onConfirm} productName="Produto principal" />,
    )

    const trigger = screen.getByRole('button', { name: 'Excluir produto' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.click(trigger)
    await user.keyboard('{Escape}')

    expect(onConfirm).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('desabilita cancelamento e confirmação durante a exclusão', async () => {
    const onConfirm = vi.fn()

    render(
      <ProductDeleteDialog
        isConfirming
        onConfirm={onConfirm}
        productName="Produto principal"
      />,
    )

    expect(screen.getByRole('button', { name: 'Excluir produto' })).toBeDisabled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
