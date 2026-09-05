import { describe, expect, it } from 'vitest'

import { registerSchema } from '@/features/auth/schemas/register'

describe('registerSchema', () => {
  it('normaliza nome e e-mail, mas preserva a senha', () => {
    const result = registerSchema.safeParse({
      email: '  Maria@Example.com ',
      name: '  Maria Silva  ',
      password: ' senha-segura ',
    })

    expect(result).toEqual({
      success: true,
      data: {
        email: 'maria@example.com',
        name: 'Maria Silva',
        password: ' senha-segura ',
      },
    })
  })

  it('aceita os limites inferiores e superiores do contrato', () => {
    const result = registerSchema.safeParse({
      email: 'a@example.com',
      name: `${'a'.repeat(100)}`,
      password: 'a'.repeat(128),
    })

    expect(result.success).toBe(true)

    const lowerBoundary = registerSchema.safeParse({
      email: 'a@example.com',
      name: 'Al',
      password: '12345678',
    })

    expect(lowerBoundary.success).toBe(true)
  })

  it.each([
    ['name', { email: 'a@example.com', name: 'A', password: '12345678' }],
    ['name', { email: 'a@example.com', name: 'a'.repeat(101), password: '12345678' }],
    ['email', { email: 'invalido', name: 'Ana', password: '12345678' }],
    ['password', { email: 'a@example.com', name: 'Ana', password: '1234567' }],
    ['password', { email: 'a@example.com', name: 'Ana', password: 'a'.repeat(129) }],
  ] as const)('associa entrada inválida ao campo %s', (field, input) => {
    const result = registerSchema.safeParse(input)

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true)
    }
  })

  it('preserva mensagens específicas do cadastro e rejeita propriedades desconhecidas', () => {
    const result = registerSchema.safeParse({
      email: 'invalido',
      name: 'A',
      password: 'curta',
      role: 'admin',
    })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'O nome deve ter entre 2 e 100 caracteres.',
            path: ['name'],
          }),
          expect.objectContaining({
            message: 'Informe um e-mail válido.',
            path: ['email'],
          }),
          expect.objectContaining({
            message: 'A senha deve ter entre 8 e 128 caracteres.',
            path: ['password'],
          }),
          expect.objectContaining({ path: [] }),
        ]),
      )
    }
  })
})
