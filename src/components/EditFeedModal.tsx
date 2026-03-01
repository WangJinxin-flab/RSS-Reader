import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { useFeedStore } from '@/stores/feedStore'
import { toast } from '@/stores/toastStore'
import { Feed } from '@/types'
import { X, Loader2, AlertCircle, Edit2 } from 'lucide-react'

interface EditFeedModalProps {
  isOpen: boolean
  onClose: () => void
  feed: Feed | null
}

export default function EditFeedModal({ isOpen, onClose, feed }: EditFeedModalProps) {
  const { t } = useTranslation()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { setFeeds } = useFeedStore()

  useEffect(() => {
    if (feed) {
      setTitle(feed.title)
      setCategory(feed.category || '')
    }
  }, [feed])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isTauriEnv || !feed) {
      setError(t('addFeed.tauriOnly'))
      return
    }

    if (!title.trim()) {
      setError('Title cannot be empty')
      return
    }

    setIsLoading(true)

    try {
      await invoke('edit_feed', { 
        id: feed.id,
        title: title.trim(),
        category: category.trim() || null
      })
      
      const feeds = await invoke<any[]>('get_feeds')
      setFeeds(feeds)
      
      onClose()
      toast.success(t('editFeed.success'))
    } catch (err) {
      setError(String(err))
      toast.error(t('editFeed.failed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      if (feed) {
        setTitle(feed.title)
        setCategory(feed.category || '')
      }
      setError('')
      onClose()
    }
  }

  if (!isOpen || !feed) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Edit2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t('editFeed.title')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('editFeed.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-4">
            <label 
              htmlFor="feed-title" 
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              {t('editFeed.feedTitle')}
            </label>
            <input
              id="feed-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
              disabled={isLoading}
              autoFocus
            />
          </div>
          
          <div className="mb-4">
            <label 
              htmlFor="feed-category" 
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
            >
              {t('editFeed.group')}
            </label>
            <input
              id="feed-category"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={t('addFeed.categoryPlaceholder')}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-all duration-200 cursor-pointer"
              disabled={isLoading}
            >
              {t('editFeed.cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5"
              disabled={isLoading || !title.trim() || !isTauriEnv}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? t('editFeed.saving') : t('editFeed.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
