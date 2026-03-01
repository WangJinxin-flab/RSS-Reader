import i18n from '@/i18n'
import { toast } from '@/stores/toastStore'
import type { ExternalLinkBehavior } from '@/stores/settingsStore'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { normalizeHref, resolveHref, shouldBlockNavigation } from '@/utils/linkPolicy'
import { confirm as tauriConfirm } from '@tauri-apps/plugin-dialog'

export type ExternalNavigationResult = 'internal' | 'opened' | 'blocked' | 'invalid' | 'cancelled'

interface HandleExternalNavigationOptions {
  behavior: ExternalLinkBehavior
  baseUrl?: string
  confirmMessage?: string
  blockedMessage?: string
  blockedNoCopyMessage?: string
  cancelledMessage?: string
  invalidMessage?: string
  openErrorMessage?: string
  openSuccessMessage?: string
}


const canOpenInSystemBrowser = (url: string) => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const copyToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}

const requestOpenConfirmation = async (message: string): Promise<boolean> => {
  if (isTauriEnv) {
    try {
      return await tauriConfirm(message, {
        title: i18n.t('externalLinks.title'),
        kind: 'warning',
      })
    } catch (error) {
      console.error('Failed to show tauri confirm dialog:', error)
    }
  }

  return window.confirm(message)
}

export const openInSystemBrowser = async (url: string) => {
  if (isTauriEnv) {
    await invoke<void>('open_external_url', { url })
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

export const handleExternalNavigation = async (
  rawHref: string,
  options: HandleExternalNavigationOptions
): Promise<ExternalNavigationResult> => {
  const normalized = normalizeHref(rawHref)
  if (!normalized) {
    toast.warning(options.invalidMessage || i18n.t('externalLinks.invalidLink'))
    return 'invalid'
  }

  const resolved = resolveHref(normalized, options.baseUrl || window.location.href)
  if (!shouldBlockNavigation(normalized, window.location.origin)) {
    return 'internal'
  }

  if (options.behavior === 'block' || !canOpenInSystemBrowser(resolved)) {
    const copied = await copyToClipboard(resolved)
    if (copied) {
      toast.info(options.blockedMessage || i18n.t('externalLinks.blockedCopied'))
    } else {
      toast.info(options.blockedNoCopyMessage || i18n.t('externalLinks.blockedNoCopy'))
    }
    return 'blocked'
  }

  if (options.behavior === 'confirm') {
    const confirmed = await requestOpenConfirmation(options.confirmMessage || i18n.t('externalLinks.confirmMessage'))
    if (!confirmed) {
      if (options.cancelledMessage) {
        toast.info(options.cancelledMessage)
      }
      return 'cancelled'
    }
  }

  try {
    await openInSystemBrowser(resolved)
    if (options.openSuccessMessage) {
      toast.success(options.openSuccessMessage)
    }
    return 'opened'
  } catch (error) {
    console.error('Failed to open external link:', error)
    toast.error(options.openErrorMessage || i18n.t('externalLinks.openFailed'))
    return 'blocked'
  }
}
