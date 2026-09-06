import { expect, test } from '@playwright/test'

const product = {
  createdAt: '2026-09-02T12:00:00.000Z',
  description: 'Descrição do produto',
  imageUrl: 'https://example.com/product.png',
  price: 99.9,
  updatedAt: '2026-09-02T12:00:00.000Z',
}

const pageOne = {
  items: [{ ...product, id: 'product-1', name: 'Produto um' }],
  nextCursor: 'opaque/+/=',
  total: 2,
}

const pageTwo = {
  items: [{ ...product, id: 'product-2', name: 'Produto dois' }],
  total: 2,
}

test.describe('catálogo e paginação por cursor', () => {
  test('navega, preserva cursores visitados e canonicaliza reload sem cursor', async ({
    page,
  }) => {
    const requests: URL[] = []

    await page.route(/\/products(?:\?.*)?$/, async (route) => {
      const requestUrl = new URL(route.request().url())
      requests.push(requestUrl)

      if (requestUrl.searchParams.get('cursor') === 'opaque/+/=') {
        await route.fulfill({
          body: JSON.stringify(pageTwo),
          contentType: 'application/json',
          status: 200,
        })
        return
      }

      await route.fulfill({
        body: JSON.stringify(pageOne),
        contentType: 'application/json',
        status: 200,
      })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()
    await expect(page.getByText('Produto um')).toBeVisible()
    await expect(page.getByText('Página 1')).toBeVisible()
    expect(requests.some((requestUrl) => !requestUrl.searchParams.has('cursor'))).toBe(
      true,
    )

    await page.getByRole('button', { name: 'Próxima' }).click()
    await expect(page).toHaveURL(/\/\?page=2$/)
    await expect(page.getByText('Produto dois')).toBeVisible()
    await expect(page.getByText('Página 2')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Próxima' })).toBeDisabled()
    expect(
      requests.some(
        (requestUrl) => requestUrl.searchParams.get('cursor') === 'opaque/+/=',
      ),
    ).toBe(true)

    await page.getByRole('button', { name: 'Anterior' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Produto um')).toBeVisible()
    expect(requests.at(-1)?.searchParams.get('cursor')).toBeNull()

    await page.getByRole('button', { name: 'Próxima' }).click()
    await expect(page).toHaveURL(/\/\?page=2$/)
    await expect(page.getByText('Produto dois')).toBeVisible()
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Produto um')).toBeVisible()
    await page.goForward()
    await expect(page).toHaveURL(/\/\?page=2$/)
    await expect(page.getByText('Produto dois')).toBeVisible()
    expect(requests.at(-1)?.searchParams.get('cursor')).toBe('opaque/+/=')

    await page.goto('/?page=2')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('Produto um')).toBeVisible()
    expect(requests.at(-1)?.searchParams.get('cursor')).toBeNull()
    expect(
      await page.evaluate(() => ({
        location: window.location.href,
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage),
      })),
    ).toEqual({
      location: expect.not.stringContaining('cursor'),
      localStorage: [],
      sessionStorage: [],
    })
  })

  test('permite retry manual e oferece ação no catálogo vazio', async ({ page }) => {
    let attempts = 0

    await page.route(/\/products(?:\?.*)?$/, async (route) => {
      attempts += 1

      if (attempts <= 2) {
        await route.fulfill({ status: 500 })
        return
      }

      await route.fulfill({
        body: JSON.stringify({ items: [], total: 0 }),
        contentType: 'application/json',
        status: 200,
      })
    })

    await page.goto('/')
    await expect(
      page.getByRole('alert').filter({
        hasText: 'Não foi possível carregar o catálogo',
      }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page.getByRole('heading', { name: 'Catálogo vazio' })).toBeVisible()
    await expect(page.getByText('0 produtos')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Criar produto' })).toHaveAttribute(
      'href',
      '/products/new',
    )
  })

  test('redireciona para login quando a sessão expira na próxima página', async ({
    page,
  }) => {
    await page.route(/\/products(?:\?.*)?$/, async (route) => {
      const requestUrl = new URL(route.request().url())

      if (requestUrl.searchParams.has('cursor')) {
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

      await route.fulfill({
        body: JSON.stringify(pageOne),
        contentType: 'application/json',
        status: 200,
      })
    })

    await page.goto('/')
    await expect(page.getByText('Produto um')).toBeVisible()
    await page.getByRole('button', { name: 'Próxima' }).click()

    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: 'Boas-vindas' })).toBeVisible()
  })

  test('adapta a grade e preserva a imagem completa nos breakpoints', async ({
    page,
  }) => {
    await page.route('https://example.com/product.png', async (route) => {
      await route.fulfill({
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
          'base64',
        ),
        contentType: 'image/png',
        status: 200,
      })
    })
    await page.route(/\/products(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        body: JSON.stringify(pageOne),
        contentType: 'application/json',
        status: 200,
      })
    })

    await page.goto('/')

    const productList = page.getByRole('list', { name: 'Produtos do catálogo' })
    const cardLink = page.getByRole('link', { name: 'Ver e editar Produto um' })

    await expect(cardLink).toBeVisible()
    await expect(cardLink.getByText('Ver e editar')).toBeVisible()

    for (const viewport of [
      { columns: 1, height: 900, width: 320 },
      { columns: 2, height: 900, width: 768 },
      { columns: 3, height: 900, width: 1440 },
    ]) {
      await page.setViewportSize({ height: viewport.height, width: viewport.width })

      await expect
        .poll(() =>
          productList.evaluate(
            (element) =>
              getComputedStyle(element).gridTemplateColumns.split(' ').filter(Boolean)
                .length,
          ),
        )
        .toBe(viewport.columns)
    }

    await expect(page.getByRole('img', { name: 'Imagem de Produto um' })).toHaveCSS(
      'object-fit',
      'contain',
    )
    await cardLink.focus()
    await expect(cardLink).toBeFocused()
  })

  test('mantém catálogo e controles acessíveis em viewport estreita', async ({
    page,
  }) => {
    await page.setViewportSize({ height: 900, width: 400 })
    await page.route(/\/products(?:\?.*)?$/, async (route) => {
      await route.fulfill({
        body: JSON.stringify(pageOne),
        contentType: 'application/json',
        status: 200,
      })
    })

    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Catálogo' })).toBeVisible()

    expect(
      await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      })),
    ).toEqual({ clientWidth: 400, scrollWidth: 400 })

    await page.getByRole('button', { name: 'Próxima' }).focus()
    await expect(page.getByRole('button', { name: 'Próxima' })).toBeFocused()
  })
})
