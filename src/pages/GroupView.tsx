import { useParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke } from '@/utils/tauri'
import { Group } from '@/types'
import ArticleListPage from '@/components/ArticleListPage'

export default function GroupView() {
  const { t } = useTranslation()
  const { groupId } = useParams<{ groupId: string }>()
  const [group, setGroup] = useState<Group | null>(null)

  useEffect(() => {
    if (groupId) {
      loadGroup()
    }
  }, [groupId])

  const loadGroup = async () => {
    try {
      const groups = await invoke<Group[]>('get_groups')
      const currentGroup = groups.find(g => g.id === Number(groupId))
      setGroup(currentGroup || null)
    } catch (error) {
      console.error('Failed to load group:', error)
    }
  }

  const handleRemoveFromGroup = useCallback(async (articleIds: number[]) => {
    if (!groupId) return
    for (const articleId of articleIds) {
      await invoke('remove_article_from_group', { articleId, groupId: Number(groupId) })
    }
  }, [groupId])

  if (!group) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-500">{t('pages.groupView.groupNotFound')}</p>
      </div>
    )
  }

  return (
    <ArticleListPage
      title={t('pages.groupView.title', { name: group.name })}
      groupId={Number(groupId)}
      basePath={`/group/${groupId}`}
      emptyMessage={t('pages.groupView.empty')}
      emptySubMessage={t('pages.groupView.emptyHint')}
      onRemoveFromGroup={handleRemoveFromGroup}
    />
  )
}
