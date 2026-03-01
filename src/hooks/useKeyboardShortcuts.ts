import { useEffect, useCallback } from 'react'
import i18n from '@/i18n'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSettingsStore, defaultShortcuts } from '@/stores/settingsStore'

interface KeyboardShortcuts {
  onSearch?: () => void
  onAddFeed?: () => void
  onRefresh?: () => void
  onSettings?: () => void
  onNavigateHome?: () => void
  onNavigateBack?: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { shortcuts: config = defaultShortcuts } = useSettingsStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isInputFocused = 
      document.activeElement?.tagName === 'INPUT' || 
      document.activeElement?.tagName === 'TEXTAREA'

    // Meta/Ctrl keys
    if (e.metaKey || e.ctrlKey) {
      if (e.key === config.search) {
        e.preventDefault()
        shortcuts.onSearch?.()
        return
      }
      if (e.key === config.addFeed) {
        e.preventDefault()
        shortcuts.onAddFeed?.()
        return
      }
      if (e.key === config.refresh) {
        e.preventDefault()
        shortcuts.onRefresh?.()
        return
      }
      if (e.key === config.settings) {
        e.preventDefault()
        shortcuts.onSettings?.()
        navigate('/settings')
        return
      }
    }

    if (e.key === 'Escape') {
      if (isInputFocused) {
        (document.activeElement as HTMLElement).blur()
      }
      return
    }

    if (!isInputFocused) {
      // Navigation shortcuts
      if (e.key === config.goHome) {
        e.preventDefault()
        navigate('/')
        shortcuts.onNavigateHome?.()
        return
      }

      // Context-aware shortcuts
      // Only navigate if NOT in article view
      const isArticleView = location.pathname.includes('/article/')

      if (e.key === config.toggleStar) { // 's' by default
        if (!isArticleView) {
          e.preventDefault()
          navigate('/starred')
        }
        // If in article view, do nothing here (let ArticleView handle it)
        return
      }

      if (e.key === config.goFavorites) {
        e.preventDefault()
        navigate('/favorites')
        return
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        shortcuts.onNavigateBack?.()
        if (location.pathname !== '/') {
          navigate(-1)
        }
        return
      }
    }
  }, [navigate, location.pathname, shortcuts, config])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function useGlobalShortcuts() {
  const navigate = useNavigate()
  const location = useLocation()
  const { shortcuts: config = defaultShortcuts } = useSettingsStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInputFocused = 
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA'

      if (e.metaKey || e.ctrlKey) {
        if (e.key === config.search) {
          e.preventDefault()
          const searchInput = document.querySelector<HTMLInputElement>('#global-search')
          searchInput?.focus()
          return
        }
        if (e.key === config.settings) {
          e.preventDefault()
          navigate('/settings')
          return
        }
      }

      if (!isInputFocused) {
        if (e.key === config.goHome) {
          e.preventDefault()
          navigate('/')
          return
        }

        const isArticleView = location.pathname.includes('/article/')

        if (e.key === config.toggleStar) { // 's'
          if (!isArticleView) {
            e.preventDefault()
            navigate('/starred')
          }
          return
        }

        if (e.key === config.goFavorites) {
          e.preventDefault()
          navigate('/favorites')
          return
        }

        if (e.key === '?') {
          e.preventDefault()
          // Update help text dynamically? For now static is fine or could use config keys
          alert(`
${i18n.t('shortcutsHelp.title')}
⌘/Ctrl + ${config.search.toUpperCase()} - ${i18n.t('shortcutsHelp.focusSearch')}
⌘/Ctrl + N - ${i18n.t('shortcutsHelp.addFeed')}
⌘/Ctrl + R - ${i18n.t('shortcutsHelp.refreshAll')}
⌘/Ctrl + ${config.settings} - ${i18n.t('shortcutsHelp.openSettings')}
${config.goHome.toUpperCase()} - ${i18n.t('shortcutsHelp.home')}
${config.toggleStar.toUpperCase()} - ${i18n.t('shortcutsHelp.starredOrToggle')}
${config.goFavorites.toUpperCase()} - ${i18n.t('shortcutsHelp.favorites')}
? - ${i18n.t('shortcutsHelp.showHelp')}
Esc - ${i18n.t('shortcutsHelp.cancelFocus')}
          `)
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate, location.pathname, config])
}
