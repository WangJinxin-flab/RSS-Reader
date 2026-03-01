import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke, isTauriEnv } from '@/utils/tauri'
import { useFeedStore } from '@/stores/feedStore'
import { Rule, RuleAction } from '@/types/rule'

export default function ArticleListToolbar() {
  const { t } = useTranslation()
  const { sortOrder, setSortOrder } = useFeedStore()
  const [scoreRules, setScoreRules] = useState<Rule[]>([])

  useEffect(() => {
    if (!isTauriEnv) return

    invoke<Rule[]>('get_rules')
      .then((rules) => {
        const filtered = rules.filter((rule) => {
          try {
            const actions: RuleAction[] = JSON.parse(rule.actions)
            return actions.some((a) => a.type === 'ai_score')
          } catch (_e) {
            return false
          }
        })

        setScoreRules(filtered)
      })
      .catch((e) => {
        console.error('Failed to load rules for sorting:', e)
        setScoreRules([])
      })
  }, [])

  const sortOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [
      { value: 'date_desc', label: t('articleListToolbar.byDate') },
    ]

    for (const rule of scoreRules) {
      options.push({ value: `score_desc:${rule.id}`, label: `${t('articleListToolbar.byScore')}：${rule.name}` })
    }

    return options
  }, [scoreRules])

  const normalizedSortOrder = useMemo(() => {
    const valid = new Set(sortOptions.map((o) => o.value))
    if (valid.has(sortOrder)) {
      return sortOrder
    }
    return 'date_desc'
  }, [sortOptions, sortOrder])

  useEffect(() => {
    if (normalizedSortOrder !== sortOrder) {
      setSortOrder(normalizedSortOrder)
    }
  }, [normalizedSortOrder, sortOrder, setSortOrder])

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700/50 text-sm flex-shrink-0">
      <span className="text-slate-500 dark:text-slate-400 font-medium">{t('articleListToolbar.sortBy')}</span>
      <select
        value={normalizedSortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
        className="bg-slate-100 dark:bg-slate-800 border-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 cursor-pointer outline-none rounded-md px-2 py-1 font-medium"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
