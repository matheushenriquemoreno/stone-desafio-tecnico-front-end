function isSupportedOrigin(value: string): boolean {
  try {
    const url = new URL(value)

    return (
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      url.username === '' &&
      url.password === '' &&
      url.pathname === '/' &&
      url.search === '' &&
      url.hash === '' &&
      !url.hostname.includes('*')
    )
  } catch {
    return false
  }
}

export function parseImageOrigins(value: string | undefined): readonly string[] {
  if (!value) {
    return []
  }

  return [
    ...new Set(
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(isSupportedOrigin)
        .map((origin) => new URL(origin).origin),
    ),
  ]
}

export function getConfiguredImageOrigins(): readonly string[] {
  return parseImageOrigins(process.env.NEXT_PUBLIC_IMAGE_ORIGINS)
}

export function isAllowedImageUrl(
  imageUrl: string,
  allowedOrigins = getConfiguredImageOrigins(),
): boolean {
  try {
    const url = new URL(imageUrl)
    return allowedOrigins.includes(url.origin)
  } catch {
    return false
  }
}
