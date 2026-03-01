import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SearchHistoryItem {
  id: string
  query: string
  timestamp: number
}

interface SearchHistoryStore {
  history: SearchHistoryItem[]
  addToHistory: (query: string) => void
  removeFromHistory: (id: string) => void
  clearHistory: () => void
  getRecentHistory: (limit?: number) => SearchHistoryItem[]
}

const MAX_HISTORY_ITEMS = 10

export const useSearchHistoryStore = create<SearchHistoryStore>()(
  persist(
    (set, get) => ({
      history: [],
      
      addToHistory: (query) => {
        if (!query.trim()) return
        
        const { history } = get()
        const newHistory = [
          {
            id: Date.now().toString(),
            query,
            timestamp: Date.now(),
          },
          ...history.filter(item => item.query !== query),
        ].slice(0, MAX_HISTORY_ITEMS)
        
        set({ history: newHistory })
      },
      
      removeFromHistory: (id) => {
        const { history } = get()
        set({ history: history.filter(item => item.id !== id) })
      },
      
      clearHistory: () => {
        set({ history: [] })
      },
      
      getRecentHistory: (limit = 5) => {
        const { history } = get()
        return history.slice(0, limit)
      },
    }),
    {
      name: 'rss-reader-search-history',
      storage: createJSONStorage(() => localStorage),
    }
  )
)