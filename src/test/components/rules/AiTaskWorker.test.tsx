import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { AiTaskWorker } from '@/components/rules/AiTaskWorker'
import { useSettingsStore } from '@/stores/settingsStore'

const mockInvoke = vi.fn()

vi.mock('@/utils/tauri', () => ({
  invoke: (cmd: string, args?: any) => mockInvoke(cmd, args),
}))

describe('AiTaskWorker', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    useSettingsStore.setState({
      aiProfiles: [
        {
          id: 'p1',
          name: 'P1',
          apiKey: 'test-key',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-test',
          provider: 'openai',
          prompt: 'prompt',
        },
      ],
    } as any)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '{"score": 80, "reason": "ok"}',
            },
          },
        ],
      }),
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('saves action_score badgeName as rule.name', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'get_pending_ai_tasks') {
        return Promise.resolve([
          {
            id: 't1',
            articleId: 1,
            ruleId: 'r1',
            status: 'pending',
            taskType: 'action_score',
            actionConfig: JSON.stringify({
              type: 'ai_score',
              aiProfileId: 'p1',
              prompt: 'score it',
            }),
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }

      if (cmd === 'get_rules') {
        return Promise.resolve([
          {
            id: 'r1',
            name: 'My Rule',
            isActive: true,
            conditions: JSON.stringify({ logic: 'and', items: [] }),
            actions: JSON.stringify([]),
            sortOrder: 0,
            createdAt: '2026-01-01T00:00:00Z',
          },
        ])
      }

      if (cmd === 'get_article') {
        return Promise.resolve({
          id: 1,
          feedId: 1,
          title: 'Title',
          link: 'https://example.com/1',
          content: 'hello',
          isRead: false,
          isStarred: false,
          isFavorite: false,
          createdAt: '2026-01-01T00:00:00Z',
        })
      }

      return Promise.resolve(null)
    })

    const { unmount } = render(<AiTaskWorker />)

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('save_article_score', {
        articleId: 1,
        ruleId: 'r1',
        score: 80,
        badgeName: 'My Rule',
        badgeColor: null,
        badgeIcon: null,
      })
    })

    unmount()
  })
})

