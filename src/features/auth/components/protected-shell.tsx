import type { ReactNode } from 'react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ProtectedShellProps = Readonly<{
  actions?: ReactNode
  children: ReactNode
}>

export function ProtectedHeader({ actions }: Pick<ProtectedShellProps, 'actions'>) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          aria-label="Stone, catálogo"
          className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/"
        >
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary font-display text-2xl font-bold text-primary-foreground">
            S
          </span>
          <span className="font-display text-3xl font-bold tracking-tight">Stone</span>
        </Link>

        <nav
          aria-label="Navegação protegida"
          className="flex flex-wrap items-center justify-end gap-2"
        >
          <Link
            className={cn(buttonVariants({ size: 'sm', variant: 'ghost' }))}
            href="/"
          >
            Catálogo
          </Link>
          <Link
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
            href="/products/new"
          >
            Novo produto
          </Link>
          {actions}
        </nav>
      </div>
    </header>
  )
}

export function ProtectedShell({ actions, children }: ProtectedShellProps) {
  return (
    <div className="min-h-svh bg-background">
      <ProtectedHeader actions={actions} />
      {children}
    </div>
  )
}
