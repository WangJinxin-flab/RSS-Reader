import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { useFeedStore } from '@/stores/feedStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { Upload, Download, Check, AlertCircle, Loader2 } from 'lucide-react'

interface OpmlManagerProps {
  compact?: boolean
}

export default function OpmlManager({ compact = false }: OpmlManagerProps) {
  const { t } = useTranslation()
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { setFeeds } = useFeedStore()
  const { rsshubDomain } = useSettingsStore()

  const handleExport = async () => {
    if (!isTauriEnv || isExporting) return

    setIsExporting(true)
    setMessage(null)

    try {
      const opmlContent = await invoke<string>('export_opml')
      
      const blob = new Blob([opmlContent], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rss-subscriptions-${new Date().toISOString().split('T')[0]}.opml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setMessage({ type: 'success', text: t('opml.exportSuccess') })
    } catch (error) {
      console.error('Failed to export OPML:', error)
      setMessage({ type: 'error', text: t('opml.exportFailed') })
    } finally {
      setIsExporting(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !isTauriEnv || isImporting) return

    setIsImporting(true)
    setMessage(null)

    try {
      const content = await file.text()
      const count = await invoke<number>('import_opml', { opmlContent: content, rsshubDomain })
      
      const feeds = await invoke<any[]>('get_feeds')
      setFeeds(feeds)
      
      setMessage({ type: 'success', text: t('opml.importSuccess', { count }) })
    } catch (error) {
      console.error('Failed to import OPML:', error)
      setMessage({ type: 'error', text: t('opml.importFailed') })
    } finally {
      setIsImporting(false)
      event.target.value = ''
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (compact) {
    return (
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="file"
            accept=".opml,.xml"
            onChange={handleImport}
            disabled={isImporting || !isTauriEnv}
            className="hidden"
            id="opml-import"
          />
          
          <label
            htmlFor="opml-import"
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border cursor-pointer transition-all duration-200 ${
              isImporting || !isTauriEnv
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            {isImporting ? t('opml.importing') : t('opml.import')}
          </label>
          
          <button
            onClick={handleExport}
            disabled={isExporting || !isTauriEnv}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-all duration-200 ${
              isExporting || !isTauriEnv
                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? t('opml.exporting') : t('opml.export')}
          </button>
        </div>
        
        {message && (
          <div className={`absolute -top-10 left-0 right-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium animate-slide-down ${
            message.type === 'success' 
              ? 'bg-accent-500 text-white' 
              : 'bg-red-500 text-white'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-3.5 h-3.5" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5" />
            )}
            {message.text}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <input
        type="file"
        accept=".opml,.xml"
        onChange={handleImport}
        disabled={isImporting || !isTauriEnv}
        className="hidden"
        id="opml-import-settings"
      />
      
      <div className="flex gap-3">
        <label
          htmlFor="opml-import-settings"
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 ${
            isImporting || !isTauriEnv
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
          }`}
        >
          {isImporting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Upload className="w-5 h-5" />
          )}
          <span className="font-medium">{isImporting ? t('opml.importing') : `${t('opml.import')} OPML`}</span>
        </label>
        
        <button
          onClick={handleExport}
          disabled={isExporting || !isTauriEnv}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
            isExporting || !isTauriEnv
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 cursor-pointer dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
          }`}
        >
          {isExporting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          <span className="font-medium">{isExporting ? t('opml.exporting') : `${t('opml.export')} OPML`}</span>
        </button>
      </div>
      
      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in ${
          message.type === 'success' 
            ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800' 
            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}
    </div>
  )
}
