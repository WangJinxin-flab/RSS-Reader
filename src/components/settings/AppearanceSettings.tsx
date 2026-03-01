import { Palette } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ThemeToggle from '@/components/ThemeToggle'
import { useSettingsStore } from '@/stores/settingsStore'

export default function AppearanceSettings() {
  const { t } = useTranslation()
  const {
    fontSize,
    setFontSize,
    summaryPosition,
    setSummaryPosition,
    translationPosition,
    setTranslationPosition
  } = useSettingsStore()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700/50">
          <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{t('appearanceSettings.title')}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('appearanceSettings.subtitle')}</p>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-300">{t('appearanceSettings.theme')}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('appearanceSettings.themeDesc')}</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">{t('appearanceSettings.fontSize')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('appearanceSettings.fontSizeDesc')}</p>
              </div>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large' | 'xlarge')}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-700 border-0 rounded-lg text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
              >
                <option value="small">{t('appearanceSettings.small')}</option>
                <option value="medium">{t('appearanceSettings.medium')}</option>
                <option value="large">{t('appearanceSettings.large')}</option>
                <option value="xlarge">{t('appearanceSettings.xlarge')}</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">{t('appearanceSettings.summaryPosition')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('appearanceSettings.summaryPositionDesc')}</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                <button
                  onClick={() => setSummaryPosition('top')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    summaryPosition === 'top'
                      ? 'bg-white dark:bg-slate-600 text-primary-500 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t('appearanceSettings.top')}
                </button>
                <button
                  onClick={() => setSummaryPosition('sidebar')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    summaryPosition === 'sidebar'
                      ? 'bg-white dark:bg-slate-600 text-primary-500 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t('appearanceSettings.sidebar')}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300">{t('appearanceSettings.translationPosition')}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('appearanceSettings.translationPositionDesc')}</p>
              </div>
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                <button
                  onClick={() => setTranslationPosition('top')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    translationPosition === 'top'
                      ? 'bg-white dark:bg-slate-600 text-primary-500 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t('appearanceSettings.top')}
                </button>
                <button
                  onClick={() => setTranslationPosition('sidebar')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                    translationPosition === 'sidebar'
                      ? 'bg-white dark:bg-slate-600 text-primary-500 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t('appearanceSettings.sidebar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
