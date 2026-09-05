import { expect, test, type Page, type Route } from '@playwright/test'

const productsEndpoint = /\/products(?:\/[^?]+)?(?:\?.*)?$/

const product = {
  createdAt: '2026-09-02T12:00:00.000Z',
  description: 'Descrição do produto',
  id: 'product-1',
  imageUrl: 'https://example.com/product.png',
  name: 'Produto principal',
  price: 99.9,
  updatedAt: '2026-09-02T12:00:00.000Z',
}

const probePage = {
  items: [],
  total: 0,
}

async function fulfillProbe(route: Route) {
  await route.fulfill({
    body: JSON.stringify(probePage),
    contentType: 'application/json',
    status: 200,
  })
}

async function fillValidProduct(page: Page) {
  await page.getByLabel('Nome').fill(product.name)
  await page.getByLabel('Descrição').fill(product.description)
  await page.getByLabel('Preço').fill('99.90')
  await page.getByLabel('URL da imagem').fill(product.imageUrl)
}

function isCollectionRequest(route: Route): boolean {
  return new URL(route.request().url()).pathname.endsWith('/products')
}

test.describe('criação de produtos', () => {
  test('protege a rota, cria uma vez e confirma o produto por leitura posterior', async ({
    page,
  }) => {
    let probeRequests = 0
    let mutationRequests = 0
    let detailRequests = 0
    let mutationBody: unknown

    await page.route(productsEndpoint, async (route) => {
      const request = route.request()

      if (request.resourceType() !== 'fetch') {
        await route.continue()
        return
      }

      if (request.method() === 'GET' && isCollectionRequest(route)) {
        probeRequests += 1
        expect(new URL(request.url()).searchParams.get('limit')).toBe('1')
        await fulfillProbe(route)
        return
      }

      if (request.method() === 'POST' && isCollectionRequest(route)) {
        mutationRequests += 1
        mutationBody = request.postDataJSON()
        await route.fulfill({
          body: JSON.stringify(product),
          contentType: 'application/json',
          status: 201,
        })
        return
      }

      if (
        request.method() === 'GET' &&
        new URL(request.url()).pathname.endsWith('/products/product-1')
      ) {
        detailRequests += 1
        await route.fulfill({
          body: JSON.stringify(product),
          contentType: 'application/json',
          status: 200,
        })
        return
      }

      await route.continue()
    })

    await page.goto('/products/new')
    await expect(page.getByRole('heading', { name: 'Novo produto' })).toBeVisible()
    await fillValidProduct(page)
    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect(page.getByRole('heading', { name: product.name })).toBeVisible()
    await expect(page.locator('[data-slot="alert"]')).toContainText('Produto criado')
    await expect(page.getByText('R$ 99,90')).toBeVisible()
    await expect(page).toHaveURL(/\/products\/product-1$/)

    expect(probeRequests).toBe(1)
    expect(mutationRequests).toBe(1)
    expect(detailRequests).toBeGreaterThanOrEqual(1)
    expect(mutationBody).toEqual({
      description: product.description,
      imageUrl: product.imageUrl,
      name: product.name,
      price: product.price,
    })
  })

  test('bloqueia o envio inválido antes de chamar a API', async ({ page }) => {
    let mutationRequests = 0

    await page.route(productsEndpoint, async (route) => {
      if (route.request().resourceType() !== 'fetch') {
        await route.continue()
        return
      }

      if (route.request().method() === 'GET' && isCollectionRequest(route)) {
        await fulfillProbe(route)
        return
      }

      if (route.request().method() === 'POST' && isCollectionRequest(route)) {
        mutationRequests += 1
      }

      await route.continue()
    })

    await page.goto('/products/new')
    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect(page.getByLabel('Nome')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByText('Informe o preço.')).toBeVisible()
    await expect(
      page.getByText('A URL da imagem deve usar HTTP(S) e ter até 2048 caracteres.'),
    ).toBeVisible()
    expect(mutationRequests).toBe(0)
  })

  test('redireciona para login quando o probe expira a sessão', async ({ page }) => {
    await page.route(productsEndpoint, async (route) => {
      if (route.request().resourceType() !== 'fetch') {
        await route.continue()
        return
      }

      if (route.request().method() === 'GET' && isCollectionRequest(route)) {
        await route.fulfill({
          body: JSON.stringify({
            code: 'UNAUTHORIZED',
            correlationId: 'e2e-session-expired',
            message: 'Sessão expirada',
            statusCode: 401,
          }),
          contentType: 'application/json',
          status: 401,
        })
        return
      }

      await route.continue()
    })

    await page.goto('/products/new')

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Boas-vindas' })).toBeVisible()
  })

  test('preserva os dados e explica origem rejeitada', async ({ page }) => {
    await page.route(productsEndpoint, async (route) => {
      const request = route.request()

      if (request.resourceType() !== 'fetch') {
        await route.continue()
        return
      }

      if (request.method() === 'GET' && isCollectionRequest(route)) {
        await fulfillProbe(route)
        return
      }

      if (request.method() === 'POST' && isCollectionRequest(route)) {
        await route.fulfill({
          body: JSON.stringify({
            code: 'REQUEST_FORBIDDEN',
            correlationId: 'e2e-origin-rejected',
            message: 'Origem rejeitada',
            statusCode: 403,
          }),
          contentType: 'application/json',
          status: 403,
        })
        return
      }

      await route.continue()
    })

    await page.goto('/products/new')
    await fillValidProduct(page)
    await page.getByRole('button', { name: 'Criar produto' }).click()

    const alert = page.locator('[data-slot="alert"]')
    await expect(alert).toContainText(
      'Esta origem não está autorizada a criar produtos.',
    )
    await expect(alert).toContainText('Referência de suporte: e2e-origin-rejected')
    await expect(page.getByLabel('Nome')).toHaveValue(product.name)
    await expect(alert).not.toContainText('Origem rejeitada')
  })

  test('orienta rate limit sem repetir a mutação', async ({ page }) => {
    let mutationRequests = 0

    await page.route(productsEndpoint, async (route) => {
      const request = route.request()

      if (request.resourceType() !== 'fetch') {
        await route.continue()
        return
      }

      if (request.method() === 'GET' && isCollectionRequest(route)) {
        await fulfillProbe(route)
        return
      }

      if (request.method() === 'POST' && isCollectionRequest(route)) {
        mutationRequests += 1
        await route.fulfill({
          body: JSON.stringify({
            code: 'RATE_LIMIT_EXCEEDED',
            correlationId: 'e2e-rate-limit',
            message: 'Limite excedido',
            statusCode: 429,
          }),
          contentType: 'application/json',
          headers: { 'Retry-After': '8' },
          status: 429,
        })
        return
      }

      await route.continue()
    })

    await page.goto('/products/new')
    await fillValidProduct(page)
    await page.getByRole('button', { name: 'Criar produto' }).click()

    const alert = page.locator('[data-slot="alert"]')
    await expect(alert).toContainText('Muitas tentativas de criação.')
    await expect(alert).toContainText('Referência de suporte: e2e-rate-limit')
    expect(mutationRequests).toBe(1)
  })

  test('usa fallback seguro para resposta inesperada', async ({ page }) => {
    await page.route(productsEndpoint, async (route) => {
      const request = route.request()

      if (request.resourceType() !== 'fetch') {
        await route.continue()
        return
      }

      if (request.method() === 'GET' && isCollectionRequest(route)) {
        await fulfillProbe(route)
        return
      }

      if (request.method() === 'POST' && isCollectionRequest(route)) {
        await route.fulfill({
          body: JSON.stringify({ message: 'detalhe interno' }),
          contentType: 'application/json',
          status: 500,
        })
        return
      }

      await route.continue()
    })

    await page.goto('/products/new')
    await fillValidProduct(page)
    await page.getByRole('button', { name: 'Criar produto' }).click()

    const alert = page.locator('[data-slot="alert"]')
    await expect(alert).toContainText(
      'Não foi possível criar o produto. Tente novamente em instantes.',
    )
    await expect(alert).not.toContainText('detalhe interno')
  })
})
