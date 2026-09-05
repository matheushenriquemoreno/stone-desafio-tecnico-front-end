import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

const apiUrl = process.env.E2E_API_URL

const isConfigured = apiUrl !== undefined && apiUrl.length > 0

test.describe('sessão protegida e logout', () => {
  test.skip(
    !isConfigured,
    'Configure E2E_API_URL para usar uma API local controlada e uma origem autorizada.',
  )

  test('encerra sessão, protege novo acesso e aceita logout sem sessão', async ({
    page,
  }) => {
    const email = `e2e-session-${randomUUID()}@example.test`
    const password = 'senha-e2e-segura'
    const consoleMessages: string[] = []
    page.on('console', (message) => consoleMessages.push(message.text()))

    await page.goto('/register')
    await page.getByLabel('Nome').fill('Usuário de sessão')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Criar conta' }).click()
    await expect(page).toHaveURL(/\/login$/)

    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()

    await page.getByRole('button', { name: 'Sair' }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Boas-vindas' })).toBeVisible()
    await expect
      .poll(() => page.evaluate(() => localStorage.length + sessionStorage.length))
      .toBe(0)
    expect(consoleMessages.join('\n')).not.toMatch(/bearer|jwt|token|senha/i)

    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)

    await page.goto('/login')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL(/\/$/)

    await page.context().clearCookies()
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)

    const logoutStatus = await page.evaluate(async (apiUrl) => {
      const response = await fetch(`${apiUrl}/auth/logout`, {
        credentials: 'include',
        method: 'POST',
      })

      return response.status
    }, apiUrl)

    expect(logoutStatus).toBe(204)
  })
})
