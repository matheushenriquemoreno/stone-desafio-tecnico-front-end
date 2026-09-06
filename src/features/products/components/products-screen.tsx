'use client'

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Package2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  canGoNext,
  canGoPrevious,
  createPaginationState,
  getPublicPageUrl,
  goToNextPage,
  goToPreviousPage,
  parsePublicPage,
  setCurrentPage,
  type PaginationState,
} from '@/features/products/pagination'
import { cn } from '@/lib/utils'
import { listProducts } from '@/features/products/api/products-gateway'
import { ProductCard } from '@/features/products/components/product-card'
import { shouldRedirectToLoginForProtectedRead } from '@/features/products/protected-read'
import type { ListProductsResult, ProductPage } from '@/features/products/types'
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

function SessionDecisionLoading() {
  return (
    <div aria-label="Confirmando sessão" className="sr-only" role="status">
      Confirmando sessão…
    </div>
  )
}

function ProductsLoading() {
  return (
    <div aria-label="Carregando catálogo" className="flex flex-col gap-6" role="status">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Card className={cn(index === 2 && 'hidden lg:flex')} key={index}>
            <CardHeader className="flex flex-col gap-4">
              <Skeleton className="aspect-[16/9] w-full rounded-lg" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </CardHeader>
            <CardContent className="mt-auto">
              <Skeleton className="h-7 w-24" />
            </CardContent>
            <CardFooter className="justify-between gap-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="size-4" />
            </CardFooter>
          </Card>
        ))}
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
        <div className="flex flex-col gap-1">
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
    <ul
      aria-label="Produtos do catálogo"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
    >
      {page.items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  )
}

function ProductsScreenContent({
  protectedHeader,
}: Readonly<{
  protectedHeader?: ReactNode
}>) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [attempt, setAttempt] = useState(0)
  const [hasConfirmedAccess, setHasConfirmedAccess] = useState(false)
  const [pagination, setPagination] = useState<PaginationState>(createPaginationState)
  const [viewState, setViewState] = useState<ProductsViewState>({ kind: 'loading' })
  const requestVersion = useRef(0)
  const localNavigationTarget = useRef<number | undefined>(undefined)
  const lastCanonicalizedPage = useRef<string | null | undefined>(undefined)
  const sequenceResetPending = useRef(false)
  const currentPageParam = searchParams.get('page')
  const deletedConfirmation = searchParams.get('deleted') === 'success'
  const currentPageIndex = pagination.currentPageIndex
  const paginationCursors = pagination.cursors
  const requestedCursor = paginationCursors[currentPageIndex]

  useEffect(() => {
    if (!deletedConfirmation) {
      return
    }

    window.history.replaceState(window.history.state, '', '/')
  }, [deletedConfirmation])

  useEffect(() => {
    const publicPage = parsePublicPage(currentPageParam)
    const requestedPageIndex =
      publicPage.kind === 'first' || publicPage.kind === 'invalid'
        ? 0
        : publicPage.pageIndex
    const canRestoreRequestedPage =
      publicPage.kind === 'first' ||
      (publicPage.kind === 'visited' && publicPage.pageIndex < paginationCursors.length)
    const localTarget = localNavigationTarget.current

    if (canRestoreRequestedPage && lastCanonicalizedPage.current !== undefined) {
      lastCanonicalizedPage.current = undefined
    }

    if (localTarget !== undefined) {
      if (requestedPageIndex === localTarget) {
        localNavigationTarget.current = undefined
      } else {
        return
      }
    }

    if (!canRestoreRequestedPage) {
      sequenceResetPending.current = true

      if (lastCanonicalizedPage.current !== currentPageParam) {
        lastCanonicalizedPage.current = currentPageParam
        router.replace('/')
      }

      if (currentPageIndex === 0 && paginationCursors.length === 1) {
        return
      }

      const timeoutId = window.setTimeout(() => {
        sequenceResetPending.current = false
        setPagination(createPaginationState())
        setViewState({ kind: 'loading' })
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }

    if (sequenceResetPending.current) {
      if (currentPageIndex === 0 && paginationCursors.length === 1) {
        sequenceResetPending.current = false
        return
      }

      const timeoutId = window.setTimeout(() => {
        sequenceResetPending.current = false
        setPagination(createPaginationState())
        setViewState({ kind: 'loading' })
      }, 0)

      return () => window.clearTimeout(timeoutId)
    }

    if (currentPageParam !== null && publicPage.kind === 'first') {
      if (lastCanonicalizedPage.current !== currentPageParam) {
        lastCanonicalizedPage.current = currentPageParam
        router.replace('/')
      }
    }

    if (currentPageIndex === requestedPageIndex) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setPagination((current) => ({
        ...current,
        currentPageIndex: requestedPageIndex,
        page: undefined,
      }))
      setViewState({ kind: 'loading' })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [currentPageIndex, currentPageParam, paginationCursors, router])

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
        setHasConfirmedAccess(true)
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

      if (shouldRedirectToLoginForProtectedRead(result)) {
        setHasConfirmedAccess(false)
        setViewState({ kind: 'unauthorized' })
        redirectToLogin(router)
        return
      }

      if (result.kind === 'error' && result.error.code === 'unauthorized') {
        setHasConfirmedAccess(false)
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
    localNavigationTarget.current = nextState.currentPageIndex
    router.push(getPublicPageUrl(nextState.currentPageIndex))
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
    localNavigationTarget.current = previousState.currentPageIndex
    router.push(getPublicPageUrl(previousState.currentPageIndex))
  }

  const isLoaded = viewState.kind === 'empty' || viewState.kind === 'success'
  const hasPreviousPage = isLoaded && canGoPrevious(pagination)
  const hasNextPage = isLoaded && canGoNext(pagination)

  return (
    <div className="min-h-svh bg-background">
      {hasConfirmedAccess && protectedHeader}
      <main
        className="min-h-svh bg-background px-4 py-6 sm:px-6 lg:px-8"
        aria-label={hasConfirmedAccess ? 'Catálogo protegido' : 'Carregando aplicação'}
      >
        <div className="mx-auto max-w-6xl">
          {viewState.kind === 'loading' &&
            (hasConfirmedAccess ? <ProductsLoading /> : <SessionDecisionLoading />)}

          {viewState.kind === 'unauthorized' && <ProductsUnauthorized />}

          {viewState.kind === 'error' && (
            <div className="mx-auto max-w-2xl">
              <Alert variant="destructive">
                <AlertTitle>Não foi possível carregar</AlertTitle>
                <AlertDescription>
                  <p>{viewState.message}</p>
                  {viewState.correlationId && (
                    <p className="mt-2 text-xs">
                      Referência: {viewState.correlationId}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
              <Button className="mt-5" onClick={retry}>
                Tentar novamente
              </Button>
            </div>
          )}

          {(viewState.kind === 'empty' || viewState.kind === 'success') && (
            <div className="flex flex-col gap-8">
              {deletedConfirmation && (
                <Alert>
                  <AlertTitle>Produto removido</AlertTitle>
                  <AlertDescription>
                    O produto foi removido e o catálogo foi atualizado.
                  </AlertDescription>
                </Alert>
              )}
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div className="flex flex-col gap-2">
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
    </div>
  )
}

function ProductsScreenFallback() {
  return (
    <main className="min-h-svh bg-background" aria-label="Carregando aplicação">
      <SessionDecisionLoading />
    </main>
  )
}

export function ProductsScreen({
  protectedHeader,
}: Readonly<{
  protectedHeader?: ReactNode
}>) {
  return (
    <Suspense fallback={<ProductsScreenFallback />}>
      <ProductsScreenContent protectedHeader={protectedHeader} />
    </Suspense>
  )
}
