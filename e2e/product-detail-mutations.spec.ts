import { expect, test, type Page, type Route } from '@playwright/test'

const productsEndpoint = /\/products(?:\/[^?]+)?(?:\?.*)?$/

const initialProduct = {
  createdAt: '2026-09-02T12:00:00.000Z',
  description: 'Descrição do produto',
  id: 'product-detail-e2e',
  imageUrl: 'https://example.com/product.png',
  name: 'Produto detalhe E2E',
  price: 99.9,
  updatedAt: '2026-09-02T12:00:00.000Z',
}

const emptyPage = {
  items: [],
  total: 0,
}

function isCollectionRequest(route: Route): boolean {
  return new URL(route.request().url()).pathname.endsWith('/products')
}

async function fulfill(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    body: JSON.stringify(body),
    contentType: 'application/json',
    status,
  })
}

async function fillValidProduct(page: Page) {
  await page.getByLabel('Nome').fill(initialProduct.name)
  await page.getByLabel('Descrição').fill(initialProduct.description)
  await page.getByLabel('Preço').fill('99.90')
  await page.getByLabel('URL da imagem').fill(initialProduct.imageUrl)
}

async function getProductFormCardWidth(page: Page): Promise<number> {
  const card = page
    .getByText('Dados do produto', { exact: true })
    .locator('xpath=ancestor::*[@data-slot="card"][1]')
  const bounds = await card.boundingBox()

  if (!bounds) {
    throw new Error('O card do formulário de produto não está visível.')
  }

  return bounds.width
}

test.describe('consulta, edição e exclusão de produtos', () => {
  test('cria, consulta, edita parcialmente e exclui somente após confirmação', async ({
    page,
  }) => {
    let currentProduct = initialProduct
    let probeRequests = 0
    let createRequests = 0
    let createBody: unknown
    let detailRequests = 0
    let listRequests = 0
    const listRequestCursors: (string | null)[] = []
    let patchRequests = 0
    let deleteRequests = 0
    let patchBody: unknown

    await page.route(productsEndpoint, async (route) => {
      const request = route.request()

      if (request.resourceType() !== 'fetch') {
        await route.continue()
        return
      }

      const requestUrl = new URL(request.url())

      if (request.method() === 'GET' && isCollectionRequest(route)) {
        if (requestUrl.searchParams.get('limit') === '1') {
          probeRequests += 1
          await fulfill(route, emptyPage)
          return
        }

        listRequests += 1
        listRequestCursors.push(requestUrl.searchParams.get('cursor'))
        await fulfill(route, emptyPage)
        return
      }

      if (request.method() === 'POST' && isCollectionRequest(route)) {
        createRequests += 1
        createBody = request.postDataJSON()
        await fulfill(route, currentProduct, 201)
        return
      }

      if (
        request.method() === 'GET' &&
        requestUrl.pathname.endsWith(`/products/${initialProduct.id}`)
      ) {
        detailRequests += 1
        await fulfill(route, currentProduct)
        return
      }

      if (
        request.method() === 'PATCH' &&
        requestUrl.pathname.endsWith(`/products/${initialProduct.id}`)
      ) {
        patchRequests += 1
        patchBody = request.postDataJSON()
        currentProduct = {
          ...currentProduct,
          ...(patchBody as { name?: string }),
          updatedAt: '2026-09-05T12:00:00.000Z',
        }
        await fulfill(route, currentProduct)
        return
      }

      if (
        request.method() === 'DELETE' &&
        requestUrl.pathname.endsWith(`/products/${initialProduct.id}`)
      ) {
        deleteRequests += 1
        await route.fulfill({ status: 204 })
        return
      }

      await route.continue()
    })

    await page.goto('/products/new')
    await expect(page.getByRole('heading', { name: 'Novo produto' })).toBeVisible()
    await fillValidProduct(page)
    await expect(page.getByLabel('Preço')).toHaveValue('R$ 99,90')
    const creationCardWidth = await getProductFormCardWidth(page)
    await page.getByRole('button', { name: 'Criar produto' }).click()

    await expect(page.getByRole('heading', { name: initialProduct.name })).toBeVisible()
    await expect(
      page.locator('[data-slot="alert"]').filter({ hasText: 'Produto criado' }),
    ).toBeVisible()

    await page.getByRole('button', { name: 'Editar produto' }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Editar produto' }),
    ).toBeVisible()
    await expect(page.getByText('Catálogo compartilhado')).toBeVisible()
    await expect(page.getByText('Dados do produto')).toBeVisible()
    await expect(page.getByLabel('Nome')).toHaveValue(initialProduct.name)
    await expect(page.getByLabel('Preço')).toHaveValue('R$ 99,90')
    expect(await getProductFormCardWidth(page)).toBe(creationCardWidth)
    await page.getByRole('button', { name: 'Cancelar' }).click()
    expect(patchRequests).toBe(0)

    await page.getByRole('button', { name: 'Editar produto' }).click()
    await page.getByLabel('Nome').fill('Produto detalhe atualizado')
    await page.getByRole('button', { name: 'Salvar alterações' }).click()

    await expect(
      page.getByRole('heading', { name: 'Produto detalhe atualizado' }),
    ).toBeVisible()
    await expect(
      page.locator('[data-slot="alert"]').filter({ hasText: 'Produto atualizado' }),
    ).toBeVisible()
    expect(patchRequests).toBe(1)
    expect(patchBody).toEqual({ name: 'Produto detalhe atualizado' })

    await page.getByRole('button', { name: 'Excluir produto' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('button', { name: 'Cancelar' }).click()
    expect(deleteRequests).toBe(0)

    await page.getByRole('button', { name: 'Excluir produto' }).click()
    await page.getByRole('button', { name: 'Confirmar exclusão' }).click()

    await expect(page.getByRole('heading', { name: 'Catálogo vazio' })).toBeVisible()
    await expect(
      page.locator('[data-slot="alert"]').filter({ hasText: 'Produto removido' }),
    ).toBeVisible()
    await expect(page).toHaveURL(/\/$/)

    expect(probeRequests).toBe(1)
    expect(createRequests).toBe(1)
    expect(createBody).toEqual({
      description: initialProduct.description,
      imageUrl: initialProduct.imageUrl,
      name: initialProduct.name,
      price: initialProduct.price,
    })
    expect(detailRequests).toBeGreaterThanOrEqual(1)
    expect(listRequests).toBeGreaterThanOrEqual(1)
    expect(listRequestCursors.every((cursor) => cursor === null)).toBe(true)
    expect(deleteRequests).toBe(1)
  })

  test('substitui consulta inexistente por estado seguro sem ações', async ({
    page,
  }) => {
    await page.route(productsEndpoint, async (route) => {
      const request = route.request()

      if (request.resourceType() !== 'fetch') {
        await route.continue()
        return
      }

      const requestUrl = new URL(request.url())
      if (
        request.method() === 'GET' &&
        requestUrl.pathname.endsWith('/products/gone')
      ) {
        await fulfill(
          route,
          {
            code: 'PRODUCT_NOT_FOUND',
            correlationId: 'e2e-detail-not-found',
            message: 'mensagem externa',
            statusCode: 404,
          },
          404,
        )
        return
      }

      await route.continue()
    })

    await page.goto('/products/gone')

    await expect(
      page.getByText('Produto não encontrado', { exact: true }),
    ).toBeVisible()
    await expect(page.getByText('Referência: e2e-detail-not-found')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Voltar ao catálogo' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Editar produto' })).not.toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Excluir produto' }),
    ).not.toBeVisible()
  })

  test('redireciona consulta protegida para login quando a sessão expira', async ({
    page,
  }) => {
    await page.route(productsEndpoint, async (route) => {
      const request = route.request()

      if (request.resourceType() !== 'fetch') {
        await route.continue()
        return
      }

      const requestUrl = new URL(request.url())
      if (
        request.method() === 'GET' &&
        requestUrl.pathname.endsWith('/products/expired')
      ) {
        await fulfill(
          route,
          {
            code: 'UNAUTHORIZED',
            correlationId: 'e2e-detail-expired',
            message: 'mensagem externa',
            statusCode: 401,
          },
          401,
        )
        return
      }

      await route.continue()
    })

    await page.goto('/products/expired')

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Boas-vindas' })).toBeVisible()
  })
})
