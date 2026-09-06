import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const globalsCss = readFileSync(
  path.resolve(process.cwd(), 'src/app/globals.css'),
  'utf8',
)

function getTokenValue(tokenName: string): string {
  const tokenPattern = new RegExp(`--${tokenName}:\\s*(#[0-9a-fA-F]{6})`)
  const tokenMatch = globalsCss.match(tokenPattern)

  if (!tokenMatch?.[1]) {
    throw new Error(`Token ausente: ${tokenName}`)
  }

  return tokenMatch[1]
}

function channelToLinear(channel: number): number {
  const normalizedChannel = channel / 255

  return normalizedChannel <= 0.03928
    ? normalizedChannel / 12.92
    : ((normalizedChannel + 0.055) / 1.055) ** 2.4
}

function getRelativeLuminance(color: string): number {
  const red = Number.parseInt(color.slice(1, 3), 16)
  const green = Number.parseInt(color.slice(3, 5), 16)
  const blue = Number.parseInt(color.slice(5, 7), 16)

  return (
    channelToLinear(red) * 0.2126 +
    channelToLinear(green) * 0.7152 +
    channelToLinear(blue) * 0.0722
  )
}

function getContrastRatio(firstToken: string, secondToken: string): number {
  const firstLuminance = getRelativeLuminance(getTokenValue(firstToken))
  const secondLuminance = getRelativeLuminance(getTokenValue(secondToken))
  const lighter = Math.max(firstLuminance, secondLuminance)
  const darker = Math.min(firstLuminance, secondLuminance)

  return (lighter + 0.05) / (darker + 0.05)
}

describe('tokens de contraste da ADR-004', () => {
  const requiredPairs = [
    ['foreground', 'background'],
    ['card-foreground', 'card'],
    ['primary-foreground', 'primary'],
    ['secondary-foreground', 'secondary'],
    ['link', 'card'],
    ['destructive-foreground', 'destructive'],
    ['success-foreground', 'success'],
  ] as const

  it.each(requiredPairs)('%s sobre %s atende WCAG AA', (first, second) => {
    expect(getContrastRatio(first, second)).toBeGreaterThanOrEqual(4.5)
  })

  it('mantém o tema claro e desativa animações não essenciais com movimento reduzido', () => {
    expect(globalsCss).not.toContain('@custom-variant dark')
    expect(globalsCss).not.toMatch(/\.dark\s*\{/)
    expect(globalsCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(globalsCss).toContain('.animate-pulse')
    expect(globalsCss).toContain('.animate-spin')
  })
})
