import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RuleList from '@/components/rules/RuleList'

const deleteRule = vi.fn().mockResolvedValue(undefined)
const fetchRules = vi.fn().mockResolvedValue(undefined)

vi.mock('@/utils/tauri', () => ({
  isTauriEnv: true,
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  confirm: vi.fn().mockResolvedValue(false),
}))

vi.mock('@/stores/ruleStore', () => ({
  useRuleStore: () => ({
    rules: [
      {
        id: 'rule-1',
        name: 'Test Rule',
        isActive: true,
        conditions: '{"logic":"and","items":[{"type":"title","operator":"contains","value":"x"}]}',
        actions: '[{"type":"mark_read"}]',
        sortOrder: 0,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
    fetchRules,
    createRule: vi.fn().mockResolvedValue(undefined),
    updateRule: vi.fn().mockResolvedValue(undefined),
    deleteRule,
  }),
}))

describe('RuleList', () => {
  beforeEach(() => {
    deleteRule.mockClear()
    fetchRules.mockClear()
  })

  it('does not delete rule when user cancels tauri confirm dialog', async () => {
    const user = userEvent.setup()
    render(<RuleList />)

    const deleteButton = screen.getByTitle('删除')
    await user.click(deleteButton)

    const { confirm } = await import('@tauri-apps/plugin-dialog')
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(deleteRule).not.toHaveBeenCalled()
  })
})
