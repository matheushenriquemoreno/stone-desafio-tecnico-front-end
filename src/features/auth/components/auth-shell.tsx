import type { ReactNode } from 'react'

type AuthShellProps = Readonly<{
  children: ReactNode
  description: string
  eyebrow: string
  footer?: ReactNode
  title: string
}>

export function AuthShell({
  children,
  description,
  eyebrow,
  footer,
  title,
}: AuthShellProps) {
  return (
    <section className="relative isolate flex min-h-svh items-center overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-primary/20 [clip-path:polygon(0_0,100%_0,100%_65%,0_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-8 size-80 rounded-full bg-accent/10 blur-3xl"
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

          <div className="mb-8 flex flex-col gap-2">
            <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
            <h1 className="text-4xl leading-none font-semibold tracking-tight">
              {title}
            </h1>
            <p className="text-muted-foreground">{description}</p>
          </div>

          {children}
          {footer}
        </div>
      </div>
    </section>
  )
}
