import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Palette,
  Info,
  Bot,
  Settings as SettingsIcon,
  Keyboard,
  Zap
} from 'lucide-react'
import GeneralSettings from '@/components/settings/GeneralSettings'
import AppearanceSettings from '@/components/settings/AppearanceSettings'
import ShortcutSettings from '@/components/settings/ShortcutSettings'
import AISettings from '@/components/settings/AISettings'
import AutomationSettings from '@/components/settings/AutomationSettings'
import AboutSettings from '@/components/settings/AboutSettings'

type CategoryId = 'general' | 'appearance' | 'ai' | 'about' | 'shortcuts' | 'automation'

interface Category {
  id: CategoryId
  label: string
  icon: React.ElementType
}

// We move the categories array inside the component or use useMemo to access `t`
// but since the component is simple, useMemo is best.

export default function Settings() {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState<CategoryId>('general')

  const categories = useMemo<Category[]>(() => [
    { id: 'general', label: t('settings.tabs.general'), icon: SettingsIcon },
    { id: 'appearance', label: t('settings.tabs.appearance'), icon: Palette },
    { id: 'shortcuts', label: t('settings.tabs.shortcuts'), icon: Keyboard },
    { id: 'ai', label: t('settings.tabs.ai'), icon: Bot },
    { id: 'automation', label: t('settings.tabs.automation'), icon: Zap },
    { id: 'about', label: t('settings.tabs.about'), icon: Info },
  ], [t])

  const renderContent = () => {
    switch (activeCategory) {
      case 'general':
        return <GeneralSettings />
      case 'appearance':
        return <AppearanceSettings />
      case 'shortcuts':
        return <ShortcutSettings />
      case 'ai':
        return <AISettings />
      case 'automation':
        return <AutomationSettings />
      case 'about':
        return <AboutSettings />
    }
  }

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t('settings.title')}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 pl-1">
            {t('settings.subtitle')}
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <category.icon className={`w-5 h-5 ${
                activeCategory === category.id ? 'text-primary-500' : 'text-slate-400'
              }`} />
              {category.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {categories.find(c => c.id === activeCategory)?.label}
            </h1>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
