import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { Group } from '@/types'
import { Plus, ChevronRight, ChevronDown, Layers } from 'lucide-react'
import { toast } from '@/stores/toastStore'

export default function GroupList({ collapsed = false }: { collapsed?: boolean }) {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<Group[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const location = useLocation()

  useEffect(() => {
    if (isTauriEnv) {
      loadGroups()
    }
  }, [location.pathname]) // Reload when location changes (e.g. after adding/removing)

  const loadGroups = async () => {
    try {
      const groupList = await invoke<Group[]>('get_groups')
      setGroups(groupList)
    } catch (error) {
      console.error('Failed to load groups:', error)
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

  const isActive = (path: string) => location.pathname === path

  if (collapsed) {
    if (groups.length === 0) return null
    
    return (
      <div className="mb-6 space-y-1">
        {groups.map(group => (
          <Link
            key={group.id}
            to={`/group/${group.id}`}
            className={`flex items-center justify-center px-2 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
              isActive(`/group/${group.id}`)
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={group.name}
          >
            <Layers className="w-5 h-5" />
          </Link>
        ))}
      </div>
    )
  }

  if (groups.length === 0 && !isCreating) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {t('groupList.title')}
          </span>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 text-slate-400 hover:text-primary-500 transition-colors"
            title={t('groupList.newGroup')}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-2 mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          {t('groupList.title')}
        </button>
        <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">
                {groups.length}
            </span>
            <button
                onClick={() => setIsCreating(true)}
                className="p-1 text-slate-400 hover:text-primary-500 transition-colors"
                title={t('groupList.newGroup')}
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-1">
          {isCreating && (
            <form onSubmit={handleCreateGroup} className="px-3 py-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={t('groupList.inputPlaceholder')}
                autoFocus
                className="w-full px-2 py-1 text-sm rounded border border-primary-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                onBlur={() => !newGroupName && setIsCreating(false)}
              />
            </form>
          )}

          {groups.map(group => (
            <Link
              key={group.id}
              to={`/group/${group.id}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
                isActive(`/group/${group.id}`)
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span className="font-medium truncate">{group.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
