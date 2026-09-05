'use client'

import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
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
import { login } from '@/features/auth/api/auth-gateway'
import { AuthShell } from '@/features/auth/components/auth-shell'
import { loginCredentialsSchema } from '@/features/auth/schemas/login'
import type { AuthFieldError, LoginResult } from '@/features/auth/types'

type LoginFormValues = {
  email: string
  password: string
}

type LoginField = keyof LoginFormValues

const initialValues: LoginFormValues = {
  email: '',
  password: '',
}

const genericLoginError =
  'Não foi possível concluir o login. Tente novamente em instantes.'

function getValidationErrors(values: LoginFormValues): AuthFieldError[] {
  const parsed = loginCredentialsSchema.safeParse(values)

  if (parsed.success) {
    return []
  }

  const fields = new Set<LoginField>()

  for (const issue of parsed.error.issues) {
    const field = issue.path[0]

    if (field === 'email' || field === 'password') {
      fields.add(field)
    }
  }

  return Array.from(fields, (field) => ({
    code: 'invalid',
    field,
    message:
      field === 'email'
        ? 'Informe um e-mail válido.'
        : 'A senha deve ter entre 8 e 128 caracteres.',
  }))
}

function getFieldError(
  errors: readonly AuthFieldError[],
  field: LoginField,
): AuthFieldError | undefined {
  return errors.find((error) => error.field === field)
}

function getResultError(result: LoginResult): {
  correlationId?: string
  fieldErrors: readonly AuthFieldError[]
  generalMessage?: string
} {
  if (result.kind !== 'error') {
    return { fieldErrors: [], generalMessage: genericLoginError }
  }

  if (result.error.code === 'validation') {
    return {
      ...(result.error.correlationId
        ? { correlationId: result.error.correlationId }
        : {}),
      fieldErrors: result.error.fieldErrors ?? [],
      ...(result.error.fieldErrors?.length
        ? {}
        : { generalMessage: 'Confira os dados informados e tente novamente.' }),
    }
  }

  if (result.error.code === 'invalid-credentials') {
    return {
      correlationId: result.error.correlationId,
      fieldErrors: [],
      generalMessage:
        'E-mail ou senha inválidos. Confira seus dados e tente novamente.',
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
      generalMessage: `Muitas tentativas de login.${waitMessage}`,
    }
  }

  if (result.error.code === 'forbidden') {
    return {
      correlationId: result.error.correlationId,
      fieldErrors: [],
      generalMessage: 'Esta origem não está autorizada a realizar o login.',
    }
  }

  return { fieldErrors: [], generalMessage: genericLoginError }
}

type LoginScreenProps = Readonly<{
  registrationConfirmed?: boolean
}>

export function LoginScreen({ registrationConfirmed = false }: LoginScreenProps) {
  const { push, replace } = useRouter()
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<readonly AuthFieldError[]>([])
  const [generalError, setGeneralError] = useState<string>()
  const [correlationId, setCorrelationId] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRegistrationConfirmation] = useState(registrationConfirmed)

  useEffect(() => {
    if (!registrationConfirmed) {
      return
    }

    replace('/login', { scroll: false })
  }, [registrationConfirmed, replace])

  function updateField(field: LoginField, value: string) {
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
      const result = await login(values)

      if (result.kind === 'success') {
        setValues(initialValues)
        push('/')
        return
      }

      const mappedError = getResultError(result)
      setFieldErrors(mappedError.fieldErrors)
      setGeneralError(mappedError.generalMessage)
      setCorrelationId(mappedError.correlationId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const emailError = getFieldError(fieldErrors, 'email')
  const passwordError = getFieldError(fieldErrors, 'password')

  return (
    <AuthShell
      description="Entre para acessar seu catálogo de produtos."
      eyebrow="Acesso seguro"
      footer={
        <>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Ainda não possui uma conta?{' '}
            <Link
              className="font-semibold text-link underline-offset-4 hover:underline"
              href="/register"
            >
              Cadastre-se
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Suas credenciais são protegidas e usadas somente nesta tentativa de acesso.
          </p>
        </>
      }
      title="Boas-vindas"
    >
      {showRegistrationConfirmation && (
        <Alert className="mb-6">
          <AlertTitle>Cadastro concluído</AlertTitle>
          <AlertDescription>
            Sua conta foi criada. Entre com seu e-mail e senha para continuar.
          </AlertDescription>
        </Alert>
      )}

      <form
        noValidate
        aria-busy={isSubmitting}
        className="flex flex-col gap-6"
        onSubmit={handleSubmit}
      >
        {generalError && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível entrar</AlertTitle>
            <AlertDescription>
              <p>{generalError}</p>
              {correlationId && (
                <p className="mt-2">Referência de suporte: {correlationId}</p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <FieldGroup>
          <Field data-invalid={emailError !== undefined}>
            <FieldLabel htmlFor="login-email">E-mail</FieldLabel>
            <FieldContent>
              <Input
                aria-describedby={emailError ? 'login-email-error' : undefined}
                aria-invalid={emailError !== undefined}
                autoComplete="email"
                disabled={isSubmitting}
                id="login-email"
                inputMode="email"
                name="email"
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="voce@empresa.com"
                type="email"
                value={values.email}
              />
              <FieldError
                id="login-email-error"
                errors={emailError ? [emailError] : undefined}
              />
            </FieldContent>
          </Field>

          <Field data-invalid={passwordError !== undefined}>
            <FieldLabel htmlFor="login-password">Senha</FieldLabel>
            <FieldContent>
              <Input
                aria-describedby={passwordError ? 'login-password-error' : undefined}
                aria-invalid={passwordError !== undefined}
                autoComplete="current-password"
                disabled={isSubmitting}
                id="login-password"
                name="password"
                onChange={(event) => updateField('password', event.target.value)}
                type="password"
                value={values.password}
              />
              <FieldError
                id="login-password-error"
                errors={passwordError ? [passwordError] : undefined}
              />
            </FieldContent>
          </Field>
        </FieldGroup>

        <Button className="w-full" disabled={isSubmitting} type="submit">
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
