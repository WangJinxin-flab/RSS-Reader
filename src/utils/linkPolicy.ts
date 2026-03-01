const DANGEROUS_PROTOCOL_RE = /^(javascript|data|file|intent|vbscript|about|blob):/i
const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/

export function normalizeHref(rawHref: string): string | null {
  const href = rawHref.trim()
  if (!href) return null
  if (href.startsWith('//')) return `https:${href}`
  return href
}

export function resolveHref(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return href
  }
}

export function isInternalHref(href: string, baseOrigin: string): boolean {
  if (href.startsWith('#')) return true
  if (href.startsWith('/')) return true
  if (href.startsWith('./') || href.startsWith('../')) return true
  if (href.startsWith('?')) return true

  try {
    const parsed = new URL(href, `${baseOrigin}/`)
    return parsed.origin === baseOrigin
  } catch {
    return false
  }
}

export function shouldBlockNavigation(rawHref: string, baseOrigin: string): boolean {
  const normalized = normalizeHref(rawHref)
  if (!normalized) return false

  if (DANGEROUS_PROTOCOL_RE.test(normalized)) {
    return true
  }

  if (!SCHEME_RE.test(normalized) && !normalized.startsWith('//')) {
    return !isInternalHref(normalized, baseOrigin)
  }

  return !isInternalHref(normalized, baseOrigin)
}
