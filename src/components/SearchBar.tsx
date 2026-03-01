import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { Article } from '@/types'
import { useSearchHistoryStore } from '@/stores/searchHistoryStore'
import { Search, X, FileText, Loader2, Clock } from 'lucide-react'

export default function SearchBar() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Article[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistoryStore()
  const navigate = useNavigate()

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)
    
    if (!searchQuery.trim()) {
      setResults([])
      setShowResults(history.length > 0)
      return
    }

    if (!isTauriEnv) return

    setIsSearching(true)
    setShowResults(true)
    
    try {
      const articles = await invoke<Article[]>('search_articles', { query: searchQuery })
      setResults(articles)
    } catch (error) {
      console.error('Failed to search articles:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      addToHistory(query)
      navigate(`/search?q=${encodeURIComponent(query)}`)
      setShowResults(false)
    }
  }

  const handleBlur = () => {
    // Delay hiding to allow clicking on results
    setTimeout(() => setShowResults(false), 200)
  }

  const handleFocus = () => {
    if (query.trim() || history.length > 0) {
      setShowResults(true)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
        <input
          id="global-search"
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={`${t('search.placeholder')} (⌘K)`}
          className="w-full pl-10 pr-10 py-2.5 bg-slate-100 dark:bg-slate-800 border-0 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all duration-200"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50 animate-slide-down">
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 p-6 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t('search.searching')}</span>
            </div>
          ) : query.trim() === '' && history.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {/* Search History Header */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <h3 className="text-sm font-medium text-slate-900 dark:text-white">{t('search.history')}</h3>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                >
                  {t('search.clear')}
                </button>
              </div>
              
              {/* Search History Items */}
              {history.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <button
                    onClick={() => handleSearch(item.query)}
                    className="flex-1 text-left text-sm text-slate-900 dark:text-white"
                  >
                    {item.query}
                  </button>
                  <button
                    onClick={() => removeFromHistory(item.id)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-slate-500 dark:text-slate-400">
              <FileText className="w-8 h-8 mb-2 opacity-50" />
              <span>{t('search.noResults')}</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {results.slice(0, 5).map((article) => (
                <Link
                  key={article.id}
                  to={`/article/${article.id}`}
                  onClick={() => {
                    setShowResults(false)
                    setQuery('')
                  }}
                  className="block p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                >
                  <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-1 line-clamp-1">
                    {article.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {article.summary || article.content?.substring(0, 100)}
                  </p>
                </Link>
              ))}
              {results.length > 5 && (
                <div className="p-2 text-center text-xs text-slate-400 dark:text-slate-500">
                  {t('search.moreResults', { count: results.length - 5 })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
