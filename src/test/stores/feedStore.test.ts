import { describe, it, expect, beforeEach } from 'vitest'
import { useFeedStore } from '@/stores/feedStore'
import { Feed, Article } from '@/types'

describe('FeedStore', () => {
  beforeEach(() => {
    useFeedStore.getState().reset()
  })

  describe('Feed operations', () => {
    const mockFeed: Feed = {
      id: 1,
      title: 'Test Feed',
      url: 'https://example.com/feed',
      description: 'Test description',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }

    it('should set feeds', () => {
      const { setFeeds } = useFeedStore.getState()
      setFeeds([mockFeed])
      
      const { feeds } = useFeedStore.getState()
      expect(feeds).toHaveLength(1)
      expect(feeds[0].title).toBe('Test Feed')
    })

    it('should add a feed', () => {
      const { addFeed } = useFeedStore.getState()
      addFeed(mockFeed)
      
      const { feeds } = useFeedStore.getState()
      expect(feeds).toHaveLength(1)
      expect(feeds[0].title).toBe('Test Feed')
    })

    it('should update a feed', () => {
      const { setFeeds, updateFeed } = useFeedStore.getState()
      setFeeds([mockFeed])
      
      updateFeed(1, { title: 'Updated Feed' })
      
      const { feeds } = useFeedStore.getState()
      expect(feeds[0].title).toBe('Updated Feed')
    })

    it('should delete a feed', () => {
      const { setFeeds, deleteFeed } = useFeedStore.getState()
      setFeeds([mockFeed])
      
      deleteFeed(1)
      
      const { feeds } = useFeedStore.getState()
      expect(feeds).toHaveLength(0)
    })
  })

  describe('Article operations', () => {
    const mockArticle: Article = {
      id: 1,
      feedId: 1,
      title: 'Test Article',
      link: 'https://example.com/article',
      isRead: false,
      isStarred: false,
      isFavorite: false,
      createdAt: '2026-01-01T00:00:00Z',
    }

    it('should set articles', () => {
      const { setArticles } = useFeedStore.getState()
      setArticles([mockArticle])
      
      const { articles } = useFeedStore.getState()
      expect(articles).toHaveLength(1)
      expect(articles[0].title).toBe('Test Article')
    })

    it('should add an article', () => {
      const { addArticle } = useFeedStore.getState()
      addArticle(mockArticle)
      
      const { articles } = useFeedStore.getState()
      expect(articles).toHaveLength(1)
      expect(articles[0].title).toBe('Test Article')
    })

    it('should update an article', () => {
      const { setArticles, updateArticle } = useFeedStore.getState()
      setArticles([mockArticle])
      
      updateArticle(1, { title: 'Updated Article' })
      
      const { articles } = useFeedStore.getState()
      expect(articles[0].title).toBe('Updated Article')
    })

    it('should delete an article', () => {
      const { setArticles, deleteArticle } = useFeedStore.getState()
      setArticles([mockArticle])
      
      deleteArticle(1)
      
      const { articles } = useFeedStore.getState()
      expect(articles).toHaveLength(0)
    })

    it('should mark article as read', () => {
      const { setArticles, updateArticle } = useFeedStore.getState()
      setArticles([mockArticle])
      
      updateArticle(1, { isRead: true })
      
      const { articles } = useFeedStore.getState()
      expect(articles[0].isRead).toBe(true)
    })

    it('should toggle article star', () => {
      const { setArticles, updateArticle } = useFeedStore.getState()
      setArticles([mockArticle])
      
      updateArticle(1, { isStarred: true })
      
      const { articles } = useFeedStore.getState()
      expect(articles[0].isStarred).toBe(true)
    })

    it('should toggle article favorite', () => {
      const { setArticles, updateArticle } = useFeedStore.getState()
      setArticles([mockArticle])
      
      updateArticle(1, { isFavorite: true })
      
      const { articles } = useFeedStore.getState()
      expect(articles[0].isFavorite).toBe(true)
    })
  })

  describe('Settings operations', () => {
    it('should update settings', () => {
      const { setSettings } = useFeedStore.getState()
      setSettings({ theme: 'dark' })
      
      const { settings } = useFeedStore.getState()
      expect(settings.theme).toBe('dark')
    })

    it('should preserve existing settings when updating', () => {
      const { setSettings } = useFeedStore.getState()
      setSettings({ autoUpdate: false })
      setSettings({ theme: 'dark' })
      
      const { settings } = useFeedStore.getState()
      expect(settings.theme).toBe('dark')
      expect(settings.autoUpdate).toBe(false)
    })
  })

  describe('Loading and error states', () => {
    it('should set loading state', () => {
      const { setLoading } = useFeedStore.getState()
      setLoading(true)
      
      const { isLoading } = useFeedStore.getState()
      expect(isLoading).toBe(true)
    })

    it('should set error state', () => {
      const { setError } = useFeedStore.getState()
      setError('Test error')
      
      const { error } = useFeedStore.getState()
      expect(error).toBe('Test error')
    })

    it('should clear error', () => {
      const { setError } = useFeedStore.getState()
      setError('Test error')
      setError(null)
      
      const { error } = useFeedStore.getState()
      expect(error).toBeNull()
    })
  })
})
