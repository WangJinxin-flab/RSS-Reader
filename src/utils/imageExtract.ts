function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
}

function normalizeUrl(src: string): string | null {
  const decoded = decodeHtmlEntities(src)
  if (decoded.startsWith('http')) return decoded
  if (decoded.startsWith('//')) return `https:${decoded}`
  return null
}

export function extractFirstImage(html: string): string | null {
  if (!html) return null

  const imgTagRegex = /<img[^>]*>/gi
  const imgTags = html.match(imgTagRegex)
  if (!imgTags) return null

  for (const tag of imgTags) {
    // Try data-src first (lazy-loaded images, e.g. WeChat articles)
    const dataSrcMatch = tag.match(/\bdata-src=["']([^"']+)["']/i)
    if (dataSrcMatch?.[1]) {
      const url = normalizeUrl(dataSrcMatch[1])
      if (url) return url
    }

    // Fall back to src, skip data: URIs (they are placeholder images)
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/i)
      || tag.match(/\bsrc=([^\s>]+)/i)
    if (srcMatch?.[1] && !srcMatch[1].startsWith('data:')) {
      const url = normalizeUrl(srcMatch[1])
      if (url) return url
    }
  }

  return null
}
