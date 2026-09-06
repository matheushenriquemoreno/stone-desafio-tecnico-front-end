import { expect, test } from '@playwright/test'

const integrationConfiguration = {
  apiUrl: process.env.E2E_API_URL,
  email: process.env.E2E_USER_EMAIL,
  password: process.env.E2E_USER_PASSWORD,
}

const isConfigured = Object.values(integrationConfiguration).every(
  (value) => value !== undefined && value.length > 0,
)

test.describe('authenticated tracer', () => {
  test.skip(
    !isConfigured,
    'Configure E2E_API_URL, E2E_USER_EMAIL e E2E_USER_PASSWORD para usar uma API local controlada.',
  )

  test('faz login e confirma a sessão pela primeira leitura protegida', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill(integrationConfiguration.email ?? '')
    await page.getByLabel('Senha').fill(integrationConfiguration.password ?? '')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
    await expect(page.getByText(/\d+ produto/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
  })

  test('retorna ao login ao acessar o catálogo sem sessão', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto('/')

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Boas-vindas' })).toBeVisible()
    await context.close()
  })
})
