import { z } from 'zod'

import { productInputSchema } from '@/features/products/schemas/product-input-schema'
import type { ProductFieldError, ProductInputField } from '@/features/products/types'

const emptyPatchMessage = 'Altere ao menos um campo do produto.'
const genericPatchMessage = 'Confira os dados informados e tente novamente.'

export const productPatchSchema = productInputSchema
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: emptyPatchMessage,
  })

export type ProductPatch = z.infer<typeof productPatchSchema>

export type ProductPatchResult =
  | Readonly<{ kind: 'success'; patch: ProductPatch }>
  | Readonly<{
      fieldErrors: readonly ProductFieldError[]
      kind: 'error'
      message: string
    }>

const productFields: readonly ProductInputField[] = [
  'name',
  'description',
  'price',
  'imageUrl',
]

function isProductInputField(field: PropertyKey): field is ProductInputField {
  return productFields.includes(field as ProductInputField)
}

function mapPatchIssues(
  issues: readonly { message: string; path: PropertyKey[] }[],
): ProductFieldError[] {
  const errors = new Map<ProductInputField, ProductFieldError>()

  for (const issue of issues) {
    const field = issue.path[0]

    if (isProductInputField(field) && !errors.has(field)) {
      errors.set(field, { code: 'invalid', field, message: issue.message })
    }
  }

  return [...errors.values()]
}

function invalidPatchResult(
  issues: readonly { message: string; path: PropertyKey[] }[],
): ProductPatchResult {
  return {
    fieldErrors: mapPatchIssues(issues),
    kind: 'error',
    message: issues.some((issue) => issue.message === emptyPatchMessage)
      ? emptyPatchMessage
      : genericPatchMessage,
  }
}

export function buildProductPatch(
  initial: unknown,
  current: unknown,
): ProductPatchResult {
  const parsedInitial = productInputSchema.safeParse(initial)
  const parsedCurrent = productInputSchema.safeParse(current)

  if (!parsedInitial.success) {
    return invalidPatchResult(parsedInitial.error.issues)
  }

  if (!parsedCurrent.success) {
    return invalidPatchResult(parsedCurrent.error.issues)
  }

  const changedFields = Object.fromEntries(
    productFields.flatMap((field) =>
      parsedInitial.data[field] === parsedCurrent.data[field]
        ? []
        : [[field, parsedCurrent.data[field]]],
    ),
  )
  const parsedPatch = productPatchSchema.safeParse(changedFields)

  if (!parsedPatch.success) {
    return invalidPatchResult(parsedPatch.error.issues)
  }

  return { kind: 'success', patch: parsedPatch.data }
}
