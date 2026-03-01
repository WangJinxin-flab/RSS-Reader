import { describe, expect, it } from 'vitest'
import {
  normalizeHref,
  resolveHref,
  shouldBlockNavigation,
} from '@/utils/linkPolicy'

describe('linkPolicy', () => {
  it('normalizes protocol-relative links', () => {
    expect(normalizeHref('//example.com/a')).toBe('https://example.com/a')
  })

  it('returns null for blank href', () => {
    expect(normalizeHref('   ')).toBeNull()
  })

  it('does not block in-app hash links', () => {
    expect(shouldBlockNavigation('#section-1', 'tauri://localhost')).toBe(false)
  })

  it('does not block in-app relative paths', () => {
    expect(shouldBlockNavigation('/article/1', 'tauri://localhost')).toBe(false)
    expect(shouldBlockNavigation('./article/1', 'tauri://localhost')).toBe(false)
    expect(shouldBlockNavigation('?tab=meta', 'tauri://localhost')).toBe(false)
  })

  it('blocks external http links', () => {
    expect(
      shouldBlockNavigation('https://mp.weixin.qq.com/s?x=1', 'tauri://localhost')
    ).toBe(true)
  })

  it('blocks dangerous protocols', () => {
    expect(shouldBlockNavigation('javascript:alert(1)', 'tauri://localhost')).toBe(true)
    expect(shouldBlockNavigation('data:text/html;base64,Zm9v', 'tauri://localhost')).toBe(true)
  })

  it('blocks non-app protocols like mailto/tel', () => {
    expect(shouldBlockNavigation('mailto:test@example.com', 'tauri://localhost')).toBe(true)
    expect(shouldBlockNavigation('tel:+123456789', 'tauri://localhost')).toBe(true)
  })

  it('resolves href against base url', () => {
    expect(resolveHref('/feed/1', 'tauri://localhost/article/2')).toBe('tauri://localhost/feed/1')
  })
})
