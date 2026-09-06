import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Alert, AlertDescription, AlertTitle } from './alert'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Field, FieldDescription, FieldLabel, FieldGroup } from './field'
import { Input } from './input'
import { Skeleton } from './skeleton'
import { Spinner } from './spinner'

describe('design system primitives', () => {
  it('exposes semantic button variants and an accessible focus state', async () => {
    const user = userEvent.setup()

    render(
      <div>
        <Button>Primária</Button>
        <Button variant="secondary">Secundária</Button>
        <Button variant="destructive">Excluir</Button>
        <Button variant="outline">Alternativa</Button>
      </div>,
    )

    expect(screen.getByRole('button', { name: 'Primária' })).toHaveClass(
      'bg-primary',
      'hover:bg-primary-hover',
      'active:bg-primary-active',
    )
    expect(screen.getByRole('button', { name: 'Secundária' })).toHaveClass(
      'bg-secondary',
      'text-secondary-foreground',
    )
    expect(screen.getByRole('button', { name: 'Excluir' })).toHaveClass(
      'bg-destructive',
      'text-destructive-foreground',
    )

    await user.tab()

    expect(screen.getByRole('button', { name: 'Primária' })).toHaveFocus()
  })

  it('keeps buttons disabled and exposes loading feedback', () => {
    render(
      <Button disabled>
        <Spinner data-icon="inline-start" />
        Salvando
      </Button>,
    )

    expect(screen.getByRole('button', { name: /salvando/i })).toBeDisabled()
    expect(screen.getByRole('status', { name: 'Carregando' })).toBeVisible()
  })

  it('associates field labels and validation state with their controls', () => {
    render(
      <FieldGroup>
        <Field data-invalid="true">
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input id="email" aria-invalid="true" />
          <FieldDescription>Informe um e-mail válido.</FieldDescription>
        </Field>
      </FieldGroup>,
    )

    expect(screen.getByLabelText('E-mail')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Informe um e-mail válido.')).toBeVisible()
  })

  it('uses semantic feedback, card composition, and a reduced-motion skeleton', () => {
    render(
      <>
        <Alert variant="destructive">
          <AlertTitle>Não foi possível continuar</AlertTitle>
          <AlertDescription>Tente novamente.</AlertDescription>
        </Alert>
        <Card>
          <CardHeader>
            <CardTitle>Catálogo</CardTitle>
          </CardHeader>
          <CardContent>Produtos</CardContent>
        </Card>
        <Skeleton aria-label="Carregando produtos" />
      </>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Tente novamente.')
    expect(screen.getByText('Catálogo')).toBeVisible()
    expect(screen.getByLabelText('Carregando produtos')).toHaveAttribute(
      'data-slot',
      'skeleton',
    )
  })
})
