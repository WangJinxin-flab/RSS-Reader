import { useEffect, useRef } from 'react'
import { invoke } from '@/utils/tauri'
import { useSettingsStore } from '@/stores/settingsStore'
import { Article } from '@/types'
import { useAiTaskUiStore } from '@/stores/aiTaskUiStore'
import { Rule, RuleConditions, RuleAction, AiTask } from '@/types/rule'

export function AiTaskWorker() {
  const aiProfiles = useSettingsStore(state => state.aiProfiles)
  const isProcessing = useRef(false)

  useEffect(() => {
    const processTasks = async () => {
      if (isProcessing.current) return
      isProcessing.current = true

      try {
        const tasks = await invoke<AiTask[]>('get_pending_ai_tasks', { limit: 5 })
        if (!tasks || tasks.length === 0) {
          isProcessing.current = false
          return
        }

        const rules = await invoke<Rule[]>('get_rules')
        const rulesMap = new Map(rules.map(r => [r.id, r]))

        // 为所有 pending 任务设置 UI 状态
        for (const task of tasks) {
          const taskType = task.taskType || 'condition'
          const uiTaskKey = taskType === 'action_score'
            ? `rule:score:${task.ruleId}`
            : `rule:condition:${task.ruleId}`
          useAiTaskUiStore.getState().setPending(task.articleId, uiTaskKey)
        }

        for (const task of tasks) {
          const taskType = task.taskType || 'condition'
          const uiTaskKey = taskType === 'action_score'
            ? `rule:score:${task.ruleId}`
            : `rule:condition:${task.ruleId}`

          try {
            useAiTaskUiStore.getState().setProcessing(task.articleId, uiTaskKey)
            await invoke('update_ai_task_status', { id: task.id, status: 'processing', errorMsg: null })

            const article = await invoke<Article | null>('get_article', { id: task.articleId })
            if (!article) throw new Error('Article not found')

            const content = article.content || article.summary || article.title || ''
            
            let matchedProfileId: string | undefined
            let promptText = ''
            let tokenLimit = 3000
            
            if (taskType === 'condition') {
              const rule = rulesMap.get(task.ruleId)
              if (!rule) throw new Error('Rule not found')
              
              const conditions: RuleConditions = JSON.parse(rule.conditions)
              const aiCondition = conditions.items.find(c => c.type === 'ai_prompt')
              
              if (!aiCondition) {
                await invoke('update_ai_task_status', { id: task.id, status: 'done', errorMsg: null })
                useAiTaskUiStore.getState().clearTask(task.articleId, uiTaskKey)
                continue
              }
              
              matchedProfileId = aiCondition.aiProfileId
              tokenLimit = aiCondition.tokenLimit || 3000
              promptText = `Evaluate if this article matches the condition: ${aiCondition.value}. Return JSON: { "match": true, "reason": "..." }`
            } else if (taskType === 'action_score') {
              if (!task.actionConfig) throw new Error('Missing action config')
              
              const action: RuleAction = JSON.parse(task.actionConfig)
              matchedProfileId = action.aiProfileId
              promptText = `Score this article 0-100 based on the following criteria: ${action.prompt}. Return JSON: { "score": 85, "reason": "..." }`
              
              const rule = rulesMap.get(task.ruleId)
              if (rule) {
                try {
                  const conditions: RuleConditions = JSON.parse(rule.conditions)
                  const aiCondition = conditions.items.find(c => c.type === 'ai_prompt')
                  if (aiCondition?.tokenLimit) {
                    tokenLimit = aiCondition.tokenLimit
                  }
                } catch (e) {
                  // Ignore parse error
                }
              }
            }

            const profile = aiProfiles.find(p => p.id === matchedProfileId) || 
                            aiProfiles[0]
                            
            if (!profile || !profile.apiKey) {
              throw new Error('No valid AI profile or API key found')
            }

            const truncatedContent = content.length > tokenLimit ? content.slice(0, tokenLimit) : content
            const fullPrompt = `${promptText}\n\nArticle Title: ${article.title}\nArticle Content: ${truncatedContent}`

            const responseText = await callAiApi(profile, fullPrompt)
            
            const jsonStrMatch = responseText.match(/\{[\s\S]*\}/)
            if (!jsonStrMatch) throw new Error('Failed to parse AI response as JSON')
            
            const result = JSON.parse(jsonStrMatch[0])

            if (taskType === 'condition') {
              if (result.match) {
                await invoke('execute_rule_actions', { articleId: task.articleId, ruleId: task.ruleId })
              }
            } else if (taskType === 'action_score') {
              const score = typeof result.score === 'number' ? result.score : parseInt(result.score, 10)
              if (isNaN(score)) throw new Error('Invalid score returned by AI')
              
              const rule = rulesMap.get(task.ruleId)
              await invoke('save_article_score', {
                articleId: task.articleId,
                ruleId: task.ruleId,
                score: score,
                badgeName: rule?.name || null,
                badgeColor: null,
                badgeIcon: null
              })
            }

            await invoke('update_ai_task_status', { id: task.id, status: 'done', errorMsg: null })
            useAiTaskUiStore.getState().clearTask(task.articleId, uiTaskKey)

          } catch (err: any) {
            console.error('Task failed:', task.id, err)
            await invoke('update_ai_task_status', { id: task.id, status: 'failed', errorMsg: err.message || 'Unknown error' })
            useAiTaskUiStore.getState().setFailed(task.articleId, uiTaskKey, err.message || 'Unknown error')
          }
        }
      } catch (e) {
        console.error('Failed to process AI tasks', e)
      } finally {
        isProcessing.current = false
      }
    }

    const handleWorkAvailable = () => {
      void processTasks()
    }

    window.addEventListener('ai-work-available', handleWorkAvailable)

    const interval = setInterval(processTasks, 10000)
    processTasks() // Initial run
    return () => {
      clearInterval(interval)
      window.removeEventListener('ai-work-available', handleWorkAvailable)
    }
  }, [aiProfiles])

  return null
}

async function callAiApi(profile: any, prompt: string): Promise<string> {
  const systemPrompt = `You are a helpful assistant that returns ONLY valid JSON. Do not wrap with markdown code blocks if you can avoid it, just return the raw JSON object.`
  
  if (profile.provider === 'anthropic') {
    const baseUrl = profile.baseUrl || 'https://api.anthropic.com/v1'
    const endpoint = baseUrl.endsWith('/messages') ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/messages`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': profile.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: profile.model,
        messages: [{ role: 'user', content: prompt }],
        system: systemPrompt,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`)
    }

    const data = await response.json()
    const textBlock = data.content?.find((block: any) => block.type === 'text')
    return textBlock?.text || '{}'
  } else {
    const response = await fetch(`${profile.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: profile.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error?.message || `API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || '{}'
  }
}
