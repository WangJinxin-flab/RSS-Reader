import { Bot, Layout } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import AIProfileManager from '@/components/AIProfileManager'
import FeatureMapping from '@/components/FeatureMapping'

export default function AISettings() {
  const { t } = useTranslation()
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* AI Profiles */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{t('aiSettings.profiles')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('aiSettings.profilesDesc')}</p>
          </div>
        </div>
        <div className="p-4">
          <AIProfileManager />
        </div>
      </section>

      {/* Feature Mapping */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Layout className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{t('aiSettings.featureMapping')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('aiSettings.featureMappingDesc')}</p>
          </div>
        </div>
        <div className="p-4">
          <FeatureMapping />
        </div>
      </section>
    </div>
  )
}
