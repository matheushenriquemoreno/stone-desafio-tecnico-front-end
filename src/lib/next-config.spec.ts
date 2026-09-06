import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Next.js deployment output', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('omits standalone output on Vercel', async () => {
    vi.stubEnv('VERCEL', '1')

    const { default: config } = await import('../../next.config')

    expect(config.output).toBeUndefined()
  })

  it('keeps standalone output outside Vercel for Docker', async () => {
    vi.stubEnv('VERCEL', '')

    const { default: config } = await import('../../next.config')

    expect(config.output).toBe('standalone')
  })
})
