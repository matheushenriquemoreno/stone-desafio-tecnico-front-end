'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getProduct } from '@/features/products/api/products-gateway'
import { ProductImage } from '@/features/products/components/product-image'
import { formatProductPrice } from '@/features/products/format-product-price'
import type { Product } from '@/features/products/types'
import { redirectToLogin } from '@/lib/redirect-to-login'
import { cn } from '@/lib/utils'

type ProductDetailViewState =
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'unauthorized' }>
  | Readonly<{ kind: 'not-found'; correlationId?: string }>
  | Readonly<{ kind: 'success'; product: Product }>
  | Readonly<{
      correlationId?: string
      kind: 'error'
      message: string
      retryAfterSeconds?: number
    }>

const genericDetailError =
  'Não foi possível carregar o produto. Tente novamente em instantes.'

function DetailLoading() {
  return (
    <div aria-label="Carregando produto" className="space-y-5" role="status">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-12 w-80 max-w-full" />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  )
}

function DetailUnauthorized() {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
      Sua sessão não está mais disponível. Redirecionando para o login…
    </p>
  )
}

function DetailNotFound({ correlationId }: { correlationId?: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Alert>
        <AlertTitle>Produto não encontrado</AlertTitle>
        <AlertDescription>
          <p>Esse produto não existe mais ou não está disponível.</p>
          {correlationId && <p className="mt-2 text-xs">Referência: {correlationId}</p>}
        </AlertDescription>
      </Alert>
      <Link className={cn(buttonVariants({ variant: 'outline' }))} href="/">
        Voltar ao catálogo
      </Link>
    </div>
  )
}

function getDetailError(
  result: Extract<Awaited<ReturnType<typeof getProduct>>, { kind: 'error' }>,
): ProductDetailViewState {
  if (result.error.code === 'not-found') {
    return { correlationId: result.error.correlationId, kind: 'not-found' }
  }

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
    message: genericDetailError,
  }
}

export function ProductDetailScreen({
  productId,
  showCreatedConfirmation = false,
}: Readonly<{
  productId: string
  showCreatedConfirmation?: boolean
}>) {
  const { replace } = useRouter()
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<ProductDetailViewState>({ kind: 'loading' })

  useEffect(() => {
    if (!showCreatedConfirmation) {
      return
    }

    replace(`/products/${encodeURIComponent(productId)}`, { scroll: false })
  }, [productId, replace, showCreatedConfirmation])

  useEffect(() => {
    const controller = new AbortController()
    let isCurrent = true

    async function loadProduct() {
      const result = await getProduct(productId, controller.signal)

      if (!isCurrent || (result.kind === 'failure' && result.reason === 'aborted')) {
        return
      }

      if (result.kind === 'success') {
        setState({ kind: 'success', product: result.product })
        return
      }

      if (result.kind === 'error' && result.error.code === 'unauthorized') {
        setState({ kind: 'unauthorized' })
        redirectToLogin({ replace })
        return
      }

      if (result.kind === 'error') {
        setState(getDetailError(result))
        return
      }

      setState({ kind: 'error', message: genericDetailError })
    }

    void loadProduct()

    return () => {
      isCurrent = false
      controller.abort()
    }
  }, [attempt, productId, replace])

  function retry() {
    setState({ kind: 'loading' })
    setAttempt((current) => current + 1)
  }

  return (
    <main
      aria-label="Detalhe do produto"
      className="min-h-svh bg-background px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        {state.kind === 'loading' && <DetailLoading />}

        {state.kind === 'unauthorized' && <DetailUnauthorized />}

        {state.kind === 'not-found' && (
          <DetailNotFound correlationId={state.correlationId} />
        )}

        {state.kind === 'error' && (
          <div className="mx-auto max-w-2xl space-y-5">
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar</AlertTitle>
              <AlertDescription>
                <p>{state.message}</p>
                {state.correlationId && (
                  <p className="mt-2 text-xs">Referência: {state.correlationId}</p>
                )}
              </AlertDescription>
            </Alert>
            <Button onClick={retry}>Tentar novamente</Button>
          </div>
        )}

        {state.kind === 'success' && (
          <section
            aria-labelledby="product-detail-title"
            className="mx-auto max-w-2xl space-y-6"
          >
            {showCreatedConfirmation && (
              <Alert>
                <AlertTitle>Produto criado</AlertTitle>
                <AlertDescription>
                  O produto foi criado e já está disponível no catálogo.
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <ProductImage
                  alt={`Imagem de ${state.product.name}`}
                  src={state.product.imageUrl}
                />
                <CardTitle className="font-display text-3xl">
                  <h1 id="product-detail-title">{state.product.name}</h1>
                </CardTitle>
                <CardDescription>{state.product.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="font-display text-3xl font-semibold tracking-tight">
                  {formatProductPrice(state.product.price)}
                </p>
                <Link className={cn(buttonVariants({ variant: 'outline' }))} href="/">
                  Voltar ao catálogo
                </Link>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </main>
  )
}
