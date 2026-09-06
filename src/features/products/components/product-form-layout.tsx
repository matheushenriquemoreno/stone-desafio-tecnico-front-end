import type { ReactNode } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function ProductFormLayout({
  cardDescription,
  children,
  description,
  title,
  titleId,
}: Readonly<{
  cardDescription: string
  children: ReactNode
  description: string
  title: string
  titleId: string
}>) {
  return (
    <section
      aria-labelledby={titleId}
      className="mx-auto flex w-full max-w-2xl flex-col gap-6"
    >
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Catálogo compartilhado
        </p>
        <h1 id={titleId} className="font-display text-5xl leading-none font-semibold">
          {title}
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Dados do produto</CardTitle>
          <CardDescription>{cardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">{children}</CardContent>
      </Card>
    </section>
  )
}
