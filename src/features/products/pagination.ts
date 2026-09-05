import type { ProductPage } from '@/features/products/types'

export type PaginationState = Readonly<{
  currentPageIndex: number
  cursors: readonly (string | undefined)[]
  page?: ProductPage
}>

export type PublicPage =
  | Readonly<{ kind: 'first' }>
  | Readonly<{ kind: 'visited'; pageIndex: number }>
  | Readonly<{ kind: 'invalid' }>

export function parsePublicPage(value: string | null): PublicPage {
  if (value === null) {
    return { kind: 'first' }
  }

  if (!/^[1-9]\d*$/.test(value)) {
    return { kind: 'invalid' }
  }

  const pageNumber = Number(value)

  if (!Number.isSafeInteger(pageNumber)) {
    return { kind: 'invalid' }
  }

  return pageNumber === 1
    ? { kind: 'first' }
    : { kind: 'visited', pageIndex: pageNumber - 1 }
}

export function getPublicPageUrl(pageIndex: number): string {
  return pageIndex === 0 ? '/' : `/?page=${pageIndex + 1}`
}

export function createPaginationState(): PaginationState {
  return {
    currentPageIndex: 0,
    cursors: [undefined],
  }
}

export function getPageRequestCursor(
  state: PaginationState,
  pageIndex = state.currentPageIndex,
): string | undefined {
  return state.cursors[pageIndex]
}

export function canGoPrevious(state: PaginationState): boolean {
  return state.currentPageIndex > 0
}

export function canGoNext(state: PaginationState): boolean {
  return state.page?.nextCursor !== undefined
}

export function goToNextPage(state: PaginationState): PaginationState | undefined {
  const nextCursor = state.page?.nextCursor

  if (nextCursor === undefined) {
    return undefined
  }

  return {
    currentPageIndex: state.currentPageIndex + 1,
    cursors: [...state.cursors.slice(0, state.currentPageIndex + 1), nextCursor],
  }
}

export function goToPreviousPage(state: PaginationState): PaginationState | undefined {
  if (!canGoPrevious(state)) {
    return undefined
  }

  return {
    currentPageIndex: state.currentPageIndex - 1,
    cursors: state.cursors,
  }
}

export function setCurrentPage(
  state: PaginationState,
  page: ProductPage,
): PaginationState {
  return { ...state, page }
}
