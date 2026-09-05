'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createProduct } from '@/features/products/api/products-gateway'
import { ProductForm } from '@/features/products/components/product-form'
import { getProductMutationFeedback } from '@/features/products/product-mutation-feedback'
import type {
  ProductFieldError,
  ProductFormValues,
  ProductInput,
  ProductInputField,
} from '@/features/products/types'
import { redirectToLogin } from '@/lib/redirect-to-login'

const emptyProductValues: ProductFormValues = {
  description: '',
  imageUrl: '',
  name: '',
  price: '',
}

const genericCreationError =
  'Não foi possível criar o produto. Tente novamente em instantes.'

export function ProductCreationScreen() {
  const { push, replace } = useRouter()
  const [correlationId, setCorrelationId] = useState<string>()
  const [fieldErrors, setFieldErrors] = useState<readonly ProductFieldError[]>([])
  const [generalError, setGeneralError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  function clearErrors(field?: ProductInputField) {
    setFieldErrors((current) =>
      field === undefined ? [] : current.filter((error) => error.field !== field),
    )
    setGeneralError(undefined)
    setCorrelationId(undefined)
  }

  async function handleSubmit(input: ProductInput) {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    clearErrors()

    try {
      const result = await createProduct(input)

      if (result.kind === 'success') {
        push(`/products/${encodeURIComponent(result.product.id)}?created=success`)
        return
      }

      if (result.kind === 'error' && result.error.code === 'unauthorized') {
        redirectToLogin({ replace })
        return
      }

      if (result.kind === 'error') {
        const mappedError = getProductMutationFeedback(
          result.error,
          genericCreationError,
          'Esta origem não está autorizada a criar produtos.',
        )
        setFieldErrors(mappedError.fieldErrors)
        setGeneralError(mappedError.generalMessage)
        setCorrelationId(mappedError.correlationId)
        return
      }

      setGeneralError(genericCreationError)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      aria-labelledby="new-product-title"
      className="mx-auto max-w-2xl space-y-6"
    >
      <header className="space-y-2">
        <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Catálogo compartilhado
        </p>
        <h1
          id="new-product-title"
          className="font-display text-5xl leading-none font-semibold"
        >
          Novo produto
        </h1>
        <p className="text-muted-foreground">
          Informe os dados públicos do produto para adicioná-lo ao catálogo.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados do produto</CardTitle>
          <CardDescription>Todos os campos são obrigatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm
            correlationId={correlationId}
            fieldErrors={fieldErrors}
            generalError={generalError}
            initialValues={emptyProductValues}
            isSubmitting={isSubmitting}
            onFieldChange={clearErrors}
            onSubmit={handleSubmit}
            submitLabel="Criar produto"
          />
        </CardContent>
      </Card>
    </section>
  )
}
