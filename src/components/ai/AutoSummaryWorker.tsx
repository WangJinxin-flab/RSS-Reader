import { useEffect, useRef } from 'react'
import { summarizeArticle } from '@/services/ai'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAiTaskUiStore } from '@/stores/aiTaskUiStore'
import { Article } from '@/types'
import { invoke, isTauriEnv } from '@/utils/tauri'

const AUTO_SUMMARY_ENQUEUE_EVENT = 'auto-summary-enqueue'

export function enqueueAutoSummary(articleIds: number[]) {
  if (articleIds.length === 0) return
  window.dispatchEvent(new CustomEvent(AUTO_SUMMARY_ENQUEUE_EVENT, { detail: { articleIds } }))
}

export function AutoSummaryWorker() {
  const aiProfiles = useSettingsStore((state) => state.aiProfiles)
  const featureMapping = useSettingsStore((state) => state.featureMapping)
  const autoSummarizeNewArticles = useSettingsStore((state) => state.autoSummarizeNewArticles)
  const isProcessing = useRef(false)
  const queue = useRef<number[]>([])
  const queued = useRef<Set<number>>(new Set())

  useEffect(() => {
    if (!isTauriEnv) return

    const enqueue = (articleIds: number[]) => {
      if (!autoSummarizeNewArticles) return
      if (!featureMapping.summaryProfileId) return

      for (const id of articleIds) {
        if (queued.current.has(id)) continue
        queued.current.add(id)
        queue.current.push(id)
      }

      void processQueue()
    }

    const processQueue = async () => {
      if (isProcessing.current) return
      isProcessing.current = true

      try {
        while (queue.current.length > 0) {
          const articleId = queue.current.shift()!
          queued.current.delete(articleId)

          const profile = aiProfiles.find((p) => p.id === featureMapping.summaryProfileId)
          if (!profile || !profile.apiKey) {
            useAiTaskUiStore
              .getState()
              .setFailed(articleId, 'summary', 'No valid AI profile or API key found')
            continue
          }

          useAiTaskUiStore.getState().setProcessing(articleId, 'summary')

          try {
            const cached = await invoke<string | null>('get_article_ai_summary', { articleId })
            if (cached) {
              useAiTaskUiStore.getState().clearTask(articleId, 'summary')
              continue
            }

            const article = await invoke<Article | null>('get_article', { id: articleId })
            if (!article) throw new Error('Article not found')

            const content = article.content || article.summary || article.title || ''
            const summary = await summarizeArticle(content, profile)
            await invoke('upsert_article_ai_summary', { articleId, summary })

            useAiTaskUiStore.getState().clearTask(articleId, 'summary')
          } catch (err: any) {
            useAiTaskUiStore
              .getState()
              .setFailed(articleId, 'summary', err.message || 'Unknown error')
          }
        }
      } finally {
        isProcessing.current = false
      }
    }

    const handleEnqueueEvent = (e: Event) => {
      const custom = e as CustomEvent
      const ids = Array.isArray(custom.detail?.articleIds) ? custom.detail.articleIds : []
      enqueue(ids)
    }

    window.addEventListener(AUTO_SUMMARY_ENQUEUE_EVENT, handleEnqueueEvent)

    return () => {
      window.removeEventListener(AUTO_SUMMARY_ENQUEUE_EVENT, handleEnqueueEvent)
    }
  }, [aiProfiles, autoSummarizeNewArticles, featureMapping.summaryProfileId])

  return null
}

