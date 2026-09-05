import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))
const { registerMock } = vi.hoisted(() => ({ registerMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}))

vi.mock('@/features/auth/api/auth-gateway', () => ({
  register: registerMock,
}))

import { RegisterScreen } from '@/features/auth/components/register-screen'

describe('RegisterScreen', () => {
  beforeEach(() => {
    push.mockReset()
    replace.mockReset()
    registerMock.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('expõe os campos nomeados e valida dados próximos aos controles', async () => {
    const user = userEvent.setup()

    render(<RegisterScreen />)
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(screen.getByLabelText('Nome')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
    expect(
      screen.getByText('O nome deve ter entre 2 e 100 caracteres.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(
      screen.getByText('A senha deve ter entre 8 e 128 caracteres.'),
    ).toBeInTheDocument()
    expect(registerMock).not.toHaveBeenCalled()
  })

  it('mostra e-mail duplicado com referência segura sem expor mensagem externa', async () => {
    registerMock.mockResolvedValue({
      error: { code: 'email-already-exists', correlationId: 'corr-register' },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<RegisterScreen />)
    await user.type(screen.getByLabelText('Nome'), 'Maria Silva')
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-segura')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.',
    )
    expect(alert).toHaveTextContent('Referência de suporte: corr-register')
    expect(alert).not.toHaveTextContent('mensagem externa')
    expect(push).not.toHaveBeenCalled()
  })

  it('bloqueia reenvio, limpa a senha e segue ao login somente após sucesso', async () => {
    let resolveRegister:
      | ((value: { kind: 'success'; user: object }) => void)
      | undefined
    registerMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRegister = resolve
        }),
    )
    const user = userEvent.setup()

    render(<RegisterScreen />)
    await user.type(screen.getByLabelText('Nome'), 'Maria Silva')
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-segura')
    const submitButton = screen.getByRole('button', { name: 'Criar conta' })

    await user.click(submitButton)
    expect(submitButton).toBeDisabled()
    expect(registerMock).toHaveBeenCalledOnce()
    expect(push).not.toHaveBeenCalled()

    resolveRegister?.({ kind: 'success', user: {} })
    expect(await screen.findByRole('button', { name: 'Criar conta' })).toBeEnabled()
    expect(screen.getByLabelText('Senha')).toHaveValue('')
    expect(push).toHaveBeenCalledWith('/login?registered=success')
  })

  it('orienta espera no rate limit sem tentar novamente automaticamente', async () => {
    registerMock.mockResolvedValue({
      error: { code: 'rate-limit', retryAfterSeconds: 6 },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<RegisterScreen />)
    await user.type(screen.getByLabelText('Nome'), 'Maria Silva')
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-segura')
    await user.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Aguarde 6 segundos antes de tentar novamente.',
    )
    expect(registerMock).toHaveBeenCalledOnce()
  })
})
