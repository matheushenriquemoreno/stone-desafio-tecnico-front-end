import { z } from 'zod'

const registerNameSchema = z
  .string({ error: 'Informe seu nome.' })
  .trim()
  .min(2, 'O nome deve ter entre 2 e 100 caracteres.')
  .max(100, 'O nome deve ter entre 2 e 100 caracteres.')

const registerEmailSchema = z
  .string({ error: 'Informe seu e-mail.' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Informe um e-mail válido.'))

const registerPasswordSchema = z
  .string({ error: 'Informe sua senha.' })
  .min(8, 'A senha deve ter entre 8 e 128 caracteres.')
  .max(128, 'A senha deve ter entre 8 e 128 caracteres.')

export const registerSchema = z.strictObject({
  name: registerNameSchema,
  email: registerEmailSchema,
  password: registerPasswordSchema,
})

export type RegisterCredentials = z.infer<typeof registerSchema>
