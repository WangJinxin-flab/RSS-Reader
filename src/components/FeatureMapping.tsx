import { useSettingsStore } from '@/stores/settingsStore';
import { useTranslation } from 'react-i18next';
import { Bot, Globe, Layout } from 'lucide-react';

export default function FeatureMapping() {
  const { t } = useTranslation();
  const { 
    aiProfiles, 
    featureMapping, 
    setFeatureMapping,
    summaryPosition,
    setSummaryPosition,
    translationPosition,
    setTranslationPosition,
    autoSummarizeUnread,
    setAutoSummarizeUnread,
    autoSummarizeNewArticles,
    setAutoSummarizeNewArticles,
    targetLanguage,
    setTargetLanguage
  } = useSettingsStore();

  const handleProfileChange = (feature: keyof typeof featureMapping, profileId: string) => {
    setFeatureMapping({ [feature]: profileId });
  };

  if (aiProfiles.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
        {t('featureMapping.createProfileFirst')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {/* Summary Feature */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">{t('featureMapping.articleSummary')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('featureMapping.summaryDesc')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('featureMapping.selectProfile')}
              </label>
              <select
                value={featureMapping.summaryProfileId}
                onChange={(e) => handleProfileChange('summaryProfileId', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="">{t('featureMapping.disabled')}</option>
                {aiProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.model})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{t('featureMapping.autoSummarizeUnread')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('featureMapping.autoSummarizeUnreadDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSummarizeUnread}
                  onChange={(e) => setAutoSummarizeUnread(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{t('featureMapping.autoSummarizeNew')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('featureMapping.autoSummarizeNewDesc')}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSummarizeNewArticles}
                  onChange={(e) => setAutoSummarizeNewArticles(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-500"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  {t('featureMapping.summaryPosition')}
                </div>
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                <button
                  onClick={() => setSummaryPosition('top')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                    summaryPosition === 'top' 
                      ? 'bg-white dark:bg-slate-600 text-primary-500 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t('featureMapping.articleTop')}
                </button>
                <button
                  onClick={() => setSummaryPosition('sidebar')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                    summaryPosition === 'sidebar' 
                      ? 'bg-white dark:bg-slate-600 text-primary-500 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t('featureMapping.sidebar')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Translation Feature */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">{t('featureMapping.fullTranslation')}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('featureMapping.translationDesc')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('featureMapping.selectProfile')}
              </label>
              <select
                value={featureMapping.translationProfileId}
                onChange={(e) => handleProfileChange('translationProfileId', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              >
                <option value="">{t('featureMapping.disabled')}</option>
                {aiProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name} ({profile.model})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('featureMapping.targetLanguage')}
              </label>
              <input
                type="text"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                placeholder={t('featureMapping.targetLanguagePlaceholder')}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                <div className="flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  {t('featureMapping.translationPosition')}
                </div>
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                <button
                  onClick={() => setTranslationPosition('top')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                    translationPosition === 'top' 
                      ? 'bg-white dark:bg-slate-600 text-primary-500 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t('featureMapping.articleTop')}
                </button>
                <button
                  onClick={() => setTranslationPosition('sidebar')}
                  className={`flex-1 px-3 py-1.5 rounded-md text-sm transition-all ${
                    translationPosition === 'sidebar' 
                      ? 'bg-white dark:bg-slate-600 text-primary-500 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t('featureMapping.sidebar')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
