import { useEffect } from 'react'
import { Article } from '@/types'

type FilterFn = (article: Article) => boolean

export function useArticleUpdateListener(
  setArticles: React.Dispatch<React.SetStateAction<Article[]>>,
  filterFn?: FilterFn
) {
  useEffect(() => {
    const handleArticleUpdate = (e: CustomEvent) => {
      const { id, ...updates } = e.detail
      
      setArticles(prev => {
        const updated = prev.map(a => {
          if (a.id === id) {
            return { ...a, ...updates }
          }
          return a
        })

        if (filterFn) {
          return updated.filter(filterFn)
        }
        return updated
      })
    }

    window.addEventListener('article-updated', handleArticleUpdate as EventListener)
    return () => window.removeEventListener('article-updated', handleArticleUpdate as EventListener)
  }, [setArticles, filterFn])
}
