import { useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFeedStore } from '@/stores/feedStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { invoke } from '@/utils/tauri'
import { toast } from '@/stores/toastStore'
import { Article, Feed } from '@/types'
import ArticleListPage from './ArticleListPage'
import { enqueueAutoSummary } from '@/components/ai/AutoSummaryWorker'

export default function ArticleList() {
  const { t } = useTranslation()
  const { feedId } = useParams<{ feedId: string }>()
  const feeds = useFeedStore(state => state.feeds)
  const setFeeds = useFeedStore(state => state.setFeeds)
  const { rsshubDomain } = useSettingsStore()

  const feedIdNum = feedId ? parseInt(feedId) : undefined
  const feed = feeds.find(f => f.id === feedIdNum)

  const handleBeforeRefresh = useCallback(async () => {
    if (feedIdNum === undefined) return

    let updateError: unknown = null

    try {
      const newArticles = await invoke<Article[]>('update_feed', { feedId: feedIdNum, rsshubDomain })
      enqueueAutoSummary(newArticles.map((a) => a.id))
      window.dispatchEvent(new CustomEvent('ai-work-available'))
    } catch (error) {
      updateError = error
      console.error('Failed to update feed:', error)
      toast.error(t('feedUpdater.updateFailed'))
    }

    try {
      const updatedFeeds = await invoke<Feed[]>('get_feeds')
      setFeeds(updatedFeeds)
    } catch (error) {
      console.error('Failed to refresh feed list:', error)
    }

    if (updateError) {
      throw updateError
    }
  }, [feedIdNum, rsshubDomain, setFeeds])

  return (
    <ArticleListPage
      feedId={feedIdNum}
      title={feed?.title || t('sidebar.feeds')}
      subtitle={feed?.description}
      filter="all"
      basePath={`/feed/${feedId}`}
      emptyMessage={t('pages.allArticles.empty')}
      emptySubMessage={t('pages.allArticles.empty')}
      showRefresh
      beforeRefresh={handleBeforeRefresh}
    />
  )
}
