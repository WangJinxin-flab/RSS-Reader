import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { useFeedStore } from '@/stores/feedStore'
import { Feed } from '@/types'
import ConfirmDialog from './ConfirmDialog'

export default function FeedList() {
  const { t } = useTranslation()
  const feeds = useFeedStore(state => state.feeds)
  const setFeeds = useFeedStore(state => state.setFeeds)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [feedToDelete, setFeedToDelete] = useState<number | null>(null)

  useEffect(() => {
    loadFeeds()
  }, [])

  const loadFeeds = async () => {
    if (!isTauriEnv) {
      setIsLoading(false)
      return
    }

    try {
      const feedList = await invoke<Feed[]>('get_feeds')
      setFeeds(feedList)
    } catch (error) {
      console.error('Failed to load feeds:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFeed = (feedId: number, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setFeedToDelete(feedId)
    setShowConfirmDialog(true)
  }
  
  const handleConfirmDelete = async () => {
    if (!feedToDelete) return
    
    try {
      await invoke('delete_feed', { id: feedToDelete })
      await loadFeeds()
    } catch (error) {
      console.error('Failed to delete feed:', error)
      alert(t('feedList.deleteFailed') + '：' + error)
    } finally {
      setShowConfirmDialog(false)
      setFeedToDelete(null)
    }
  }
  
  const handleCancelDelete = () => {
    setShowConfirmDialog(false)
    setFeedToDelete(null)
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">
          {t('feedList.loading')}
        </div>
      </div>
    )
  }

  if (!isTauriEnv) {
    return (
      <div className="h-full flex flex-col">
        <header className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('feedList.allFeeds')}
          </h2>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg mb-2">{t('feedList.devMode')}</p>
            <p className="text-sm">{t('feedList.devModeHint')}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('feedList.allFeeds')}
        </h2>
      </header>
      
      <div className="flex-1 overflow-y-auto p-4">
        {feeds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
            <p className="text-lg mb-2">{t('feedList.noFeeds')}</p>
            <p className="text-sm">{t('feedList.noFeedsHint')}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {feeds.map((feed) => (
              <Link
                key={feed.id}
                to={`/feed/${feed.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700 relative group"
              >
                <button
                  onClick={(e) => handleDeleteFeed(feed.id, e)}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={t('feedList.deleteFeed')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 pr-8">
                  {feed.title}
                </h3>
                {feed.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                    {feed.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>
                    {t('feedList.unreadCount', { count: feed.unreadCount || 0 })}
                  </span>
                  {feed.lastUpdated && (
                    <span>{t('feedList.updatedAt')} {new Date(feed.lastUpdated).toLocaleDateString()}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title={t('feedList.deleteFeed')}
        message={t('feedList.deleteConfirm')}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
      />
    </div>
  )
}
