import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Article } from '@/types'
import { X, Sparkles, FileText, Layers, Loader2, Copy } from 'lucide-react'
import { useSettingsStore } from '@/stores/settingsStore'
import { toast } from '@/stores/toastStore'
import { batchSummarize } from '@/services/ai'

interface BatchSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  articles: Article[]
  onComplete?: () => void
}

export default function BatchSummaryModal({ isOpen, onClose, articles, onComplete }: BatchSummaryModalProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'one-shot' | 'separate'>('one-shot')
  const [step, setStep] = useState<'config' | 'processing' | 'result'>('config')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [resultContent, setResultContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  
  const { featureMapping, aiProfiles } = useSettingsStore()
  
  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setStep('config')
      setProgress({ current: 0, total: 0 })
      setResultContent('')
      setError(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const profileId = featureMapping.batchSummaryProfileId
  const profile = aiProfiles.find(p => p.id === profileId)
  
  const handleStart = async () => {
    if (!profile) {
      toast.error(t('batchSummary.noProfileConfigured'))
      return
    }

    setStep('processing')
    setProgress({ current: 0, total: articles.length })
    setError(null)

    try {
      const result = await batchSummarize(
        articles,
        mode,
        profile,
        (current, total) => {
          setProgress({ current, total })
        }
      )

      if (mode === 'one-shot' && typeof result === 'string') {
        setResultContent(result)
        setStep('result')
      } else {
        toast.success(t('batchSummary.complete'))
        if (onComplete) onComplete()
        onClose()
      }
    } catch (err: any) {
      console.error('Batch summary failed:', err)
      setError(err.message || t('batchSummary.processFailed'))
      setStep('config') // Go back to config or stay in error state?
    }
  }

  const handleCopyResult = () => {
    navigator.clipboard.writeText(resultContent)
    toast.success(t('batchSummary.copiedToClipboard'))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`w-full ${step === 'result' ? 'max-w-4xl h-[80vh]' : 'max-w-md'} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-all duration-300`}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            {step === 'config' && t('batchSummary.title')}
            {step === 'processing' && t('batchSummary.generating')}
            {step === 'result' && t('batchSummary.report')}
          </h3>
          <div className="flex items-center gap-2">
            {step === 'result' && (
              <button
                onClick={handleCopyResult}
                className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                title={t('batchSummary.copyContent')}
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'config' && (
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('batchSummary.selectedArticles', { count: articles.length })}。{t('batchSummary.selectMode')}：
                </p>
                
                {!profile ? (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
                    {t('batchSummary.noProfileConfigured')}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    {t('batchSummary.useProfile')}: {profile.name} ({profile.model})
                  </div>
                )}
                
                {error && (
                   <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-800">
                    {t('batchSummary.error')}: {error}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => setMode('one-shot')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'one-shot'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${mode === 'one-shot' ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className={`font-semibold ${mode === 'one-shot' ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {t('batchSummary.generateReport')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('batchSummary.generateReportDesc')}
                  </p>
                </button>

                <button
                  onClick={() => setMode('separate')}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    mode === 'separate'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${mode === 'separate' ? 'bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <span className={`font-semibold ${mode === 'separate' ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      {t('batchSummary.summarizeEach')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {t('batchSummary.summarizeEachDesc')}
                  </p>
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center justify-center p-12 space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-purple-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-500/50" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-lg font-medium text-slate-900 dark:text-white">
                  {t('batchSummary.generating')}
                </h4>
                {mode === 'separate' && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('batchSummary.progress')}: {progress.current} / {progress.total}
                  </p>
                )}
                {mode === 'one-shot' && (
                   <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('batchSummary.analyzing')}
                  </p>
                )}
              </div>
              
              {mode === 'separate' && (
                <div className="w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-300 ease-out"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {step === 'result' && (
             <div className="p-6 prose prose-slate dark:prose-invert max-w-none">
               <div className="whitespace-pre-wrap">
                 {resultContent}
               </div>
             </div>
          )}
        </div>

        {/* Footer */}
        {step === 'config' && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
            >
              {t('batchSummary.cancel')}
            </button>
            <button
              onClick={handleStart}
              disabled={!profile}
              className="px-6 py-2 text-sm bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {t('batchSummary.startGenerate')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
