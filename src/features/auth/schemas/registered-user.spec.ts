import { describe, expect, it } from 'vitest'

import { registeredUserSchema } from '@/features/auth/schemas/registered-user'

describe('registeredUserSchema', () => {
  it('aceita somente os dados públicos do usuário criado', () => {
    expect(
      registeredUserSchema.safeParse({
        email: 'maria@example.com',
        id: 'user-1',
        name: 'Maria Silva',
      }).success,
    ).toBe(true)
  })

  it('rejeita resposta que inclua senha, hash ou token', () => {
    const result = registeredUserSchema.safeParse({
      email: 'maria@example.com',
      id: 'user-1',
      name: 'Maria Silva',
      password: 'senha-secreta',
    })

    expect(result.success).toBe(false)
  })
})
