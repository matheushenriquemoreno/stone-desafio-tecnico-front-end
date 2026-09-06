'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { patchProduct } from '@/features/products/api/products-gateway'
import { ProductForm } from '@/features/products/components/product-form'
import { buildProductPatch } from '@/features/products/product-patch'
import { getProductMutationFeedback } from '@/features/products/product-mutation-feedback'
import type {
  Product,
  ProductFieldError,
  ProductFormValues,
  ProductInput,
  ProductInputField,
} from '@/features/products/types'
import { redirectToLogin } from '@/lib/redirect-to-login'

const genericUpdateError =
  'Não foi possível atualizar o produto. Tente novamente em instantes.'

function productToInput(product: Product): ProductInput {
  return {
    description: product.description,
    imageUrl: product.imageUrl,
    name: product.name,
    price: product.price,
  }
}

function productToFormValues(product: Product): ProductFormValues {
  return {
    description: product.description,
    imageUrl: product.imageUrl,
    name: product.name,
    price: String(product.price),
  }
}

export function ProductEditForm({
  onCancel,
  onNotFound,
  onProductUpdated,
  product,
}: Readonly<{
  onCancel: () => void
  onNotFound: (correlationId?: string) => void
  onProductUpdated: (product: Product) => void
  product: Product
}>) {
  const { replace } = useRouter()
  const [correlationId, setCorrelationId] = useState<string>()
  const [fieldErrors, setFieldErrors] = useState<readonly ProductFieldError[]>([])
  const [generalError, setGeneralError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const initialInput = productToInput(product)

  function clearErrors(field?: ProductInputField) {
    setFieldErrors((current) =>
      field === undefined ? [] : current.filter((error) => error.field !== field),
    )
    setGeneralError(undefined)
    setCorrelationId(undefined)
  }

  async function handleSubmit(currentInput: ProductInput) {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    clearErrors()

    try {
      const patchResult = buildProductPatch(initialInput, currentInput)

      if (patchResult.kind === 'error') {
        setFieldErrors(patchResult.fieldErrors)
        setGeneralError(patchResult.message)
        return
      }

      const result = await patchProduct(product.id, patchResult.patch)

      if (result.kind === 'success') {
        onProductUpdated(result.product)
        return
      }

      if (result.kind === 'error' && result.error.code === 'unauthorized') {
        redirectToLogin({ replace })
        return
      }

      if (result.kind === 'error' && result.error.code === 'not-found') {
        onNotFound(result.error.correlationId)
        return
      }

      if (result.kind === 'error') {
        const feedback = getProductMutationFeedback(
          result.error,
          genericUpdateError,
          'Esta origem não está autorizada a atualizar produtos.',
          'Muitas tentativas de atualização.',
        )
        setFieldErrors(feedback.fieldErrors)
        setGeneralError(feedback.generalMessage)
        setCorrelationId(feedback.correlationId)
        return
      }

      setGeneralError(genericUpdateError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="edit-product-title" className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <h2 id="edit-product-title" className="font-display text-3xl font-semibold">
          Editar produto
        </h2>
        <p className="text-muted-foreground">
          Altere apenas os campos necessários. Os demais permanecem inalterados.
        </p>
      </header>

      <ProductForm
        correlationId={correlationId}
        fieldErrors={fieldErrors}
        generalError={generalError}
        initialValues={productToFormValues(product)}
        isSubmitting={isSubmitting}
        onFieldChange={clearErrors}
        onSubmit={handleSubmit}
        submitLabel="Salvar alterações"
      />

      <Button disabled={isSubmitting} onClick={onCancel} type="button" variant="ghost">
        Cancelar
      </Button>
    </section>
  )
}
