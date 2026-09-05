'use client'

import { FormEvent, useState } from 'react'
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
  fieldErrors: readonly AuthFieldError[]
  generalMessage?: string
} {
  if (result.kind !== 'error') {
    return { fieldErrors: [], generalMessage: genericLoginError }
  }

  if (result.error.code === 'validation') {
    return {
      fieldErrors: result.error.fieldErrors ?? [],
      ...(result.error.fieldErrors?.length
        ? {}
        : { generalMessage: 'Confira os dados informados e tente novamente.' }),
    }
  }

  if (result.error.code === 'invalid-credentials') {
    return {
      fieldErrors: [],
      generalMessage:
        'E-mail ou senha inválidos. Confira seus dados e tente novamente.',
    }
  }

  if (result.error.code === 'rate-limit') {
    const waitMessage = result.error.retryAfterSeconds
      ? ` Aguarde ${result.error.retryAfterSeconds} segundos antes de tentar novamente.`
      : ' Aguarde alguns instantes antes de tentar novamente.'

    return {
      fieldErrors: [],
      generalMessage: `Muitas tentativas de login.${waitMessage}`,
    }
  }

  if (result.error.code === 'forbidden') {
    return {
      fieldErrors: [],
      generalMessage: 'Esta origem não está autorizada a realizar o login.',
    }
  }

  return { fieldErrors: [], generalMessage: genericLoginError }
}

export function LoginScreen() {
  const router = useRouter()
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<readonly AuthFieldError[]>([])
  const [generalError, setGeneralError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  function updateField(field: LoginField, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setFieldErrors((current) => current.filter((error) => error.field !== field))
    setGeneralError(undefined)
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
      return
    }

    setIsSubmitting(true)
    setFieldErrors([])
    setGeneralError(undefined)

    try {
      const result = await login(values)

      if (result.kind === 'success') {
        setValues(initialValues)
        router.push('/')
        return
      }

      const mappedError = getResultError(result)
      setFieldErrors(mappedError.fieldErrors)
      setGeneralError(mappedError.generalMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const emailError = getFieldError(fieldErrors, 'email')
  const passwordError = getFieldError(fieldErrors, 'password')

  return (
    <section className="relative isolate flex min-h-svh items-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-primary/20 [clip-path:polygon(0_0,100%_0,100%_65%,0_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-8 -z-10 size-80 rounded-full bg-accent/10 blur-3xl"
      />

      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-foreground/10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden flex-col justify-between bg-secondary p-10 text-secondary-foreground lg:flex xl:p-14">
          <div>
            <div className="mb-12 flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary font-display text-2xl font-bold text-primary-foreground">
                S
              </span>
              <span className="font-display text-3xl font-bold tracking-tight">
                Stone
              </span>
            </div>
            <p className="mb-4 font-display text-5xl leading-[0.95] font-semibold tracking-tight xl:text-6xl">
              Seu catálogo, com clareza.
            </p>
            <p className="max-w-sm text-base leading-7 text-secondary-foreground/80">
              Acesse a área segura para acompanhar e gerenciar os produtos do catálogo.
            </p>
          </div>
          <p className="text-sm text-secondary-foreground/60">
            Gestão simples para o dia a dia.
          </p>
        </div>

        <div className="p-6 sm:p-10 xl:p-14">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary font-display text-2xl font-bold text-primary-foreground">
                S
              </span>
              <span className="font-display text-3xl font-bold tracking-tight">
                Stone
              </span>
            </div>
          </div>

          <div className="mb-8 space-y-2">
            <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Acesso seguro
            </p>
            <h1 className="text-4xl leading-none font-semibold tracking-tight">
              Boas-vindas
            </h1>
            <p className="text-muted-foreground">
              Entre para acessar seu catálogo de produtos.
            </p>
          </div>

          <form
            noValidate
            aria-busy={isSubmitting}
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            {generalError && (
              <Alert variant="destructive">
                <AlertTitle>Não foi possível entrar</AlertTitle>
                <AlertDescription>{generalError}</AlertDescription>
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
                    aria-describedby={
                      passwordError ? 'login-password-error' : undefined
                    }
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

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Suas credenciais são protegidas e usadas somente nesta tentativa de acesso.
          </p>
        </div>
      </div>
    </section>
  )
}
