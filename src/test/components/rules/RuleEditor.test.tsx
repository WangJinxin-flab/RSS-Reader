import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RuleEditor from '@/components/rules/RuleEditor'
import { Rule } from '@/types/rule'

const mockAiProfiles = [
  {
    id: 'profile-1',
    name: 'Primary AI',
    provider: 'openai',
    apiKey: 'test-key',
    baseUrl: 'https://api.example.com/v1',
    model: 'gpt-test',
    prompt: 'test prompt'
  }
]

const mockFeeds = [
  {
    id: 1,
    title: 'Feed One',
    url: 'https://example.com/feed.xml',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    unreadCount: 0
  }
]

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: (selector: (state: { aiProfiles: typeof mockAiProfiles }) => unknown) =>
    selector({ aiProfiles: mockAiProfiles })
}))

vi.mock('@/stores/feedStore', () => ({
  useFeedStore: (selector: (state: { feeds: typeof mockFeeds }) => unknown) =>
    selector({ feeds: mockFeeds })
}))

function createRule(overrides: Partial<Rule> = {}): Rule {
  return {
    id: 'rule-1',
    name: 'AI rule',
    isActive: true,
    conditions: JSON.stringify({
      logic: 'and',
      items: [{ type: 'title', operator: 'contains', value: 'AI' }]
    }),
    actions: JSON.stringify([
      {
        type: 'ai_score',
        aiProfileId: 'profile-1',
        prompt: '给技术深度打分',
        badgeName: '旧徽章',
        badgeColor: '#ff0000',
        badgeIcon: '🔥'
      }
    ]),
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides
  }
}

describe('RuleEditor', () => {
  it('does not render badge/icon/color controls for ai_score action', () => {
    const rule = createRule()
    const { container } = render(
      <RuleEditor
        rule={rule}
        onSave={vi.fn().mockResolvedValue(undefined)}
        onCancel={vi.fn()}
      />
    )

    expect(screen.queryByPlaceholderText('徽章名称 (例如: 深度评测)')).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('图标 (Emoji)')).not.toBeInTheDocument()
    expect(container.querySelector('input[type="color"]')).toBeNull()
  })

  it('sanitizes legacy badge fields from ai_score action on save', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const rule = createRule({
      actions: JSON.stringify([
        {
          type: 'ai_score',
          aiProfileId: 'profile-1',
          prompt: '请打分',
          badgeName: 'legacy',
          badgeColor: '#3b82f6',
          badgeIcon: '⭐'
        },
        {
          type: 'add_tag',
          value: 'tech'
        }
      ])
    })

    render(<RuleEditor rule={rule} onSave={onSave} onCancel={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '保存规则' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const actionsArg = onSave.mock.calls[0][2] as string
    const parsedActions = JSON.parse(actionsArg)

    expect(parsedActions).toEqual([
      {
        type: 'ai_score',
        aiProfileId: 'profile-1',
        prompt: '请打分'
      },
      {
        type: 'add_tag',
        value: 'tech'
      }
    ])
  })

  it('applies light and dark theme classes on root container', () => {
    const rule = createRule()
    render(
      <RuleEditor
        rule={rule}
        onSave={vi.fn().mockResolvedValue(undefined)}
        onCancel={vi.fn()}
      />
    )

    const heading = screen.getByRole('heading', { name: '编辑规则' })
    const root = heading.parentElement

    expect(root).toBeInTheDocument()
    expect(root).toHaveClass('bg-white')
    expect(root).toHaveClass('dark:bg-slate-800')
    expect(root).toHaveClass('border-slate-200')
    expect(root).toHaveClass('dark:border-slate-700/50')
  })

  it('shows automatic JSON format hints for ai_prompt and ai_score prompts', () => {
    const rule = createRule({
      conditions: JSON.stringify({
        logic: 'and',
        items: [
          {
            type: 'ai_prompt',
            operator: 'ai_match',
            value: '判断是否技术文章',
            aiProfileId: 'profile-1',
            tokenLimit: 3000
          }
        ]
      })
    })

    render(
      <RuleEditor
        rule={rule}
        onSave={vi.fn().mockResolvedValue(undefined)}
        onCancel={vi.fn()}
      />
    )

    const hintTexts = screen.getAllByText(/System will automatically append JSON format constraints/)
    expect(hintTexts.length).toBeGreaterThanOrEqual(2)
    expect(screen.getByText(/\{"match": true, "reason": "\.\.\."\}/)).toBeInTheDocument()
    expect(screen.getByText(/\{"score": 85, "reason": "\.\.\."\}/)).toBeInTheDocument()
  })

  it('stores onlyUpdated and clears includeFetched on save', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    const rule = createRule()

    render(
      <RuleEditor
        rule={rule}
        onSave={onSave}
        onCancel={vi.fn()}
      />
    )

    const includeFetchedCheckbox = screen.getByLabelText('包括已获取文章')
    const onlyUpdatedCheckbox = screen.getByLabelText('仅新文章')

    await user.click(onlyUpdatedCheckbox)
    expect(includeFetchedCheckbox).not.toBeChecked()
    expect(onlyUpdatedCheckbox).toBeChecked()

    await user.click(screen.getByRole('button', { name: '保存规则' }))

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledTimes(1)
    })

    const conditionsArg = onSave.mock.calls[0][1] as string
    const parsedConditions = JSON.parse(conditionsArg)

    expect(parsedConditions.includeFetchedArticles).toBe(false)
    expect(parsedConditions.onlyUpdatedArticles).toBe(true)
  })
})
