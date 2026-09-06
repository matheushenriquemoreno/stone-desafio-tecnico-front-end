import { z } from 'zod'

import { productInputSchema } from './product-input-schema'

export const productSchema = productInputSchema.extend({
  createdAt: z.iso.datetime(),
  id: z.string().min(1),
  updatedAt: z.iso.datetime(),
})

export const productPageSchema = z.strictObject({
  items: z.array(productSchema),
  nextCursor: z.string().min(1).optional(),
  total: z.number().int().nonnegative(),
})

export type Product = z.infer<typeof productSchema>
export type ProductPage = z.infer<typeof productPageSchema>
