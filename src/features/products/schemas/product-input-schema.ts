import { z } from 'zod'

import { parseProductPriceInput } from '@/features/products/format-product-price'

const productNameSchema = z
  .string({ error: 'Informe o nome do produto.' })
  .trim()
  .min(2, 'O nome deve ter entre 2 e 100 caracteres.')
  .max(100, 'O nome deve ter entre 2 e 100 caracteres.')

const productDescriptionSchema = z
  .string({ error: 'Informe a descrição do produto.' })
  .trim()
  .min(1, 'A descrição deve ter entre 1 e 500 caracteres.')
  .max(500, 'A descrição deve ter entre 1 e 500 caracteres.')

const productPriceSchema = z
  .number({ error: 'Informe um preço válido.' })
  .finite('Informe um preço válido.')
  .positive('O preço deve ser maior que zero e ter até duas casas decimais.')
  .refine((value) => {
    const representation = value.toString().toLowerCase()
    const [coefficient = representation, exponentText] = representation.split('e')
    const fractionalDigits = coefficient.split('.')[1]?.length ?? 0

    if (exponentText === undefined) {
      return fractionalDigits <= 2
    }

    return fractionalDigits - Number(exponentText) <= 2
  }, 'O preço deve ser maior que zero e ter até duas casas decimais.')

const productImageUrlSchema = z
  .string({ error: 'Informe a URL da imagem.' })
  .trim()
  .min(1, 'A URL da imagem deve usar HTTP(S) e ter até 2048 caracteres.')
  .max(2048, 'A URL da imagem deve usar HTTP(S) e ter até 2048 caracteres.')
  .refine((value) => {
    try {
      const url = new URL(value)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }, 'A URL da imagem deve usar HTTP(S) e ter até 2048 caracteres.')

const productFormPriceSchema = z
  .string({ error: 'Informe o preço.' })
  .trim()
  .min(1, 'Informe o preço.')
  .refine(
    (value) => productPriceSchema.safeParse(parseProductPriceInput(value)).success,
    'Informe um preço válido ou use até duas casas decimais.',
  )
  .transform(parseProductPriceInput)

export const productInputSchema = z.strictObject({
  description: productDescriptionSchema,
  imageUrl: productImageUrlSchema,
  name: productNameSchema,
  price: productPriceSchema,
})

const productFormSchema = z.strictObject({
  description: productDescriptionSchema,
  imageUrl: productImageUrlSchema,
  name: productNameSchema,
  price: productFormPriceSchema,
})

export { productFormSchema }

export type ProductInput = z.infer<typeof productInputSchema>
export type ProductFormValues = z.input<typeof productFormSchema>
