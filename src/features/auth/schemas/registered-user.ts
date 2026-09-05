import { z } from 'zod'

export const registeredUserSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(2).max(100),
  email: z.email(),
})

export type RegisteredUser = z.infer<typeof registeredUserSchema>
