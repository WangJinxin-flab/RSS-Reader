import { useTranslation } from 'react-i18next'

interface ArticleListSelectionBarProps {
  articleCount: number
  selectedCount: number
  onSelectAll: () => void
}

export default function ArticleListSelectionBar({
  articleCount,
  selectedCount,
  onSelectAll
}: ArticleListSelectionBarProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 z-10">
      <input
        type="checkbox"
        checked={articleCount > 0 && selectedCount === articleCount}
        onChange={onSelectAll}
        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500 cursor-pointer"
      />
      <span className="text-sm text-slate-600 dark:text-slate-300">
        {selectedCount > 0 ? t('articleListSelectionBar.selected', { count: selectedCount }) : t('articleListSelectionBar.selectAll')}
        <span className="text-slate-400 dark:text-slate-500 ml-1">
          ({t('articleListSelectionBar.totalArticles', { count: articleCount })})
        </span>
      </span>
    </div>
  )
}
