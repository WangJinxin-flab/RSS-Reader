import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Rule, RuleConditions, RuleAction, RuleCondition } from '@/types/rule'
import { useSettingsStore } from '@/stores/settingsStore'
import { useFeedStore } from '@/stores/feedStore'

interface RuleEditorProps {
  rule?: Rule
  onSave: (name: string, conditions: string, actions: string, isActive: boolean) => Promise<void>
  onCancel: () => void
}

function normalizeActionsForSave(actions: RuleAction[]): RuleAction[] {
  return actions.map(action => {
    if (action.type !== 'ai_score') {
      return action
    }

    const normalized: RuleAction = { type: 'ai_score' }

    if (action.aiProfileId) {
      normalized.aiProfileId = action.aiProfileId
    }

    if (action.prompt) {
      normalized.prompt = action.prompt
    }

    return normalized
  })
}

export default function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
  const { t } = useTranslation()
  const aiProfiles = useSettingsStore(state => state.aiProfiles)
  const feeds = useFeedStore(state => state.feeds)
  
  const [name, setName] = useState(rule?.name || '')
  const [isActive, setIsActive] = useState(rule ? rule.isActive : true)
  
  const [conditionsData, setConditionsData] = useState<RuleConditions>(() => {
    if (rule?.conditions) {
      try {
        const parsed = JSON.parse(rule.conditions) as RuleConditions
        const items = parsed.items?.length
          ? parsed.items
          : [{ type: 'title', operator: 'contains', value: '' } as RuleCondition]

        return {
          logic: parsed.logic === 'or' ? 'or' : 'and',
          items,
          onlyUpdatedArticles: !!parsed.onlyUpdatedArticles,
          includeFetchedArticles: !!parsed.includeFetchedArticles && !parsed.onlyUpdatedArticles,
        }
      } catch (e) {
        // ignore invalid rule conditions and fallback to defaults
      }
    }
    return {
      logic: 'and',
      items: [{ type: 'title', operator: 'contains', value: '' } as RuleCondition],
      onlyUpdatedArticles: false,
      includeFetchedArticles: false,
    }
  })
  
  const [actionsData, setActionsData] = useState<RuleAction[]>(() => {
    if (rule?.actions) {
      try { return JSON.parse(rule.actions) } catch (e) { /* ignore */ }
    }
    return [{ type: 'mark_read' }]
  })
  
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return alert(t('ruleEditor.ruleNamePlaceholder'))

    const normalizedActions = normalizeActionsForSave(actionsData)
    const normalizedConditions: RuleConditions = {
      ...conditionsData,
      onlyUpdatedArticles: !!conditionsData.onlyUpdatedArticles,
      includeFetchedArticles: !!conditionsData.includeFetchedArticles && !conditionsData.onlyUpdatedArticles,
    }

    setIsSaving(true)
    try {
      await onSave(
        name.trim(),
        JSON.stringify(normalizedConditions),
        JSON.stringify(normalizedActions),
        isActive
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-xl">
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
        {rule ? t('ruleEditor.editRule') : t('ruleEditor.createRule')}
      </h3>

      <div className="space-y-6">
        {/* Name and Active */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{t('ruleEditor.ruleName')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('ruleEditor.ruleNamePlaceholder')}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
            />
          </div>
          <div className="pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
              />
              <span className="text-slate-700 dark:text-slate-300">{t('ruleEditor.enabled')}</span>
            </label>
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="text-slate-900 dark:text-white font-medium">{t('ruleEditor.conditions')}</span>
              <select
                value={conditionsData.logic}
                onChange={e => setConditionsData(prev => ({ ...prev, logic: e.target.value as 'and' | 'or' }))}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
              >
                <option value="and">{t('ruleEditor.matchAll')}</option>
                <option value="or">{t('ruleEditor.matchAny')}</option>
              </select>
            </div>
            <button
              onClick={() => setConditionsData(prev => ({
                ...prev,
                items: [...prev.items, { type: 'title', operator: 'contains', value: '' }]
              }))}
              className="text-sm text-primary-600 dark:text-blue-400 hover:text-primary-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('ruleEditor.addCondition')}
            </button>
          </div>

          <div className="flex flex-wrap gap-5 items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700/70">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(conditionsData.includeFetchedArticles)}
                onChange={e =>
                  setConditionsData(prev => ({
                    ...prev,
                    includeFetchedArticles: e.target.checked,
                    onlyUpdatedArticles: e.target.checked ? false : Boolean(prev.onlyUpdatedArticles)
                  }))
                }
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
              />
              {t('ruleEditor.includeExisting')}
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(conditionsData.onlyUpdatedArticles)}
                onChange={e =>
                  setConditionsData(prev => ({
                    ...prev,
                    onlyUpdatedArticles: e.target.checked,
                    includeFetchedArticles: e.target.checked ? false : Boolean(prev.includeFetchedArticles)
                  }))
                }
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
              />
              {t('ruleEditor.onlyNew')}
            </label>
          </div>

          <div className="space-y-3">
            {conditionsData.items.map((condition, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <select
                  value={condition.type}
                  onChange={e => {
                    const newType = e.target.value as any;
                    const items = [...conditionsData.items];
                    items[idx] = { 
                      ...items[idx], 
                      type: newType, 
                      operator: newType === 'ai_prompt' ? 'ai_match' : 'contains'
                    };
                    setConditionsData({ ...conditionsData, items });
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 w-32 shrink-0"
                >
                  <option value="title">{t('ruleEditor.fieldTitle')}</option>
                  <option value="content">{t('ruleEditor.fieldContent')}</option>
                  <option value="author">{t('ruleEditor.fieldAuthor')}</option>
                  <option value="feed_id">{t('ruleEditor.fieldFeed')}</option>
                  <option value="ai_prompt">{t('ruleEditor.fieldAI')}</option>
                </select>
                
                {condition.type !== 'ai_prompt' && (
                  <select
                    value={condition.operator}
                    onChange={e => {
                      const items = [...conditionsData.items];
                      items[idx] = { ...items[idx], operator: e.target.value as any };
                      setConditionsData({ ...conditionsData, items });
                    }}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 w-32 shrink-0"
                  >
                    {condition.type === 'feed_id' ? (
                      <option value="equals">{t('ruleEditor.opEquals')}</option>
                    ) : (
                      <>
                        <option value="contains">{t('ruleEditor.opContains')}</option>
                        <option value="not_contains">{t('ruleEditor.opNotContains')}</option>
                        <option value="equals">{t('ruleEditor.opEquals')}</option>
                      </>
                    )}
                  </select>
                )}
                
                {condition.type === 'feed_id' ? (
                  <select
                    value={condition.value}
                    onChange={e => {
                      const items = [...conditionsData.items];
                      items[idx] = { ...items[idx], value: e.target.value };
                      setConditionsData({ ...conditionsData, items });
                    }}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                  >
                    <option value="">{t('ruleEditor.selectFeed')}</option>
                    {feeds.map(f => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                ) : condition.type === 'ai_prompt' ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea
                      value={condition.value}
                      onChange={e => {
                        const items = [...conditionsData.items];
                        items[idx] = { ...items[idx], value: e.target.value };
                        setConditionsData({ ...conditionsData, items });
                      }}
                      placeholder={t('ruleEditor.aiPromptPlaceholder')}
                      rows={2}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 resize-none"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      System will automatically append JSON format constraints:
                      <code className="mx-1 px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {"{\"match\": true, \"reason\": \"...\"}"}
                      </code>
                      . Please do not request Markdown blocks or extra text in your prompt.
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={condition.aiProfileId || ''}
                        onChange={e => {
                          const items = [...conditionsData.items];
                          items[idx] = { ...items[idx], aiProfileId: e.target.value };
                          setConditionsData({ ...conditionsData, items });
                        }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 min-w-0 flex-1 sm:flex-none sm:w-64"
                      >
                        <option value="">{t('featureMapping.selectProfile')}</option>
                        {aiProfiles.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.provider})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={condition.tokenLimit ?? 3000}
                        onChange={e => {
                          const items = [...conditionsData.items];
                          items[idx] = { ...items[idx], tokenLimit: parseInt(e.target.value, 10) || 3000 };
                          setConditionsData({ ...conditionsData, items });
                        }}
                        placeholder="Token Truncation Limit"
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 w-32"
                        title="Token Truncation Limit"
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-500">Token limit</span>
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={condition.value}
                    onChange={e => {
                      const items = [...conditionsData.items];
                      items[idx] = { ...items[idx], value: e.target.value };
                      setConditionsData({ ...conditionsData, items });
                    }}
                    placeholder={t('ruleEditor.inputMatch')}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                  />
                )}

                <button
                  onClick={() => {
                    const items = conditionsData.items.filter((_, i) => i !== idx);
                    if (items.length === 0) items.push({ type: 'title', operator: 'contains', value: '' });
                    setConditionsData({ ...conditionsData, items });
                  }}
                  className="p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                  title={t('ruleEditor.deleteCondition')}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-900 dark:text-white font-medium">{t('ruleEditor.actions')}</span>
            <button
              onClick={() => setActionsData([...actionsData, { type: 'mark_read' }])}
              className="text-sm text-primary-600 dark:text-blue-400 hover:text-primary-700 dark:hover:text-blue-300 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('ruleEditor.addAction')}
            </button>
          </div>

          <div className="space-y-3">
            {actionsData.map((action, idx) => (
              <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-start">
                <select
                  value={action.type}
                  onChange={e => {
                    const acts = [...actionsData];
                    acts[idx] = { type: e.target.value as any };
                    setActionsData(acts);
                  }}
                  className="w-full sm:w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                >
                  <option value="mark_read">{t('ruleEditor.actionMarkRead')}</option>
                  <option value="star">{t('ruleEditor.actionMarkStar')}</option>
                  <option value="add_tag">{t('ruleEditor.actionAddTag')}</option>
                  <option value="add_group">{t('ruleEditor.actionAddToGroup')}</option>
                  <option value="ai_score">AI Relevance Score</option>
                </select>

                <div className="min-w-0">
                  {(action.type === 'add_tag' || action.type === 'add_group') && (
                    <input
                      type="text"
                      value={action.value || ''}
                      onChange={e => {
                        const acts = [...actionsData];
                        acts[idx] = { ...acts[idx], value: e.target.value };
                        setActionsData(acts);
                      }}
                      placeholder={action.type === 'add_tag' ? t('ruleEditor.tagName') : t('ruleEditor.groupName')}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                    />
                  )}

                  {action.type === 'ai_score' && (
                    <div className="flex flex-col gap-2 min-w-0">
                      <select
                        value={action.aiProfileId || ''}
                        onChange={e => {
                          const acts = [...actionsData];
                          acts[idx] = { ...acts[idx], aiProfileId: e.target.value };
                          setActionsData(acts);
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
                      >
                        <option value="">{t('featureMapping.selectProfile')}</option>
                        {aiProfiles.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.provider})</option>
                        ))}
                      </select>
                      <textarea
                        value={action.prompt || ''}
                        onChange={e => {
                          const acts = [...actionsData];
                          acts[idx] = { ...acts[idx], prompt: e.target.value };
                          setActionsData(acts);
                        }}
                        placeholder={t('ruleEditor.aiPromptPlaceholder')}
                        rows={2}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 resize-none"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        System will automatically append JSON format constraints:
                        <code className="mx-1 px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {"{\"score\": 85, \"reason\": \"...\"}"}
                        </code>
                        , where <code className="mx-1 px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">score</code>
                        must be 0-100. Do not request Markdown.
                      </p>
                    </div>
                  )}

                  {(action.type !== 'add_tag' && action.type !== 'add_group' && action.type !== 'ai_score') && (
                    <div className="h-[38px]" />
                  )}
                </div>

                <button
                  onClick={() => {
                    const acts = actionsData.filter((_, i) => i !== idx);
                    if (acts.length === 0) acts.push({ type: 'mark_read' });
                    setActionsData(acts);
                  }}
                  className="justify-self-end p-2 text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                  title={t('ruleEditor.deleteAction')}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-700/50">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          {t('ruleEditor.cancel')}
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t('ruleEditor.saving')}
            </>
          ) : (
            t('ruleEditor.save')
          )}
        </button>
      </div>
    </div>
  )
}
