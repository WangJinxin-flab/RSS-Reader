import { useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { Article } from '@/types'
import ArticleListLayout from '@/components/ArticleListLayout'
import { Virtuoso } from 'react-virtuoso'
import ArticleItem from '@/components/ArticleItem'
import { Search as SearchIcon, Sparkles, Layers } from 'lucide-react'
import { useArticleUpdateListener } from '@/hooks/useArticleUpdateListener'
import { useFeedStore } from '@/stores/feedStore'
import BatchSummaryModal from '@/components/BatchSummaryModal'
import AddToGroupModal from '@/components/AddToGroupModal'

export default function SearchResults() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set())
  const [isBatchSummaryOpen, setIsBatchSummaryOpen] = useState(false)
  const [isAddToGroupOpen, setIsAddToGroupOpen] = useState(false)
  const { feeds } = useFeedStore()
  
  useArticleUpdateListener(setArticles)

  useEffect(() => {
    if (query && isTauriEnv) {
      handleSearch(query)
    }
  }, [query])

  const handleSearch = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const results = await invoke<Article[]>('search_articles', { query: searchQuery })
      setArticles(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectArticle = (articleId: number) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(articleId)) {
        newSet.delete(articleId)
      } else {
        newSet.add(articleId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedArticles.size === articles.length) {
      setSelectedArticles(new Set())
    } else {
      setSelectedArticles(new Set(articles.map(a => a.id)))
    }
  }

  if (isLoading) {
    return (
      <ArticleListLayout>
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
          <header className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
            </div>
          </header>
          <div className="flex-1 p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-xl p-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </ArticleListLayout>
    )
  }

  return (
    <ArticleListLayout>
      <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
        <header className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <SearchIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {t('pages.searchResults.title')}: {query}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {t('pages.searchResults.found', { count: articles.length })}
                </p>
              </div>
            </div>
            
            {selectedArticles.size > 0 && (
              <div className="flex items-center gap-2 animate-fade-in flex-shrink-0 ml-4">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {t('pages.searchResults.selected', { count: selectedArticles.size })}
                </span>
                <button
                  onClick={() => setIsAddToGroupOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium transition-all duration-200 cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsBatchSummaryOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-lg font-medium transition-all duration-200 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedArticles(new Set())}
                  className="px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors cursor-pointer"
                >
                  {t('pages.searchResults.cancel')}
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          {articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16">
              <div className="w-20 h-20 mb-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                <SearchIcon className="w-10 h-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('pages.searchResults.noResults')}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {t('pages.searchResults.noResultsHint')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Selection Bar */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 z-10">
                <input
                  type="checkbox"
                  checked={articles.length > 0 && selectedArticles.size === articles.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedArticles.size > 0 ? t('pages.searchResults.selectedCount', { count: selectedArticles.size }) : t('pages.searchResults.selectAll')}
                  <span className="text-slate-400 dark:text-slate-500 ml-1">
                    ({t('pages.searchResults.totalCount', { count: articles.length })})
                  </span>
                </span>
              </div>

              <div className="flex-1">
                <Virtuoso
                  style={{ height: '100%' }}
                  data={articles}
                  overscan={200}
                  itemContent={(_, article) => {
                  const articleWithFeed = {
                    ...article,
                    feed: feeds.find(f => f.id === article.feedId) || undefined
                  }
                  return (
                    <ArticleItem
                        article={articleWithFeed}
                        isSelected={selectedArticles.has(article.id)}
                        onSelect={handleSelectArticle}
                        linkTarget={`/search/article/${article.id}?q=${encodeURIComponent(query)}`}
                      />
                  )
                }}
                />
              </div>
            </div>
          )}
        </div>
        <AddToGroupModal
          isOpen={isAddToGroupOpen}
          onClose={() => setIsAddToGroupOpen(false)}
          articleIds={Array.from(selectedArticles)}
        />
        <BatchSummaryModal
          isOpen={isBatchSummaryOpen}
          onClose={() => setIsBatchSummaryOpen(false)}
          articles={articles.filter(a => selectedArticles.has(a.id))}
          onComplete={() => {
            handleSearch(query)
          }}
        />
      </div>
    </ArticleListLayout>
  )
}
