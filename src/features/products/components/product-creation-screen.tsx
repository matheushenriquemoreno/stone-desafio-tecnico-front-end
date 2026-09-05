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

function getCreationError(
  result: Extract<Awaited<ReturnType<typeof createProduct>>, { kind: 'error' }>,
): {
  correlationId?: string
  fieldErrors: readonly ProductFieldError[]
  generalMessage?: string
} {
  if (result.error.code === 'validation') {
    return {
      correlationId: result.error.correlationId,
      fieldErrors: result.error.fieldErrors ?? [],
      generalMessage: result.error.fieldErrors?.length
        ? undefined
        : 'Confira os dados informados e tente novamente.',
    }
  }

  if (result.error.code === 'forbidden') {
    return {
      correlationId: result.error.correlationId,
      fieldErrors: [],
      generalMessage: 'Esta origem não está autorizada a criar produtos.',
    }
  }

  if (result.error.code === 'rate-limit') {
    return {
      correlationId: result.error.correlationId,
      fieldErrors: [],
      generalMessage:
        result.error.retryAfterSeconds === undefined
          ? 'Muitas tentativas de criação. Aguarde alguns instantes antes de tentar novamente.'
          : `Muitas tentativas de criação. Aguarde ${result.error.retryAfterSeconds} segundos antes de tentar novamente.`,
    }
  }

  return {
    correlationId: result.error.correlationId,
    fieldErrors: [],
    generalMessage: genericCreationError,
  }
}

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
        const mappedError = getCreationError(result)
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
