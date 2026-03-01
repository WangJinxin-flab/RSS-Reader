import { create } from 'zustand'

export type AiUiTaskStatus = 'pending' | 'processing' | 'failed'

export interface AiUiTask {
  key: string
  status: AiUiTaskStatus
  error?: string
}

interface AiTaskUiStore {
  tasksByArticleId: Record<number, AiUiTask[]>
  setPending: (articleId: number, key: string) => void
  setProcessing: (articleId: number, key: string) => void
  setFailed: (articleId: number, key: string, error: string) => void
  clearTask: (articleId: number, key: string) => void
  clearArticle: (articleId: number) => void
  reset: () => void
}

export const useAiTaskUiStore = create<AiTaskUiStore>((set) => ({
  tasksByArticleId: {},
  setPending: (articleId, key) => {
    set((state) => {
      const existing = state.tasksByArticleId[articleId] ?? []
      const index = existing.findIndex((t) => t.key === key)
      const task: AiUiTask = { key, status: 'pending' }

      const next =
        index === -1 ? [...existing, task] : existing.map((t, i) => (i === index ? task : t))

      return { tasksByArticleId: { ...state.tasksByArticleId, [articleId]: next } }
    })
  },
  setProcessing: (articleId, key) => {
    set((state) => {
      const existing = state.tasksByArticleId[articleId] ?? []
      const index = existing.findIndex((t) => t.key === key)
      const task: AiUiTask = { key, status: 'processing' }

      const next =
        index === -1 ? [...existing, task] : existing.map((t, i) => (i === index ? task : t))

      return { tasksByArticleId: { ...state.tasksByArticleId, [articleId]: next } }
    })
  },
  setFailed: (articleId, key, error) => {
    set((state) => {
      const existing = state.tasksByArticleId[articleId] ?? []
      const index = existing.findIndex((t) => t.key === key)
      const task: AiUiTask = { key, status: 'failed', error }

      const next =
        index === -1 ? [...existing, task] : existing.map((t, i) => (i === index ? task : t))

      return { tasksByArticleId: { ...state.tasksByArticleId, [articleId]: next } }
    })
  },
  clearTask: (articleId, key) => {
    set((state) => {
      const existing = state.tasksByArticleId[articleId]
      if (!existing) {
        return state
      }

      const next = existing.filter((t) => t.key !== key)
      if (next.length === 0) {
        const { [articleId]: _removed, ...rest } = state.tasksByArticleId
        return { tasksByArticleId: rest }
      }

      return { tasksByArticleId: { ...state.tasksByArticleId, [articleId]: next } }
    })
  },
  clearArticle: (articleId) => {
    set((state) => {
      if (!state.tasksByArticleId[articleId]) {
        return state
      }

      const { [articleId]: _removed, ...rest } = state.tasksByArticleId
      return { tasksByArticleId: rest }
    })
  },
  reset: () => set({ tasksByArticleId: {} }),
}))

