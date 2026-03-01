import { Sparkles, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ArticleListSummaryProps {
  autoSummary?: string | null
  isAutoSummarizing?: boolean
  onCloseAutoSummary?: () => void
}

export default function ArticleListSummary({
  autoSummary,
  isAutoSummarizing,
  onCloseAutoSummary
}: ArticleListSummaryProps) {
  const { t } = useTranslation()

  return (
    <>
      {autoSummary && (
        <div className="m-4 mb-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800 animate-fade-in">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-semibold">
              <Sparkles className="w-5 h-5" />
              <span>{t('articleListSummary.title')}</span>
            </div>
            {onCloseAutoSummary && (
              <button
                onClick={onCloseAutoSummary}
                className="text-purple-400 hover:text-purple-600 dark:text-purple-500 dark:hover:text-purple-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="prose prose-sm prose-purple dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {autoSummary}
            </div>
          </div>
          <div className="mt-3 text-xs text-purple-400/80 dark:text-purple-500/80 flex items-center gap-1">
            <span>{t('articleListSummary.description')}</span>
          </div>
        </div>
      )}

      {isAutoSummarizing && (
        <div className="m-4 mb-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span>{t('articleListSummary.generating')}</span>
          </div>
        </div>
      )}
    </>
  )
}
