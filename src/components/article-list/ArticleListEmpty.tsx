import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ArticleListEmptyProps {
  message: string
  subMessage?: string
  showAddFeed?: boolean
}

export default function ArticleListEmpty({
  message,
  subMessage,
  showAddFeed = false
}: ArticleListEmptyProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center h-full py-16">
      <div className="w-20 h-20 mb-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
        <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {message}
      </h3>
      {subMessage && (
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          {subMessage}
        </p>
      )}
      {showAddFeed && (
        <Link
          to="/"
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-all duration-200 cursor-pointer"
        >
          {t('articleListEmpty.goAddFeed')}
        </Link>
      )}
    </div>
  )
}
