import { marked } from 'marked'
import DOMPurify from 'dompurify'

export interface TocItem {
  id: string
  text: string
  level: number
}

const MARKDOWN_HINT_RE =
  /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|~~~|\|.+\|)|\[[^\]]+\]\([^)]+\)/m
const HTML_RE = /<\/?[a-z][\s\S]*>/i

const ALLOWED_TAGS = [
  'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'code', 'del', 'details', 'div',
  'em', 'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i',
  'iframe', 'img', 'li', 'mark', 'ol', 'p', 'pre', 's', 'section', 'small', 'span',
  'strong', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
]

const ALLOWED_ATTR = [
  'align', 'allow', 'allowfullscreen', 'alt', 'class', 'colspan', 'data-src', 'height', 'href',
  'id', 'loading', 'rel', 'rowspan', 'scrolling', 'src', 'target', 'title', 'width',
]

const ALLOWED_IFRAME_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'player.bilibili.com',
  'www.bilibili.com',
  'bilibili.com',
])

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function detectContentFormat(content: string): 'html' | 'markdown' | 'text' {
  if (!content.trim()) return 'text'
  if (HTML_RE.test(content)) return 'html'
  if (MARKDOWN_HINT_RE.test(content)) return 'markdown'
  return 'text'
}

function normalizeToHtml(content: string): string {
  const format = detectContentFormat(content)
  if (format === 'html') return content
  if (format === 'markdown') {
    return marked.parse(content, {
      async: false,
      breaks: true,
      gfm: true,
    }) as string
  }
  return `<p>${escapeHtml(content)}</p>`
}

function isAllowedIframeSrc(src: string): boolean {
  if (!src) return false
  try {
    const normalized = src.startsWith('//') ? `https:${src}` : src
    const url = new URL(normalized, 'https://localhost')
    return ALLOWED_IFRAME_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

function sanitizeHtml(html: string): string {
  const purified = DOMPurify.sanitize(html, {
    ALLOWED_ATTR,
    ALLOWED_TAGS,
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ['script', 'style'],
  }) as string

  const parser = new DOMParser()
  const doc = parser.parseFromString(purified, 'text/html')

  doc.querySelectorAll('iframe').forEach((iframe) => {
    const src = iframe.getAttribute('src') || ''
    if (!isAllowedIframeSrc(src)) {
      iframe.remove()
      return
    }

    iframe.setAttribute('loading', 'lazy')
    if (!iframe.getAttribute('title')) {
      iframe.setAttribute('title', 'Embedded content')
    }
  })

  doc.querySelectorAll('a[href]').forEach((a) => {
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
  })

  return doc.body.innerHTML
}

function addHeadingIds(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')

  headings.forEach((heading, index) => {
    heading.id = `heading-${index}`
  })

  return doc.body.innerHTML
}

export function buildRenderableHtml(content: string): string {
  if (!content?.trim()) return ''
  const html = normalizeToHtml(content)
  return addHeadingIds(sanitizeHtml(html))
}

export function extractTocFromHtml(html: string): TocItem[] {
  if (!html?.trim()) return []

  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')

  return Array.from(headings).map((heading) => ({
    id: heading.id,
    text: heading.textContent || '',
    level: parseInt(heading.tagName.charAt(1), 10),
  }))
}
