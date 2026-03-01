import { X, Rss } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AddFeedHeaderProps {
  onClose: () => void
  isLoading?: boolean
}

export default function AddFeedHeader({ onClose, isLoading = false }: AddFeedHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25">
          <Rss className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('addFeed.title')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('addFeed.subtitle')}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        disabled={isLoading}
        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  )
}
