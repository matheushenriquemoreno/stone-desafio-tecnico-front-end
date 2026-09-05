import { describe, expect, it } from 'vitest'

import { isAllowedImageUrl, parseImageOrigins } from './image-origin-policy'

describe('image origin policy', () => {
  it('normalizes only explicit HTTP(S) origins', () => {
    expect(
      parseImageOrigins(
        'https://images.example.com, https://cdn.example.com/, https://images.example.com/path, *.example.com, data:text/plain,',
      ),
    ).toEqual(['https://images.example.com', 'https://cdn.example.com'])
  })

  it('allows an image only when its origin is explicitly configured', () => {
    const allowedOrigins = ['https://images.example.com']

    expect(
      isAllowedImageUrl('https://images.example.com/products/a.png', allowedOrigins),
    ).toBe(true)
    expect(
      isAllowedImageUrl('https://other.example.com/products/a.png', allowedOrigins),
    ).toBe(false)
    expect(
      isAllowedImageUrl('http://images.example.com/products/a.png', allowedOrigins),
    ).toBe(false)
    expect(isAllowedImageUrl('not-a-url', allowedOrigins)).toBe(false)
  })
})
