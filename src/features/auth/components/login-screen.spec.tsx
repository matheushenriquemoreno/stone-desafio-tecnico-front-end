import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { push, replace } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}))
const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}))

vi.mock('@/features/auth/api/auth-gateway', () => ({
  login: loginMock,
}))

import { LoginScreen } from '@/features/auth/components/login-screen'

describe('LoginScreen', () => {
  beforeEach(() => {
    push.mockReset()
    replace.mockReset()
    loginMock.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('expõe campos nomeados e mostra erros de validação próximos aos controles', async () => {
    const user = userEvent.setup()

    render(<LoginScreen />)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('E-mail')).toHaveFocus()
    expect(screen.getByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(
      screen.getByText('A senha deve ter entre 8 e 128 caracteres.'),
    ).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('mantém erro de credencial genérico sem apontar qual campo falhou', async () => {
    loginMock.mockResolvedValue({
      error: { code: 'invalid-credentials', correlationId: 'corr-login' },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<LoginScreen />)
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-segura')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'E-mail ou senha inválidos. Confira seus dados e tente novamente.',
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Referência de suporte: corr-login',
    )
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'false')
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'false')
    expect(push).not.toHaveBeenCalled()
  })

  it('bloqueia reenvio enquanto aguarda e navega só após sucesso', async () => {
    let resolveLogin: ((value: { kind: 'success' }) => void) | undefined
    loginMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve
        }),
    )
    const user = userEvent.setup()

    render(<LoginScreen />)
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-segura')
    const submitButton = screen.getByRole('button', { name: 'Entrar' })

    await user.click(submitButton)
    expect(submitButton).toBeDisabled()
    expect(loginMock).toHaveBeenCalledOnce()
    expect(push).not.toHaveBeenCalled()

    resolveLogin?.({ kind: 'success' })
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeEnabled()
    expect(push).toHaveBeenCalledWith('/')
  })

  it('orienta espera quando a API informa rate limit', async () => {
    loginMock.mockResolvedValue({
      error: { code: 'rate-limit', retryAfterSeconds: 7 },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<LoginScreen />)
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-segura')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Aguarde 7 segundos antes de tentar novamente.',
    )
  })

  it('mantém o erro de validação da API associado ao campo', async () => {
    loginMock.mockResolvedValue({
      error: {
        code: 'validation',
        correlationId: 'corr-login-validation',
        fieldErrors: [
          { code: 'invalid', field: 'email', message: 'Informe um e-mail válido.' },
        ],
      },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<LoginScreen />)
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-segura')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(
      screen.getByText('Referência de suporte: corr-login-validation'),
    ).toBeVisible()
    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('E-mail')).toHaveFocus()
    expect(screen.queryByText('mensagem externa')).not.toBeInTheDocument()
  })

  it('usa fallback seguro para origem rejeitada e falha de rede', async () => {
    const user = userEvent.setup()
    render(<LoginScreen />)
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-segura')

    loginMock.mockResolvedValueOnce({
      error: { code: 'forbidden', correlationId: 'corr-forbidden' },
      kind: 'error',
    })
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta origem não está autorizada a realizar o login.',
    )
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Referência de suporte: corr-forbidden',
    )

    loginMock.mockResolvedValueOnce({ kind: 'failure', reason: 'network' })
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir o login. Tente novamente em instantes.',
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent('network')
  })

  it('usa fallback quando o rate limit não informa duração confiável', async () => {
    loginMock.mockResolvedValue({
      error: { code: 'rate-limit', retryAfterSeconds: undefined },
      kind: 'error',
    })
    const user = userEvent.setup()

    render(<LoginScreen />)
    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-segura')
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Aguarde alguns instantes antes de tentar novamente.',
    )
    expect(screen.getByRole('alert')).not.toHaveTextContent('undefined segundos')
  })

  it('confirma cadastro e remove o sinal enumerado da URL', async () => {
    render(<LoginScreen registrationConfirmed />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Sua conta foi criada. Entre com seu e-mail e senha para continuar.',
    )
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login', { scroll: false })
    })
    expect(replace).toHaveBeenCalledOnce()
  })
})
