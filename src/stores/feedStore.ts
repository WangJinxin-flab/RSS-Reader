import { create } from 'zustand'
import { Feed, Article, Settings, AppState } from '@/types'
import { invoke } from '@/utils/tauri'

export interface ArticleFilter {
  type: 'all' | 'unread' | 'starred' | 'favorite'
  feedId?: number
}

interface FeedStore extends AppState {
  setFeeds: (feeds: Feed[]) => void
  addFeed: (feed: Feed) => void
  updateFeed: (id: number, updates: Partial<Feed>) => void
  deleteFeed: (id: number) => void
  setCurrentFeed: (feed: Feed | null) => void

  setArticles: (articles: Article[]) => void
  addArticle: (article: Article) => void
  updateArticle: (id: number, updates: Partial<Article>) => void
  deleteArticle: (id: number) => void
  setCurrentArticle: (article: Article | null) => void

  // Unified article actions
  fetchArticles: (filter: ArticleFilter, limit?: number, cursor?: string | null) => Promise<Article[]>
  markArticleRead: (id: number, read: boolean) => Promise<void>
  markArticleStarred: (id: number, starred: boolean) => Promise<void>
  markArticleFavorite: (id: number, favorite: boolean) => Promise<void>
  batchMarkRead: (ids: number[], read?: boolean) => Promise<void>
  toggleArticleStar: (id: number) => Promise<boolean>
  toggleArticleFavorite: (id: number) => Promise<boolean>

  setSettings: (settings: Partial<Settings>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  sortOrder: string
  setSortOrder: (order: string) => void

  reset: () => void
}

const initialState: AppState & { sortOrder: string } = {
  feeds: [],
  articles: [],
  currentFeed: null,
  currentArticle: null,
  settings: {
    theme: 'system',
    autoUpdate: true,
    updateInterval: 15,
    maxArticles: 1000,
  },
  isLoading: false,
  error: null,
  sortOrder: 'date_desc',
}

export const useFeedStore = create<FeedStore>((set) => ({
  ...initialState,

  setFeeds: (feeds) => set({ feeds }),
  
  addFeed: (feed) => set((state) => ({ 
    feeds: [...state.feeds, feed] 
  })),
  
  updateFeed: (id, updates) => set((state) => ({
    feeds: state.feeds.map((feed) =>
      feed.id === id ? { ...feed, ...updates } : feed
    ),
  })),
  
  deleteFeed: (id) => set((state) => ({
    feeds: state.feeds.filter((feed) => feed.id !== id),
  })),
  
  setCurrentFeed: (feed) => set({ currentFeed: feed }),

  setArticles: (articles) => set({ articles }),
  
  addArticle: (article) => set((state) => ({
    articles: [article, ...state.articles],
  })),
  
  updateArticle: (id, updates) => set((state) => ({
    articles: state.articles.map((article) =>
      article.id === id ? { ...article, ...updates } : article
    ),
  })),
  
  deleteArticle: (id) => set((state) => ({
    articles: state.articles.filter((article) => article.id !== id),
  })),
  
  setCurrentArticle: (article) => set({ currentArticle: article }),

  // Unified article actions
  fetchArticles: async (filter, limit = 50, cursor = null) => {
    try {
      const args: Record<string, unknown> = { limit, cursor }
      if (filter.feedId !== undefined) {
        args.feedId = filter.feedId
      }

      let command: string
      switch (filter.type) {
        case 'unread':
          command = 'get_unread_articles'
          break
        case 'starred':
          command = 'get_starred_articles'
          break
        case 'favorite':
          command = 'get_favorite_articles'
          break
        case 'all':
        default:
          command = filter.feedId !== undefined ? 'get_articles' : 'get_articles'
          break
      }

      const articles = await invoke<Article[]>(command, args)
      return articles
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      return []
    }
  },

  markArticleRead: async (id, read) => {
    try {
      await invoke('mark_article_read', { id, isRead: read })
      set((state) => ({
        articles: state.articles.map((article) =>
          article.id === id ? { ...article, isRead: read } : article
        ),
      }))
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('article-updated', {
        detail: { id, isRead: read }
      }))
    } catch (error) {
      console.error('Failed to mark article read:', error)
      throw error
    }
  },

  markArticleStarred: async (id, starred) => {
    try {
      await invoke('toggle_article_star', { id })
      set((state) => ({
        articles: state.articles.map((article) =>
          article.id === id ? { ...article, isStarred: starred } : article
        ),
      }))
      window.dispatchEvent(new CustomEvent('article-updated', {
        detail: { id, isStarred: starred }
      }))
    } catch (error) {
      console.error('Failed to mark article starred:', error)
      throw error
    }
  },

  markArticleFavorite: async (id, favorite) => {
    try {
      await invoke('toggle_article_favorite', { id })
      set((state) => ({
        articles: state.articles.map((article) =>
          article.id === id ? { ...article, isFavorite: favorite } : article
        ),
      }))
      window.dispatchEvent(new CustomEvent('article-updated', {
        detail: { id, isFavorite: favorite }
      }))
    } catch (error) {
      console.error('Failed to mark article favorite:', error)
      throw error
    }
  },

  batchMarkRead: async (ids, read = true) => {
    try {
      for (const id of ids) {
        await invoke('mark_article_read', { id, isRead: read })
      }
      set((state) => ({
        articles: state.articles.map((article) =>
          ids.includes(article.id) ? { ...article, isRead: read } : article
        ),
      }))
      for (const id of ids) {
        window.dispatchEvent(new CustomEvent('article-updated', {
          detail: { id, isRead: read }
        }))
      }
    } catch (error) {
      console.error('Failed to batch mark read:', error)
      throw error
    }
  },

  toggleArticleStar: async (id) => {
    try {
      await invoke('toggle_article_star', { id })
      const article = await invoke<Article | null>('get_article', { id })
      const newState = article?.isStarred ?? false
      set((state) => ({
        articles: state.articles.map((a) =>
          a.id === id ? { ...a, isStarred: newState } : a
        ),
      }))
      window.dispatchEvent(new CustomEvent('article-updated', {
        detail: { id, isStarred: newState }
      }))
      return newState
    } catch (error) {
      console.error('Failed to toggle star:', error)
      throw error
    }
  },

  toggleArticleFavorite: async (id) => {
    try {
      await invoke('toggle_article_favorite', { id })
      const article = await invoke<Article | null>('get_article', { id })
      const newState = article?.isFavorite ?? false
      set((state) => ({
        articles: state.articles.map((a) =>
          a.id === id ? { ...a, isFavorite: newState } : a
        ),
      }))
      window.dispatchEvent(new CustomEvent('article-updated', {
        detail: { id, isFavorite: newState }
      }))
      return newState
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
      throw error
    }
  },

  setSettings: (settings) => set((state) => ({
    settings: { ...state.settings, ...settings },
  })),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  setSortOrder: (order) => set({ sortOrder: order }),
  
  reset: () => set(initialState),
}))
