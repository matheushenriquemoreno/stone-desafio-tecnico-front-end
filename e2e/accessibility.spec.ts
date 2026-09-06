import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type Route } from '@playwright/test'

const product = {
  createdAt: '2026-09-02T12:00:00.000Z',
  description: 'Descrição do produto',
  id: 'product-accessibility',
  imageUrl: 'https://example.com/product.png',
  name: 'Produto acessível',
  price: 99.9,
  updatedAt: '2026-09-02T12:00:00.000Z',
}

const productsEndpoint = /\/products(?:\/[^?]+)?(?:\?.*)?$/

async function fulfill(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    body: JSON.stringify(body),
    contentType: 'application/json',
    status,
  })
}

function isCollectionRequest(route: Route): boolean {
  return new URL(route.request().url()).pathname.endsWith('/products')
}

async function stubProtectedProductRoutes(page: Page) {
  await page.route(productsEndpoint, async (route) => {
    const request = route.request()

    if (request.resourceType() !== 'fetch') {
      await route.continue()
      return
    }

    const requestUrl = new URL(request.url())

    if (request.method() === 'GET' && isCollectionRequest(route)) {
      if (requestUrl.searchParams.get('limit') === '1') {
        await fulfill(route, { items: [], total: 0 })
        return
      }

      await fulfill(route, { items: [product], total: 1 })
      return
    }

    if (
      request.method() === 'GET' &&
      requestUrl.pathname.endsWith(`/products/${product.id}`)
    ) {
      await fulfill(route, product)
      return
    }

    await route.continue()
  })
}

async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze()

  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    )
    .toEqual({
      clientWidth: expect.any(Number),
      scrollWidth: expect.any(Number),
    })

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth)
}

test.describe('acessibilidade e reflow transversal', () => {
  test('mantém cadastro e login acessíveis em viewport estreita', async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 400 })
    await page.emulateMedia({ reducedMotion: 'reduce' })

    for (const route of [
      { heading: 'Crie sua conta', path: '/register' },
      { heading: 'Boas-vindas', path: '/login' },
    ]) {
      await page.goto(route.path)
      await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
      await expectAccessible(page)
      await expectNoHorizontalOverflow(page)
    }

    const reducedMotionStyles = await page.locator('body').evaluate((element) => ({
      scrollBehavior: getComputedStyle(element).scrollBehavior,
      transitionDuration: getComputedStyle(element).transitionDuration,
    }))

    expect(reducedMotionStyles.scrollBehavior).toBe('auto')
    expect(
      Number.parseFloat(reducedMotionStyles.transitionDuration),
    ).toBeLessThanOrEqual(0.00001)
  })

  test('mantém catálogo, criação, detalhe, edição e confirmação acessíveis', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 400 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await stubProtectedProductRoutes(page)

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
    await expectAccessible(page)
    await expectNoHorizontalOverflow(page)

    await page.goto('/products/new')
    await expect(page.getByRole('heading', { name: 'Novo produto' })).toBeVisible()
    await expectAccessible(page)
    await expectNoHorizontalOverflow(page)

    await page.goto(`/products/${product.id}`)
    await expect(page.getByRole('heading', { name: product.name })).toBeVisible()
    await expectAccessible(page)
    await expectNoHorizontalOverflow(page)

    await page.getByRole('button', { name: 'Editar produto' }).click()
    await expect(page.getByRole('heading', { name: 'Editar produto' })).toBeVisible()
    await expectAccessible(page)
    await expectNoHorizontalOverflow(page)

    await page.getByRole('button', { name: 'Cancelar' }).click()
    const deleteTrigger = page.getByRole('button', { name: 'Excluir produto' })
    await deleteTrigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expectAccessible(page)
    await expectNoHorizontalOverflow(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('alertdialog')).not.toBeVisible()
    await expect(deleteTrigger).toBeFocused()
  })
})
