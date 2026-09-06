import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }))
const { logoutMock } = vi.hoisted(() => ({ logoutMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

vi.mock('@/features/auth/api/auth-gateway', () => ({
  logout: logoutMock,
}))

import { LogoutButton } from './logout-button'

describe('LogoutButton', () => {
  beforeEach(() => {
    replace.mockReset()
    logoutMock.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('bloqueia reenvio, mostra loading e volta ao login após 204', async () => {
    let resolveLogout: ((value: { kind: 'success' }) => void) | undefined
    logoutMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogout = resolve
        }),
    )
    const user = userEvent.setup()

    render(<LogoutButton />)
    const button = screen.getByRole('button', { name: 'Sair' })

    await user.click(button)

    expect(button).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Saindo…' })).toBeDisabled()
    await user.click(button)
    expect(logoutMock).toHaveBeenCalledOnce()

    resolveLogout?.({ kind: 'success' })

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith('/login'))
  })

  it('mantém feedback seguro e referência em erro da API', async () => {
    logoutMock.mockResolvedValue({
      error: {
        code: 'forbidden',
        correlationId: 'corr-logout',
        status: 403,
      },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<LogoutButton />)
    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta origem não está autorizada a encerrar a sessão.',
    )
    expect(screen.getByText('Referência de suporte: corr-logout')).toBeVisible()
    expect(replace).not.toHaveBeenCalled()
  })

  it('orienta espera após rate limit e não tenta novamente automaticamente', async () => {
    logoutMock.mockResolvedValue({
      error: {
        code: 'rate-limit',
        correlationId: 'corr-rate',
        retryAfterSeconds: 4,
        status: 429,
      },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<LogoutButton />)
    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Muitas tentativas de logout. Aguarde 4 segundos antes de tentar novamente.',
    )
    expect(logoutMock).toHaveBeenCalledOnce()
  })

  it('apresenta fallback seguro para falha de transporte', async () => {
    logoutMock.mockResolvedValue({ kind: 'failure', reason: 'network' })
    const user = userEvent.setup()

    render(<LogoutButton />)
    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível encerrar a sessão. Tente novamente em instantes.',
    )
  })
})
