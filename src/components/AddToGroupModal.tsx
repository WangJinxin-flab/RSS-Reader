import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { Group } from '@/types'
import { X, Layers, Plus, Check } from 'lucide-react'
import { toast } from '@/stores/toastStore'

interface AddToGroupModalProps {
  isOpen: boolean
  onClose: () => void
  articleIds: number[]
}

export default function AddToGroupModal({ isOpen, onClose, articleIds }: AddToGroupModalProps) {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<Group[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && isTauriEnv) {
      loadGroups()
    }
  }, [isOpen])

  const loadGroups = async () => {
    try {
      const groupList = await invoke<Group[]>('get_groups')
      setGroups(groupList)
    } catch (error) {
      console.error('Failed to load groups:', error)
      toast.error(t('addToGroup.loadGroupsFailed'))
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    try {
      await invoke('create_group', { name: newGroupName.trim() })
      setNewGroupName('')
      setIsCreating(false)
      loadGroups()
      toast.success(t('groupList.createSuccess'))
    } catch (error) {
      console.error('Failed to create group:', error)
      toast.error(t('groupList.createFailed'))
    }
  }

  const handleAddToGroup = async (groupId: number) => {
    if (articleIds.length === 0) return

    setIsLoading(true)
    try {
      let successCount = 0
      for (const articleId of articleIds) {
        await invoke('add_article_to_group', { articleId, groupId })
        successCount++
      }
      toast.success(`${t('addToGroup.success')} (${successCount}/${articleIds.length})`)
      onClose()
    } catch (error) {
      console.error('Failed to add to group:', error)
      toast.error(t('addToGroup.failed'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-500" />
            {t('addToGroup.title')}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {isCreating ? (
            <form onSubmit={handleCreateGroup} className="flex gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={t('addToGroup.inputPlaceholder')}
                autoFocus
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-primary-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={!newGroupName.trim()}
                className="px-3 py-2 bg-primary-500 text-white rounded-lg disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 hover:border-primary-500 dark:hover:border-primary-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              {t('addToGroup.newGroup')}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {groups.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              {t('addToGroup.noGroups')}
            </div>
          ) : (
            <div className="space-y-1">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => handleAddToGroup(group.id)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group disabled:opacity-50"
                >
                  <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-200">
                    {group.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200 dark:border-slate-700">
          {t('addToGroup.selectedArticles', { count: articleIds.length })}
        </div>
      </div>
    </div>
  )
}
