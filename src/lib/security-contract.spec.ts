import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

type ForbiddenPattern = Readonly<{
  label: string
  pattern: RegExp
}>

const sourceDirectory = path.resolve(process.cwd(), 'src')

const forbiddenPatterns: readonly ForbiddenPattern[] = [
  { label: 'Web Storage', pattern: /\b(?:localStorage|sessionStorage)\b/ },
  { label: 'Authorization/Bearer', pattern: /\b(?:Authorization|Bearer)\b/ },
  { label: 'cookie acessível ao cliente', pattern: /document\.cookie|cookies\s*\(/ },
  { label: 'cabeçalho CSRF customizado', pattern: /X-CSRF-Protection|csrf/i },
  {
    label: 'cabeçalho de origem forjado',
    pattern: /headers\.(?:set|append)\(\s*['"](?:Origin|Referer)/,
  },
  { label: 'silenciador TypeScript', pattern: /as unknown as|@ts-ignore|:\s*any\b/ },
]

function getProductionSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        return getProductionSourceFiles(entryPath)
      }

      if (
        !/\.(?:css|ts|tsx)$/.test(entry.name) ||
        /\.spec\.(?:ts|tsx)$/.test(entry.name)
      ) {
        return []
      }

      return [entryPath]
    })
    .sort()
}

describe('contrato transversal de segurança', () => {
  it('não introduz construções proibidas no código de produção', () => {
    const violations = getProductionSourceFiles(sourceDirectory).flatMap((filePath) => {
      const source = readFileSync(filePath, 'utf8')
      const relativePath = path.relative(process.cwd(), filePath)

      return forbiddenPatterns.flatMap(({ label, pattern }) =>
        pattern.test(source) ? [`${relativePath}: ${label}`] : [],
      )
    })

    expect(violations).toEqual([])
  })

  it('mantém o acesso direto à API e não cria uma camada intermediária', () => {
    const apiClient = readFileSync(
      path.join(sourceDirectory, 'lib', 'api-client.ts'),
      'utf8',
    )

    expect(apiClient).toContain('NEXT_PUBLIC_API_URL')
    expect(apiClient).toContain("credentials: 'include'")

    for (const forbiddenPath of [['app', 'api'], ['middleware.ts'], ['proxy.ts']]) {
      expect(existsSync(path.join(sourceDirectory, ...forbiddenPath))).toBe(false)
    }
  })
})
