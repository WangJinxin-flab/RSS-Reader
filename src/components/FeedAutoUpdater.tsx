import { useEffect, useRef } from 'react'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { useSettingsStore } from '@/stores/settingsStore'
import { useFeedStore } from '@/stores/feedStore'
import { enqueueAutoSummary } from '@/components/ai/AutoSummaryWorker'
import { Article } from '@/types'

export function FeedAutoUpdater() {
  const autoUpdate = useSettingsStore(state => state.autoUpdate)
  const updateInterval = useSettingsStore(state => state.updateInterval)
  const rsshubDomain = useSettingsStore(state => state.rsshubDomain)
  const { setFeeds } = useFeedStore()
  const isUpdating = useRef(false)

  useEffect(() => {
    if (!autoUpdate || !isTauriEnv) return

    const doUpdate = async () => {
      if (isUpdating.current) return
      isUpdating.current = true

      try {
        const newArticles = await invoke<Article[]>('update_all_feeds', { rsshubDomain })
        enqueueAutoSummary(newArticles.map((a) => a.id))
        window.dispatchEvent(new CustomEvent('ai-work-available'))

        const feeds = await invoke<any[]>('get_feeds')
        setFeeds(feeds)

        window.dispatchEvent(new CustomEvent('feeds-updated', { detail: { newArticles } }))
      } catch (err) {
        console.error('FeedAutoUpdater: update failed', err)
      } finally {
        isUpdating.current = false
      }
    }

    doUpdate()
    const interval = setInterval(doUpdate, updateInterval * 60 * 1000)
    return () => {
      clearInterval(interval)
    }
  }, [autoUpdate, updateInterval, rsshubDomain, setFeeds])

  return null
}
