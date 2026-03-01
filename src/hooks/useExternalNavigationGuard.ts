import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/settingsStore'
import { shouldBlockNavigation } from '@/utils/linkPolicy'
import { handleExternalNavigation } from '@/utils/externalNavigation'

export function useExternalNavigationGuard() {
  const externalLinkBehavior = useSettingsStore((state) => state.externalLinkBehavior)

  useEffect(() => {
    const handleAnchorInteraction = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const anchor = target.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.dataset.allowExternal === 'true') return

      const rawHref = anchor.getAttribute('href') || ''
      if (!shouldBlockNavigation(rawHref, window.location.origin)) return

      event.preventDefault()
      event.stopPropagation()
      void handleExternalNavigation(rawHref, {
        behavior: externalLinkBehavior,
      })
    }

    document.addEventListener('click', handleAnchorInteraction, true)
    document.addEventListener('auxclick', handleAnchorInteraction, true)

    return () => {
      document.removeEventListener('click', handleAnchorInteraction, true)
      document.removeEventListener('auxclick', handleAnchorInteraction, true)
    }
  }, [externalLinkBehavior])
}
