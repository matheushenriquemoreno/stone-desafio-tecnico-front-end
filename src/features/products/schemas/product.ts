import { z } from 'zod'

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  const representation = value.toString().toLowerCase()
  const [coefficient = representation, exponentText] = representation.split('e')
  const fractionalDigits = coefficient.split('.')[1]?.length ?? 0

  if (exponentText === undefined) {
    return fractionalDigits <= 2
  }

  return fractionalDigits - Number(exponentText) <= 2
}

const httpUrlSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  })

const productSchema = z.strictObject({
  createdAt: z.iso.datetime(),
  description: z.string().min(1).max(500),
  id: z.string().min(1),
  imageUrl: httpUrlSchema,
  name: z.string().min(2).max(100),
  price: z.number().finite().positive().refine(hasAtMostTwoDecimalPlaces),
  updatedAt: z.iso.datetime(),
})

export const productPageSchema = z.strictObject({
  items: z.array(productSchema),
  nextCursor: z.string().min(1).optional(),
  total: z.number().int().nonnegative(),
})

export { productSchema }

export type Product = z.infer<typeof productSchema>
export type ProductPage = z.infer<typeof productPageSchema>
