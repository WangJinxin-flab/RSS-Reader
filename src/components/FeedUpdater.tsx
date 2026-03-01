import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { useFeedStore } from '@/stores/feedStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { enqueueAutoSummary } from '@/components/ai/AutoSummaryWorker'
import { Article } from '@/types'

export default function FeedUpdater() {
  const { t } = useTranslation()
  const [isUpdating, setIsUpdating] = useState(false)
  const [newArticlesCount, setNewArticlesCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { setFeeds } = useFeedStore()
  const { rsshubDomain } = useSettingsStore()

  const handleUpdateAll = async () => {
    if (!isTauriEnv || isUpdating) return

    setIsUpdating(true)
    setNewArticlesCount(0)
    setError(null)

    try {
      const newArticles = await invoke<Article[]>('update_all_feeds', { rsshubDomain })
      setNewArticlesCount(newArticles.length)
      enqueueAutoSummary(newArticles.map((a) => a.id))
      window.dispatchEvent(new CustomEvent('ai-work-available'))

      const feeds = await invoke<any[]>('get_feeds')
      setFeeds(feeds)

      // Dispatch event to refresh article lists
      window.dispatchEvent(new CustomEvent('feeds-updated', { detail: { newArticles } }))

      if (newArticles.length > 0) {
        setTimeout(() => {
          setNewArticlesCount(0)
        }, 3000)
      }
    } catch (err) {
      console.error('Failed to update feeds:', err)
      setError(t('feedUpdater.updateFailed'))
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleUpdateAll}
        disabled={isUpdating || !isTauriEnv}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
        {isUpdating ? t('feedUpdater.updating') : t('feedUpdater.updateAll')}
      </button>
      
      {newArticlesCount > 0 && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-accent-500 text-white text-xs font-semibold rounded-full animate-scale-in shadow-lg">
          <Check className="w-3 h-3" />
          {newArticlesCount}
        </div>
      )}
      
      {error && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-full animate-scale-in shadow-lg">
          <AlertCircle className="w-3 h-3" />
        </div>
      )}
    </div>
  )
}
