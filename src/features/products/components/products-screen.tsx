'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Package2 } from 'lucide-react'

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
import {
  canGoNext,
  canGoPrevious,
  createPaginationState,
  goToNextPage,
  goToPreviousPage,
  setCurrentPage,
  type PaginationState,
} from '@/features/products/pagination'
import { cn } from '@/lib/utils'
import { listProducts } from '@/features/products/api/products-gateway'
import type {
  ListProductsResult,
  Product,
  ProductPage,
} from '@/features/products/types'
import { redirectToLogin } from '@/lib/redirect-to-login'

type ProductsViewState =
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'unauthorized' }>
  | Readonly<{ kind: 'empty'; page: ProductPage }>
  | Readonly<{ kind: 'success'; page: ProductPage }>
  | Readonly<{
      correlationId?: string
      kind: 'error'
      message: string
      retryAfterSeconds?: number
    }>

const genericProductsError =
  'Não foi possível carregar o catálogo. Tente novamente em instantes.'
const paginationResetMessage =
  'A sequência de páginas foi reiniciada. Carregando a primeira página.'

function getProductCountLabel(total: number): string {
  return `${total} ${total === 1 ? 'produto' : 'produtos'}`
}

function getProductsError(
  result: Extract<ListProductsResult, { kind: 'error' }>,
): ProductsViewState {
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
    message: genericProductsError,
  }
}

function getFailureError(): ProductsViewState {
  return {
    kind: 'error',
    message: genericProductsError,
  }
}

function ProductItem({ product }: { product: Product }) {
  return (
    <li>
      <Card className="h-full">
        <CardHeader className="gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/20 text-secondary">
            <Package2 aria-hidden="true" className="size-5" />
          </div>
          <div className="space-y-1">
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>{product.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-display text-2xl font-semibold tracking-tight">
            {product.price.toLocaleString('pt-BR', {
              currency: 'BRL',
              style: 'currency',
            })}
          </p>
        </CardContent>
      </Card>
    </li>
  )
}

function ProductsLoading() {
  return (
    <div aria-label="Carregando catálogo" className="space-y-6" role="status">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-52 rounded-xl" />
        <Skeleton className="h-52 rounded-xl" />
      </div>
    </div>
  )
}

function ProductsUnauthorized() {
  return (
    <p aria-live="polite" className="text-sm text-muted-foreground" role="status">
      Sua sessão não está mais disponível. Redirecionando para o login…
    </p>
  )
}

function ProductsEmpty() {
  return (
    <Card>
      <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Package2 aria-hidden="true" className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-semibold">Catálogo vazio</h2>
          <p className="text-muted-foreground">Ainda não há produtos para exibir.</p>
        </div>
        <Link
          className={cn(buttonVariants({ size: 'sm', variant: 'default' }))}
          href="/products/new"
        >
          Criar produto
        </Link>
      </CardContent>
    </Card>
  )
}

function ProductsContent({ page }: { page: ProductPage }) {
  return (
    <ul aria-label="Produtos do catálogo" className="grid gap-4 md:grid-cols-2">
      {page.items.map((product) => (
        <ProductItem key={product.id} product={product} />
      ))}
    </ul>
  )
}

export function ProductsScreen() {
  const router = useRouter()
  const [attempt, setAttempt] = useState(0)
  const [pagination, setPagination] = useState<PaginationState>(createPaginationState)
  const [viewState, setViewState] = useState<ProductsViewState>({ kind: 'loading' })
  const requestVersion = useRef(0)
  const currentPageIndex = pagination.currentPageIndex
  const paginationCursors = pagination.cursors
  const requestedCursor = paginationCursors[currentPageIndex]

  useEffect(() => {
    const controller = new AbortController()
    const currentRequestVersion = requestVersion.current + 1
    requestVersion.current = currentRequestVersion
    const requestedPageIndex = currentPageIndex
    let isCurrent = true

    async function loadProducts() {
      const result = await listProducts({
        ...(requestedCursor === undefined ? {} : { cursor: requestedCursor }),
        signal: controller.signal,
      })

      if (
        !isCurrent ||
        requestVersion.current !== currentRequestVersion ||
        (result.kind === 'failure' && result.reason === 'aborted')
      ) {
        return
      }

      if (result.kind === 'success') {
        if (requestedPageIndex > 0 && result.page.items.length === 0) {
          setPagination(createPaginationState())
          setViewState({ kind: 'error', message: paginationResetMessage })
          router.replace('/')
          return
        }

        setPagination((current) =>
          current.currentPageIndex === requestedPageIndex
            ? setCurrentPage(current, result.page)
            : current,
        )
        setViewState({
          kind: result.page.items.length === 0 ? 'empty' : 'success',
          page: result.page,
        })
        return
      }

      if (
        requestedPageIndex > 0 &&
        result.kind === 'error' &&
        result.error.code === 'validation'
      ) {
        setPagination(createPaginationState())
        setViewState({
          correlationId: result.error.correlationId,
          kind: 'error',
          message: paginationResetMessage,
        })
        router.replace('/')
        return
      }

      if (result.kind === 'error' && result.error.code === 'unauthorized') {
        setViewState({ kind: 'unauthorized' })
        redirectToLogin(router)
        return
      }

      if (result.kind === 'error') {
        setViewState(getProductsError(result))
        return
      }

      setViewState(getFailureError())
    }

    void loadProducts()

    return () => {
      isCurrent = false
      controller.abort()
    }
  }, [attempt, currentPageIndex, paginationCursors, requestedCursor, router])

  function retry() {
    setViewState({ kind: 'loading' })
    setAttempt((current) => current + 1)
  }

  function goNext() {
    if (viewState.kind !== 'empty' && viewState.kind !== 'success') {
      return
    }

    const nextState = goToNextPage(pagination)

    if (!nextState) {
      return
    }

    setPagination(nextState)
    setViewState({ kind: 'loading' })
  }

  function goPrevious() {
    if (viewState.kind !== 'empty' && viewState.kind !== 'success') {
      return
    }

    const previousState = goToPreviousPage(pagination)

    if (!previousState) {
      return
    }

    setPagination(previousState)
    setViewState({ kind: 'loading' })
  }

  const isLoaded = viewState.kind === 'empty' || viewState.kind === 'success'
  const hasPreviousPage = isLoaded && canGoPrevious(pagination)
  const hasNextPage = isLoaded && canGoNext(pagination)

  return (
    <main
      className="min-h-svh bg-background px-4 py-6 sm:px-6 lg:px-8"
      aria-label="Catálogo protegido"
    >
      <div className="mx-auto max-w-6xl">
        {viewState.kind === 'loading' && <ProductsLoading />}

        {viewState.kind === 'unauthorized' && <ProductsUnauthorized />}

        {viewState.kind === 'error' && (
          <div className="mx-auto max-w-2xl">
            <Alert variant="destructive">
              <AlertTitle>Não foi possível carregar</AlertTitle>
              <AlertDescription>
                <p>{viewState.message}</p>
                {viewState.correlationId && (
                  <p className="mt-2 text-xs">Referência: {viewState.correlationId}</p>
                )}
              </AlertDescription>
            </Alert>
            <Button className="mt-5" onClick={retry}>
              Tentar novamente
            </Button>
          </div>
        )}

        {(viewState.kind === 'empty' || viewState.kind === 'success') && (
          <div className="space-y-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="space-y-2">
                <p className="text-sm font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Visão geral
                </p>
                <h1
                  id="catalog-title"
                  className="font-display text-5xl leading-none font-semibold tracking-tight"
                >
                  Catálogo
                </h1>
                <p className="text-muted-foreground">
                  Produtos disponíveis para consulta.
                </p>
              </div>
              <p
                aria-live="polite"
                className="text-sm font-medium text-muted-foreground"
              >
                {getProductCountLabel(viewState.page.total)}
              </p>
            </div>

            {viewState.kind === 'empty' ? (
              <ProductsEmpty />
            ) : (
              <ProductsContent page={viewState.page} />
            )}

            <nav
              aria-label="Paginação do catálogo"
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <Button
                disabled={!hasPreviousPage}
                onClick={goPrevious}
                variant="outline"
              >
                Anterior
              </Button>
              <p
                aria-live="polite"
                className="text-sm font-medium text-muted-foreground"
              >
                Página {currentPageIndex + 1}
              </p>
              <Button disabled={!hasNextPage} onClick={goNext}>
                Próxima
              </Button>
            </nav>
          </div>
        )}
      </div>
    </main>
  )
}
