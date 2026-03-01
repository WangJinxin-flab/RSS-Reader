import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke } from '@/utils/tauri'
import { Tag } from '@/types'
import ArticleListPage from '@/components/ArticleListPage'

export default function TaggedArticles() {
  const { t } = useTranslation()
  const { tagId } = useParams<{ tagId: string }>()
  const [tagName, setTagName] = useState('')

  useEffect(() => {
    if (tagId) {
      loadTagName()
    }
  }, [tagId])

  const loadTagName = async () => {
    try {
      const tags = await invoke<Tag[]>('get_all_tags')
      const tag = tags.find(t => t.id === Number(tagId))
      if (tag) setTagName(tag.name)
    } catch (error) {
      console.error('Failed to load tag name:', error)
    }
  }

  return (
    <ArticleListPage
      title={tagName ? t('pages.taggedArticles.title', { tag: tagName }) : t('pages.taggedArticles.title', { tag: '' })}
      tagId={Number(tagId)}
      basePath={`/tags/${tagId}`}
      emptyMessage={t('pages.taggedArticles.empty')}
      emptySubMessage={t('pages.taggedArticles.emptyHint')}
    />
  )
}
