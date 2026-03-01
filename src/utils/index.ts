import i18n from '@/i18n'

export function formatDate(date: string | Date | undefined): string {
  if (!date) return ''
  
  const d = new Date(date)
  return d.toLocaleDateString(i18n.language || 'zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date | undefined): string {
  if (!date) return ''
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 7) {
    return formatDate(date)
  } else if (days > 0) {
    return i18n.t('timeAgo.daysAgo', { count: days })
  } else if (hours > 0) {
    return i18n.t('timeAgo.hoursAgo', { count: hours })
  } else if (minutes > 0) {
    return i18n.t('timeAgo.minutesAgo', { count: minutes })
  } else {
    return i18n.t('timeAgo.justNow')
  }
}

export function validateFeedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'rsshub:'
  } catch {
    return false
  }
}
