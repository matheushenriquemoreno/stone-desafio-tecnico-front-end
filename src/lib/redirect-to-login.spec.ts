import { describe, expect, it, vi } from 'vitest'

import { redirectToLogin } from './redirect-to-login'

describe('redirectToLogin', () => {
  it('navega ao login sem conhecer a operação que perdeu a sessão', () => {
    const replace = vi.fn()

    redirectToLogin({ replace })

    expect(replace).toHaveBeenCalledOnce()
    expect(replace).toHaveBeenCalledWith('/login')
  })
})
