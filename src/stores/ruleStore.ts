import { create } from 'zustand'
import { invoke } from '@/utils/tauri'
import { Rule, AiTask } from '@/types/rule'
import { createAsyncActions } from '@/utils/asyncStore'

interface RuleState {
  rules: Rule[]
  isLoading: boolean
  error: string | null

  fetchRules: () => Promise<void>
  createRule: (name: string, isActive: boolean, conditions: string, actions: string) => Promise<Rule>
  updateRule: (id: string, name: string, isActive: boolean, conditions: string, actions: string) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  reorderRules: (ruleIds: string[]) => Promise<void>

  getPendingAiTasks: (limit: number) => Promise<AiTask[]>
  updateAiTaskStatus: (id: string, status: string, errorMsg?: string) => Promise<void>
  executeRuleActions: (articleId: number, ruleId: string) => Promise<void>
}

export const useRuleStore = create<RuleState>((set, get) => {
  const asyncActions = createAsyncActions<RuleState>(set)

  return {
    rules: [],
    isLoading: false,
    error: null,

    fetchRules: async () => {
      asyncActions.setLoading(true)
      asyncActions.clearError()
      try {
        const rules = await invoke<Rule[]>('get_rules')
        set({ rules })
      } catch (error) {
        asyncActions.setError(String(error))
        console.error('Failed to fetch rules:', error)
      } finally {
        asyncActions.setLoading(false)
      }
    },

    createRule: async (name, isActive, conditions, actions) => {
      try {
        const newRule = await invoke<Rule>('create_rule', { name, isActive, conditions, actions })
        await get().fetchRules()
        return newRule
      } catch (error) {
        console.error('Failed to create rule:', error)
        throw error
      }
    },

    updateRule: async (id, name, isActive, conditions, actions) => {
      try {
        await invoke('update_rule', { id, name, isActive, conditions, actions })
        await get().fetchRules()
      } catch (error) {
        console.error('Failed to update rule:', error)
        throw error
      }
    },

    deleteRule: async (id) => {
      try {
        await invoke('delete_rule', { id })
        await get().fetchRules()
      } catch (error) {
        console.error('Failed to delete rule:', error)
        throw error
      }
    },

    reorderRules: async (ruleIds) => {
      try {
        await invoke('reorder_rules', { ruleIds })
        await get().fetchRules()
      } catch (error) {
        console.error('Failed to reorder rules:', error)
        throw error
      }
    },

    getPendingAiTasks: async (limit) => {
      try {
        return await invoke<AiTask[]>('get_pending_ai_tasks', { limit })
      } catch (error) {
        console.error('Failed to get pending AI tasks:', error)
        return []
      }
    },

    updateAiTaskStatus: async (id, status, errorMsg) => {
      try {
        await invoke('update_ai_task_status', { id, status, errorMsg: errorMsg || null })
      } catch (error) {
        console.error('Failed to update AI task status:', error)
      }
    },

    executeRuleActions: async (articleId, ruleId) => {
      try {
        await invoke('execute_rule_actions', { articleId, ruleId })
      } catch (error) {
        console.error('Failed to execute rule actions:', error)
        throw error
      }
    },
  }
})
