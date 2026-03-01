import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'

type Theme = 'light' | 'dark' | 'system'

interface ThemeToggleProps {
  compact?: boolean
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { t } = useTranslation()
  const { theme, setTheme } = useSettingsStore()

  useEffect(() => {
    const root = window.document.documentElement
    
    const applyTheme = (newTheme: Theme) => {
      if (newTheme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        root.classList.remove('light', 'dark')
        root.classList.add(systemTheme)
      } else {
        root.classList.remove('light', 'dark')
        root.classList.add(newTheme)
      }
    }

    applyTheme(theme)

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => applyTheme('system')
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const getIcon = () => {
    if (theme === 'light') {
      return <Sun className="w-4 h-4" />
    }
    if (theme === 'dark') {
      return <Moon className="w-4 h-4" />
    }
    return <Monitor className="w-4 h-4" />
  }

  const getLabel = () => {
    if (theme === 'light') return t('themeToggle.light')
    if (theme === 'dark') return t('themeToggle.dark')
    return t('themeToggle.system')
  }

  if (compact) {
    return (
      <button
        onClick={cycleTheme}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-lg border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700 transition-all duration-200"
        title={getLabel()}
      >
        {getIcon()}
        <span>{getLabel()}</span>
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme('light')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
          theme === 'light'
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
        }`}
      >
        <Sun className="w-5 h-5" />
        <span className="font-medium">{t('themeToggle.light')}</span>
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
          theme === 'dark'
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
        }`}
      >
        <Moon className="w-5 h-5" />
        <span className="font-medium">{t('themeToggle.dark')}</span>
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
          theme === 'system'
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-800'
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
        }`}
      >
        <Monitor className="w-5 h-5" />
        <span className="font-medium">{t('themeToggle.system')}</span>
      </button>
    </div>
  )
}
