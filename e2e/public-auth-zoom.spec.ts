import { expect, test } from '@playwright/test'

test.describe('public authentication at 200% zoom equivalent', () => {
  test.use({ viewport: { width: 640, height: 900 } })

  for (const route of [
    { heading: 'Crie sua conta', path: '/register', field: 'Nome' },
    { heading: 'Boas-vindas', path: '/login', field: 'E-mail' },
  ]) {
    test(`preserves content and actions on ${route.path}`, async ({ page }) => {
      await page.goto(route.path)

      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
      await expect(page.getByLabel(route.field)).toBeVisible()
      await expect(
        page.getByRole('button', {
          name: route.path === '/register' ? 'Criar conta' : 'Entrar',
        }),
      ).toBeVisible()

      const layout = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))

      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth)
    })
  }
})
