'use client'

import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { listProducts } from '@/features/products/api/products-gateway'
import { redirectToLogin } from '@/lib/redirect-to-login'

type ProductCreationGateState =
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'ready' }>
  | Readonly<{ kind: 'unauthorized' }>
  | Readonly<{
      correlationId?: string
      kind: 'error'
      message: string
      retryAfterSeconds?: number
    }>

type ProbeRecord = {
  attempt: number
  controller: AbortController
  mounted: boolean
}

const genericProbeError =
  'Não foi possível confirmar sua sessão. Tente novamente em instantes.'

function getProbeError(
  result: Extract<Awaited<ReturnType<typeof listProducts>>, { kind: 'error' }>,
): ProductCreationGateState {
  if (result.error.code === 'rate-limit') {
    return {
      correlationId: result.error.correlationId,
      kind: 'error',
      message: result.error.retryAfterSeconds
        ? `Muitas consultas em sequência. Aguarde ${result.error.retryAfterSeconds} segundos antes de tentar novamente.`
        : 'Muitas consultas em sequência. Aguarde alguns instantes antes de tentar novamente.',
      retryAfterSeconds: result.error.retryAfterSeconds,
    }
  }

  return {
    correlationId: result.error.correlationId,
    kind: 'error',
    message: genericProbeError,
  }
}

function CreationGateLoading() {
  return (
    <div aria-label="Confirmando sessão" className="space-y-5" role="status">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-12 w-72 max-w-full" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}

function CreationGateUnauthorized() {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
      Sua sessão não está mais disponível. Redirecionando para o login…
    </p>
  )
}

export function ProductCreationGate({
  children,
}: Readonly<{
  children?: ReactNode
}>) {
  const { replace } = useRouter()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ProductCreationGateState>({ kind: 'loading' })
  const probeRef = useRef<ProbeRecord | undefined>(undefined)

  useEffect(() => {
    const previousProbe = probeRef.current

    if (previousProbe?.attempt === attempt) {
      previousProbe.mounted = true
      return
    }

    const controller = new AbortController()
    const probe: ProbeRecord = {
      attempt,
      controller,
      mounted: true,
    }
    probeRef.current = probe
    setState({ kind: 'loading' })

    async function confirmSession() {
      const result = await listProducts({ limit: 1, signal: controller.signal })

      if (
        probeRef.current !== probe ||
        !probe.mounted ||
        (result.kind === 'failure' && result.reason === 'aborted')
      ) {
        return
      }

      if (result.kind === 'success') {
        setState({ kind: 'ready' })
        return
      }

      if (result.kind === 'error' && result.error.code === 'unauthorized') {
        setState({ kind: 'unauthorized' })
        redirectToLogin({ replace })
        return
      }

      if (result.kind === 'error') {
        setState(getProbeError(result))
        return
      }

      setState({ kind: 'error', message: genericProbeError })
    }

    void confirmSession()

    return () => {
      probe.mounted = false

      window.setTimeout(() => {
        if (!probe.mounted) {
          controller.abort()
        }
      }, 0)
    }
  }, [attempt, replace])

  function retry() {
    setState({ kind: 'loading' })
    setAttempt((current) => current + 1)
  }

  return (
    <main
      aria-label="Criação de produto"
      className="min-h-svh bg-background px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-6xl">
        {state.kind === 'loading' && <CreationGateLoading />}

        {state.kind === 'unauthorized' && <CreationGateUnauthorized />}

        {state.kind === 'error' && (
          <div className="mx-auto max-w-2xl">
            <Alert variant="destructive">
              <AlertTitle>Não foi possível confirmar o acesso</AlertTitle>
              <AlertDescription>
                <p>{state.message}</p>
                {state.correlationId && (
                  <p className="mt-2 text-xs">Referência: {state.correlationId}</p>
                )}
              </AlertDescription>
            </Alert>
            <Button className="mt-5" onClick={retry}>
              Tentar novamente
            </Button>
          </div>
        )}

        {state.kind === 'ready' && children}
      </div>
    </main>
  )
}
