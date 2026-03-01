import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function EmptyView() {
  const { t } = useTranslation()
  return (
    <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">
      <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <FileText className="w-8 h-8" />
      </div>
      <p className="text-sm font-medium">{t('emptyView.goAddFeed')}</p>
    </div>
  )
}
