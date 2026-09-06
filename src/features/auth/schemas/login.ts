import { z } from 'zod'

const normalizedEmailSchema = z.string().trim().toLowerCase().pipe(z.email())

export const loginCredentialsSchema = z.strictObject({
  email: normalizedEmailSchema,
  password: z.string().min(8).max(128),
})

export type LoginCredentials = z.infer<typeof loginCredentialsSchema>
