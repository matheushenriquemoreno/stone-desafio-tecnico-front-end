'use client'

import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
import { register } from '@/features/auth/api/auth-gateway'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { registerSchema } from '@/features/auth/schemas/register'
import type { RegisterFieldError, RegisterResult } from '@/features/auth/types'

type RegisterFormValues = {
  email: string
  name: string
  password: string
}

type RegisterField = keyof RegisterFormValues

const registerFieldOrder = ['name', 'email', 'password'] as const

const initialValues: RegisterFormValues = {
  email: '',
  name: '',
  password: '',
}

const genericRegisterError =
  'Não foi possível concluir o cadastro. Tente novamente em instantes.'

function getValidationErrors(values: RegisterFormValues): RegisterFieldError[] {
  const parsed = registerSchema.safeParse(values)

  if (parsed.success) {
    return []
  }

  const errors = new Map<RegisterField, RegisterFieldError>()

  for (const issue of parsed.error.issues) {
    const field = issue.path[0]

    if (field === 'email' || field === 'name' || field === 'password') {
      errors.set(field, { code: 'invalid', field, message: issue.message })
    }
  }

  return Array.from(errors.values())
}

function getFieldError(
  errors: readonly RegisterFieldError[],
  field: RegisterField,
): RegisterFieldError | undefined {
  return errors.find((error) => error.field === field)
}

function getFirstErrorField(
  errors: readonly RegisterFieldError[],
): RegisterField | undefined {
  return registerFieldOrder.find((field) =>
    errors.some((error) => error.field === field),
  )
}

function getResultError(result: RegisterResult): {
  correlationId?: string
  fieldErrors: readonly RegisterFieldError[]
  generalMessage?: string
} {
  if (result.kind !== 'error') {
    return { fieldErrors: [], generalMessage: genericRegisterError }
  }

  if (result.error.code === 'validation') {
    return {
      fieldErrors: result.error.fieldErrors ?? [],
      ...(result.error.fieldErrors?.length
        ? {}
        : { generalMessage: 'Confira os dados informados e tente novamente.' }),
      ...(result.error.correlationId
        ? { correlationId: result.error.correlationId }
        : {}),
    }
  }

  if (result.error.code === 'email-already-exists') {
    return {
      correlationId: result.error.correlationId,
      fieldErrors: [],
      generalMessage:
        'Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.',
    }
  }

  if (result.error.code === 'rate-limit') {
    const waitMessage =
      result.error.retryAfterSeconds === undefined
        ? ' Aguarde alguns instantes antes de tentar novamente.'
        : ` Aguarde ${result.error.retryAfterSeconds} segundos antes de tentar novamente.`

    return {
      correlationId: result.error.correlationId,
      fieldErrors: [],
      generalMessage: `Muitas tentativas de cadastro.${waitMessage}`,
    }
  }

  if (result.error.code === 'forbidden') {
    return {
      correlationId: result.error.correlationId,
      fieldErrors: [],
      generalMessage: 'Esta origem não está autorizada a realizar o cadastro.',
    }
  }

  return {
    correlationId: result.error.correlationId,
    fieldErrors: [],
    generalMessage: genericRegisterError,
  }
}

export function RegisterScreen() {
  const router = useRouter()
  const [values, setValues] = useState<RegisterFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<readonly RegisterFieldError[]>([])
  const [generalError, setGeneralError] = useState<string>()
  const [correlationId, setCorrelationId] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRefs = useRef<Record<RegisterField, HTMLInputElement | null>>({
    email: null,
    name: null,
    password: null,
  })
  const fieldToFocus = useRef<RegisterField | undefined>(undefined)

  useEffect(() => {
    const field = fieldToFocus.current

    if (!field) {
      return
    }

    fieldToFocus.current = undefined
    inputRefs.current[field]?.focus()
  }, [fieldErrors])

  function updateField(field: RegisterField, value: string) {
    fieldToFocus.current = undefined
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => current.filter((error) => error.field !== field))
    setGeneralError(undefined)
    setCorrelationId(undefined)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const localErrors = getValidationErrors(values)

    if (localErrors.length > 0) {
      fieldToFocus.current = getFirstErrorField(localErrors)
      setFieldErrors(localErrors)
      setGeneralError(undefined)
      setCorrelationId(undefined)
      return
    }

    setIsSubmitting(true)
    setFieldErrors([])
    setGeneralError(undefined)
    setCorrelationId(undefined)

    try {
      const result = await register(values)

      if (result.kind === 'success') {
        setValues(initialValues)
        router.push('/login?registered=success')
        return
      }

      const mappedError = getResultError(result)
      fieldToFocus.current = getFirstErrorField(mappedError.fieldErrors)
      setFieldErrors(mappedError.fieldErrors)
      setGeneralError(mappedError.generalMessage)
      setCorrelationId(mappedError.correlationId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const nameError = getFieldError(fieldErrors, 'name')
  const emailError = getFieldError(fieldErrors, 'email')
  const passwordError = getFieldError(fieldErrors, 'password')

  return (
    <AuthShell
      description="Crie sua conta para acessar e gerenciar o catálogo de produtos."
      eyebrow="Novo cadastro"
      footer={
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Já possui uma conta?{' '}
          <Link
            className="font-semibold text-link underline-offset-4 hover:underline"
            href="/login"
          >
            Entre agora
          </Link>
        </p>
      }
      title="Crie sua conta"
    >
      <form
        noValidate
        aria-busy={isSubmitting}
        className="flex flex-col gap-6"
        onSubmit={handleSubmit}
      >
        {generalError && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível criar sua conta</AlertTitle>
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
          <Field data-invalid={nameError !== undefined}>
            <FieldLabel htmlFor="register-name">Nome</FieldLabel>
            <FieldContent>
              <Input
                aria-describedby={nameError ? 'register-name-error' : undefined}
                aria-invalid={nameError !== undefined}
                autoComplete="name"
                disabled={isSubmitting}
                id="register-name"
                name="name"
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Maria Silva"
                ref={(element) => {
                  inputRefs.current.name = element
                }}
                type="text"
                value={values.name}
              />
              <FieldError
                id="register-name-error"
                errors={nameError ? [nameError] : undefined}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={emailError !== undefined}>
            <FieldLabel htmlFor="register-email">E-mail</FieldLabel>
            <FieldContent>
              <Input
                aria-describedby={emailError ? 'register-email-error' : undefined}
                aria-invalid={emailError !== undefined}
                autoComplete="email"
                disabled={isSubmitting}
                id="register-email"
                inputMode="email"
                name="email"
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="voce@empresa.com"
                ref={(element) => {
                  inputRefs.current.email = element
                }}
                type="email"
                value={values.email}
              />
              <FieldError
                id="register-email-error"
                errors={emailError ? [emailError] : undefined}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={passwordError !== undefined}>
            <FieldLabel htmlFor="register-password">Senha</FieldLabel>
            <FieldContent>
              <Input
                aria-describedby={passwordError ? 'register-password-error' : undefined}
                aria-invalid={passwordError !== undefined}
                autoComplete="new-password"
                disabled={isSubmitting}
                id="register-password"
                name="password"
                onChange={(event) => updateField('password', event.target.value)}
                ref={(element) => {
                  inputRefs.current.password = element
                }}
                type="password"
                value={values.password}
              />
              <FieldError
                id="register-password-error"
                errors={passwordError ? [passwordError] : undefined}
              />
            </FieldContent>
          </Field>
        </FieldGroup>

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Cadastrando…' : 'Criar conta'}
        </Button>
      </form>
    </AuthShell>
  )
}
