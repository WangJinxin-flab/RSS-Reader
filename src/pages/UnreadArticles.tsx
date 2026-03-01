import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFeedStore } from '@/stores/feedStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useArticleList } from '@/hooks/useArticleList'
import { batchSummarize } from '@/services/ai'
import { toast } from '@/stores/toastStore'
import ArticleListLayout from '@/components/ArticleListLayout'
import ArticleListContent from '@/components/article-list/ArticleListContent'

export default function UnreadArticles() {
  const { t } = useTranslation()
  const { sortOrder } = useFeedStore()
  const { autoSummarizeUnread, featureMapping, aiProfiles } = useSettingsStore()
  const [autoSummary, setAutoSummary] = useState<string | null>(null)
  const [isAutoSummarizing, setIsAutoSummarizing] = useState(false)
  const hasAttemptedSummaryRef = useRef(false)

  const {
    articles,
    isLoading,
    isMoreLoading,
    hasMore,
    refreshError,
    selectedArticles,
    loadMore,
    refresh,
    handleSelectArticle,
    handleSelectAll,
    clearSelection,
    setArticles
  } = useArticleList({
    filter: 'unread',
    filterFn: (article) => !article.isRead
  })

  // Auto summarization effect
  useEffect(() => {
    const runAutoSummary = async () => {
      if (!autoSummarizeUnread || isLoading || articles.length === 0 || isAutoSummarizing || hasAttemptedSummaryRef.current) {
        return
      }

      hasAttemptedSummaryRef.current = true

      const profileId = featureMapping.batchSummaryProfileId
      const profile = aiProfiles.find(p => p.id === profileId)

      if (!profile) {
        return
      }

      const articleIds = articles.map(a => a.id).sort((a, b) => a - b).join(',')
      const cacheKey = `unread_summary_${articleIds}`

      const cachedSummary = localStorage.getItem(cacheKey)
      if (cachedSummary) {
        setAutoSummary(cachedSummary)
        return
      }

      setIsAutoSummarizing(true)
      toast.info(t('pages.unreadArticles.autoSummarizing'), 3000)

      try {
        const articlesToSummarize = articles.slice(0, 20)
        const result = await batchSummarize(articlesToSummarize, 'one-shot', profile)

        if (typeof result === 'string') {
          setAutoSummary(result)
          localStorage.setItem(cacheKey, result)
        }
      } catch (error) {
        console.error('Auto-summary failed:', error)
      } finally {
        setIsAutoSummarizing(false)
      }
    }

    runAutoSummary()
  }, [articles, isLoading, autoSummarizeUnread, featureMapping, aiProfiles])

  // Reset summary attempt when sort order changes
  useEffect(() => {
    hasAttemptedSummaryRef.current = false
    setAutoSummary(null)
  }, [sortOrder])

  return (
    <ArticleListLayout>
      <ArticleListContent
        title={t('pages.unreadArticles.title')}
        iconType="unread"
        basePath="/unread"
        articles={articles}
        isLoading={isLoading}
        isMoreLoading={isMoreLoading}
        hasMore={hasMore}
        refreshError={refreshError}
        selectedArticles={selectedArticles}
        emptyMessage={t('pages.unreadArticles.empty')}
        emptySubMessage={t('pages.unreadArticles.emptyHint')}
        showRefresh
        autoSummary={autoSummary}
        onCloseAutoSummary={() => setAutoSummary(null)}
        isAutoSummarizing={isAutoSummarizing}
        onLoadMore={loadMore}
        onRefresh={refresh}
        onSelectArticle={handleSelectArticle}
        onSelectAll={handleSelectAll}
        onClearSelection={clearSelection}
        setArticles={setArticles}
      />
    </ArticleListLayout>
  )
}
