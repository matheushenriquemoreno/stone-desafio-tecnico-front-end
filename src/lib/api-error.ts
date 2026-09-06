import { z } from 'zod'

const apiFieldErrorSchema = z
  .object({
    field: z.string().min(1),
    code: z.string().min(1),
    message: z.string().min(1),
  })
  .strict()

export const apiErrorSchema = z
  .object({
    statusCode: z.number().int().nonnegative(),
    code: z.string().min(1),
    message: z.string().min(1),
    correlationId: z.string().min(1).optional(),
    errors: z.array(apiFieldErrorSchema).optional(),
  })
  .strict()

export type ApiFieldError = z.infer<typeof apiFieldErrorSchema>
export type ApiError = z.infer<typeof apiErrorSchema>

export type ApiErrorDetails = ApiError & {
  retryAfterSeconds?: number
}
