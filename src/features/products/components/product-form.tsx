'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { formatProductPriceInput } from '@/features/products/format-product-price'
import {
  productFormSchema,
  type ProductFormValues,
  type ProductInput,
} from '@/features/products/schemas/product-input-schema'
import type { ProductFieldError, ProductInputField } from '@/features/products/types'

type ProductFormProps = Readonly<{
  correlationId?: string
  fieldErrors?: readonly ProductFieldError[]
  generalError?: string
  initialValues: ProductFormValues
  isSubmitting?: boolean
  onFieldChange?: (field: ProductInputField) => void
  onSubmit: (input: ProductInput) => void | Promise<void>
  secondaryAction?: ReactNode
  submitLabel: string
}>

const emptyFieldErrors: readonly ProductFieldError[] = []

const productFieldOrder: readonly ProductInputField[] = [
  'name',
  'description',
  'price',
  'imageUrl',
]

function getFirstErrorField(
  errors: readonly ProductFieldError[],
): ProductInputField | undefined {
  return productFieldOrder.find((field) =>
    errors.some((error) => error.field === field),
  )
}

function mapValidationErrors(
  issues: readonly { message: string; path: PropertyKey[] }[],
): ProductFieldError[] {
  const errors = new Map<ProductInputField, ProductFieldError>()

  for (const issue of issues) {
    const field = issue.path[0]

    if (
      field === 'name' ||
      field === 'description' ||
      field === 'price' ||
      field === 'imageUrl'
    ) {
      if (!errors.has(field)) {
        errors.set(field, { code: 'invalid', field, message: issue.message })
      }
    }
  }

  return Array.from(errors.values())
}

function getFieldError(
  errors: readonly ProductFieldError[],
  field: ProductInputField,
): ProductFieldError | undefined {
  return errors.find((error) => error.field === field)
}

export function ProductForm({
  correlationId,
  fieldErrors = emptyFieldErrors,
  generalError,
  initialValues,
  isSubmitting = false,
  onFieldChange,
  onSubmit,
  secondaryAction,
  submitLabel,
}: ProductFormProps) {
  const [values, setValues] = useState<ProductFormValues>(initialValues)
  const [validationErrors, setValidationErrors] = useState<
    readonly ProductFieldError[]
  >([])
  const inputRefs = useRef<
    Record<ProductInputField, HTMLInputElement | HTMLTextAreaElement | null>
  >({
    description: null,
    imageUrl: null,
    name: null,
    price: null,
  })
  useEffect(() => {
    const field = getFirstErrorField(fieldErrors)

    if (field) {
      inputRefs.current[field]?.focus()
    }
  }, [fieldErrors])

  function updateField(field: ProductInputField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setValidationErrors((current) => current.filter((error) => error.field !== field))
    onFieldChange?.(field)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const parsed = productFormSchema.safeParse(values)

    if (!parsed.success) {
      const errors = mapValidationErrors(parsed.error.issues)
      const firstErrorField = getFirstErrorField(errors)

      setValidationErrors(errors)

      if (firstErrorField) {
        inputRefs.current[firstErrorField]?.focus()
      }

      return
    }

    setValidationErrors([])
    await onSubmit(parsed.data)
  }

  const errors = [...fieldErrors, ...validationErrors]
  const nameError = getFieldError(errors, 'name')
  const descriptionError = getFieldError(errors, 'description')
  const priceError = getFieldError(errors, 'price')
  const imageUrlError = getFieldError(errors, 'imageUrl')

  return (
    <form
      noValidate
      aria-busy={isSubmitting}
      className="flex flex-col gap-6"
      onSubmit={handleSubmit}
    >
      {generalError && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível salvar o produto</AlertTitle>
          <AlertDescription>
            <p>{generalError}</p>
            {correlationId && (
              <p className="mt-2">Referência de suporte: {correlationId}</p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {correlationId && !generalError && (
        <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
          Referência de suporte: {correlationId}
        </p>
      )}

      <FieldGroup>
        <Field data-disabled={isSubmitting} data-invalid={nameError !== undefined}>
          <FieldLabel htmlFor="product-name">Nome</FieldLabel>
          <FieldContent>
            <Input
              aria-describedby={nameError ? 'product-name-error' : undefined}
              aria-invalid={nameError !== undefined}
              autoComplete="off"
              disabled={isSubmitting}
              id="product-name"
              maxLength={100}
              onChange={(event) => updateField('name', event.target.value)}
              ref={(element) => {
                inputRefs.current.name = element
              }}
              value={values.name}
            />
            <FieldError
              id="product-name-error"
              errors={nameError ? [nameError] : undefined}
            />
          </FieldContent>
        </Field>

        <Field
          data-disabled={isSubmitting}
          data-invalid={descriptionError !== undefined}
        >
          <FieldLabel htmlFor="product-description">Descrição</FieldLabel>
          <FieldContent>
            <Textarea
              aria-describedby={
                descriptionError ? 'product-description-error' : undefined
              }
              aria-invalid={descriptionError !== undefined}
              disabled={isSubmitting}
              id="product-description"
              maxLength={500}
              onChange={(event) => updateField('description', event.target.value)}
              ref={(element) => {
                inputRefs.current.description = element
              }}
              value={values.description}
            />
            <FieldError
              id="product-description-error"
              errors={descriptionError ? [descriptionError] : undefined}
            />
          </FieldContent>
        </Field>

        <Field data-disabled={isSubmitting} data-invalid={priceError !== undefined}>
          <FieldLabel htmlFor="product-price">Preço</FieldLabel>
          <FieldContent>
            <Input
              aria-describedby={priceError ? 'product-price-error' : undefined}
              aria-invalid={priceError !== undefined}
              autoComplete="off"
              disabled={isSubmitting}
              id="product-price"
              inputMode="numeric"
              onChange={(event) =>
                updateField('price', formatProductPriceInput(event.target.value))
              }
              placeholder="R$ 0,00"
              ref={(element) => {
                inputRefs.current.price = element
              }}
              value={values.price}
            />
            <FieldError
              id="product-price-error"
              errors={priceError ? [priceError] : undefined}
            />
          </FieldContent>
        </Field>

        <Field data-disabled={isSubmitting} data-invalid={imageUrlError !== undefined}>
          <FieldLabel htmlFor="product-image-url">URL da imagem</FieldLabel>
          <FieldContent>
            <Input
              aria-describedby={imageUrlError ? 'product-image-url-error' : undefined}
              aria-invalid={imageUrlError !== undefined}
              autoComplete="url"
              disabled={isSubmitting}
              id="product-image-url"
              inputMode="url"
              maxLength={2048}
              onChange={(event) => updateField('imageUrl', event.target.value)}
              ref={(element) => {
                inputRefs.current.imageUrl = element
              }}
              type="url"
              value={values.imageUrl}
            />
            <FieldError
              id="product-image-url-error"
              errors={imageUrlError ? [imageUrlError] : undefined}
            />
          </FieldContent>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="w-full sm:w-fit" disabled={isSubmitting} type="submit">
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Salvando…' : submitLabel}
        </Button>
        {secondaryAction}
      </div>
    </form>
  )
}
