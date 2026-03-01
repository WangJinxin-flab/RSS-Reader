import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useRuleStore } from '@/stores/ruleStore'
import RuleEditor from './RuleEditor'
import { Rule, RuleConditions, RuleAction } from '@/types/rule'
import { isTauriEnv } from '@/utils/tauri'
import { confirm as tauriConfirm } from '@tauri-apps/plugin-dialog'

async function requestDeleteRuleConfirmation(confirmText: string, titleText: string): Promise<boolean> {
  if (isTauriEnv) {
    try {
      return await tauriConfirm(confirmText, {
        title: titleText,
        kind: 'warning',
      })
    } catch (error) {
      console.error('Failed to show tauri confirm dialog:', error)
    }
  }

  return window.confirm(confirmText)
}

export default function RuleList() {
  const { t } = useTranslation()
  const { rules, fetchRules, createRule, updateRule, deleteRule } = useRuleStore()
  const [editingRule, setEditingRule] = useState<Rule | null | 'new'>(null)

  useEffect(() => {
    fetchRules()
  }, [])

  const handleSave = async (name: string, conditions: string, actions: string, isActive: boolean) => {
    if (editingRule === 'new') {
      await createRule(name, isActive, conditions, actions)
    } else if (editingRule && typeof editingRule !== 'string') {
      await updateRule(editingRule.id, name, isActive, conditions, actions)
    }
    setEditingRule(null)
  }

  const handleDelete = async (id: string) => {
    const confirmed = await requestDeleteRuleConfirmation(t('ruleList.deleteConfirm'), t('ruleList.deleteRule'))
    if (!confirmed) return

    await deleteRule(id)
  }

  const toggleActive = async (rule: Rule) => {
    await updateRule(rule.id, rule.name, !rule.isActive, rule.conditions, rule.actions)
  }

  if (editingRule) {
    return (
      <RuleEditor 
        rule={editingRule === 'new' ? undefined : editingRule} 
        onSave={handleSave} 
        onCancel={() => setEditingRule(null)} 
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-200">{t('ruleList.title')}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('ruleList.description')}</p>
        </div>
        <button
          onClick={() => setEditingRule('new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('ruleList.createRule')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-xl overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <p>{t('ruleList.noRules')}</p>
            <p className="text-sm mt-1">{t('ruleList.noRulesHint')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700/50">
            {rules.map(rule => (
              <div key={rule.id} className="p-5 flex items-center gap-4 hover:bg-slate-100 dark:hover:bg-slate-700/20 transition-colors">
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={() => toggleActive(rule)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-200 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`text-base font-medium ${rule.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}>
                    {rule.name}
                  </h4>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {parseRuleDescription(rule, t)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: 1 }}>
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title={t('ruleList.edit')}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title={t('ruleList.delete')}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function parseRuleDescription(rule: Rule, t: (key: string, options?: any) => string) {
  try {
    const conditions: RuleConditions = JSON.parse(rule.conditions)
    const actions: RuleAction[] = JSON.parse(rule.actions)
    const conditionItems = Array.isArray(conditions.items) && conditions.items.length > 0
      ? conditions.items
      : [{ type: 'title', operator: 'contains', value: '' }]
    
    const condStr = conditionItems.map(c => {
      const typeStr = c.type === 'title' ? t('ruleList.ruleDescription.title') : c.type === 'content' ? t('ruleList.ruleDescription.content') : c.type === 'author' ? t('ruleList.ruleDescription.author') : c.type === 'ai_prompt' ? t('ruleList.ruleDescription.ai') : t('ruleList.ruleDescription.feed')
      const opStr = c.operator === 'contains' ? t('ruleList.ruleDescription.contains') : c.operator === 'not_contains' ? t('ruleList.ruleDescription.notContains') : c.operator === 'ai_match' ? t('ruleList.ruleDescription.judges') : t('ruleList.ruleDescription.equals')
      return `[${typeStr} ${opStr} "${c.value}"]`
    }).join(conditions.logic === 'and' ? ` ${t('ruleList.ruleDescription.and')} ` : ` ${t('ruleList.ruleDescription.or')} `)

    const onlyUpdatedArticles = Boolean(conditions.onlyUpdatedArticles)
    const includeFetchedArticles = Boolean(conditions.includeFetchedArticles) && !onlyUpdatedArticles

    const scopeParts: string[] = []
    if (includeFetchedArticles) {
      scopeParts.push(t('ruleEditor.includeExisting'))
    }
    if (onlyUpdatedArticles) {
      scopeParts.push(t('ruleEditor.onlyNew'))
    }
    const scopeStr = scopeParts.length > 0 ? `; Scope: ${scopeParts.join(', ')}` : ''
    
    const actStr = actions.map(a => {
      if (a.type === 'mark_read') return t('ruleList.ruleDescription.markRead')
      if (a.type === 'star') return t('ruleList.ruleDescription.markStar')
      if (a.type === 'add_tag') return `${t('ruleList.ruleDescription.addTag')}(${a.value})`
      return a.type
    }).join(', ')
    
    return `If ${condStr}${scopeStr}, then ${actStr}`
  } catch (e) {
    return t('ruleList.ruleDescription.parseFailed')
  }
}
