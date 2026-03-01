import { useEffect } from 'react'
import { invoke } from '@/utils/tauri'
import { useSettingsStore } from '@/stores/settingsStore'

export function useAutoCleanup() {
  const { autoCleanup, mediaCache } = useSettingsStore()

  useEffect(() => {
    const runCleanup = async () => {
      try {
        if (autoCleanup.enabled) {
          await invoke('clean_articles', {
            days: autoCleanup.maxRetentionDays,
            exceptStarred: autoCleanup.exceptStarred
          })
        }

        if (mediaCache.enabled) {
          await invoke('clean_media_cache', {
            days: mediaCache.maxRetentionDays,
            maxSizeMB: mediaCache.maxCacheSizeMB
          })
        }
      } catch (error) {
        console.error('Auto cleanup failed:', error)
      }
    }

    // Run on mount (app start)
    runCleanup()
  }, [
    autoCleanup.enabled,
    autoCleanup.maxRetentionDays,
    autoCleanup.exceptStarred,
    mediaCache.enabled,
    mediaCache.maxRetentionDays,
    mediaCache.maxCacheSizeMB,
  ])
}
