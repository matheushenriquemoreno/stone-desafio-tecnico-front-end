import { describe, expect, it } from 'vitest'

import {
  canGoNext,
  canGoPrevious,
  createPaginationState,
  getPageRequestCursor,
  getPublicPageUrl,
  goToNextPage,
  goToPreviousPage,
  parsePublicPage,
  setCurrentPage,
} from './pagination'

const firstPage = {
  items: [],
  nextCursor: 'cursor/opaque/+=',
  total: 3,
}

describe('pagination state', () => {
  it('starts at the first page without a request cursor', () => {
    const state = createPaginationState()

    expect(state).toEqual({ currentPageIndex: 0, cursors: [undefined] })
    expect(getPageRequestCursor(state)).toBeUndefined()
    expect(canGoPrevious(state)).toBe(false)
    expect(canGoNext(state)).toBe(false)
  })

  it('stores the received cursor and advances only one position', () => {
    const state = setCurrentPage(createPaginationState(), firstPage)
    const nextState = goToNextPage(state)

    expect(nextState).toEqual({
      currentPageIndex: 1,
      cursors: [undefined, 'cursor/opaque/+='],
    })
    expect(getPageRequestCursor(nextState ?? state)).toBe('cursor/opaque/+=')
    expect(canGoPrevious(nextState ?? state)).toBe(true)
  })

  it('returns only to visited positions and stops at the first page', () => {
    const firstState = setCurrentPage(createPaginationState(), firstPage)
    const secondState = goToNextPage(firstState)

    expect(goToPreviousPage(secondState ?? firstState)).toEqual({
      currentPageIndex: 0,
      cursors: [undefined, 'cursor/opaque/+='],
    })
    expect(goToPreviousPage(firstState)).toBeUndefined()
  })

  it('does not advance without a cursor and replaces a stale future branch', () => {
    const firstState = setCurrentPage(createPaginationState(), firstPage)
    const secondState = goToNextPage(firstState)

    expect(goToNextPage(createPaginationState())).toBeUndefined()
    expect(
      goToNextPage(
        setCurrentPage(
          {
            currentPageIndex: 0,
            cursors: [undefined, 'stale-cursor'],
          },
          firstPage,
        ),
      ),
    ).toEqual(secondState)
  })
})

describe('public pagination position', () => {
  it('parses only a positive human page number', () => {
    expect(parsePublicPage(null)).toEqual({ kind: 'first' })
    expect(parsePublicPage('1')).toEqual({ kind: 'first' })
    expect(parsePublicPage('3')).toEqual({ kind: 'visited', pageIndex: 2 })
    expect(parsePublicPage('0')).toEqual({ kind: 'invalid' })
    expect(parsePublicPage('abc')).toEqual({ kind: 'invalid' })
    expect(parsePublicPage('9007199254740992')).toEqual({ kind: 'invalid' })
  })

  it('generates URLs without embedding cursors', () => {
    expect(getPublicPageUrl(0)).toBe('/')
    expect(getPublicPageUrl(1)).toBe('/?page=2')
    expect(getPublicPageUrl(4)).not.toContain('cursor')
  })
})
