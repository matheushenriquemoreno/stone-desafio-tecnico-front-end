import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

const apiUrl = process.env.E2E_API_URL

test.describe('public registration and login', () => {
  test.skip(
    !apiUrl,
    'Configure E2E_API_URL para usar uma API local controlada e uma origem autorizada.',
  )

  test('completa cadastro, trata duplicidade e autentica sem sessão automática', async ({
    page,
  }) => {
    const email = `e2e-${randomUUID()}@example.test`
    const password = 'senha-e2e-segura'

    await page.goto('/register')
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByLabel('Nome')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('E-mail')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByLabel('Senha')).toHaveAttribute('aria-invalid', 'true')

    await page.getByLabel('Nome').fill('Usuário E2E')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(
      page.getByText(
        'Sua conta foi criada. Entre com seu e-mail e senha para continuar.',
      ),
    ).toBeVisible()

    await page.goto('/register')
    await page.getByLabel('Nome').fill('Usuário E2E')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Criar conta' }).click()

    await expect(page.getByText('Este e-mail já está cadastrado.')).toBeVisible()
    await expect(page).toHaveURL(/\/register$/)

    await page.goto('/login')
    await page.getByLabel('E-mail').fill(email)
    await page.getByLabel('Senha').fill('senha-incorreta')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(
      page.getByText(
        'E-mail ou senha inválidos. Confira seus dados e tente novamente.',
      ),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)

    await page.getByLabel('Senha').fill(password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
    await expect(page.getByText('Área protegida')).toBeVisible()
  })
})
