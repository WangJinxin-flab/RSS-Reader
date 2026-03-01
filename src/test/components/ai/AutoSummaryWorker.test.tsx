import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { AutoSummaryWorker, enqueueAutoSummary } from '@/components/ai/AutoSummaryWorker'
import { useAiTaskUiStore } from '@/stores/aiTaskUiStore'
import { useSettingsStore } from '@/stores/settingsStore'

const mockInvoke = vi.fn()

vi.mock('@/utils/tauri', () => ({
  invoke: (cmd: string, args?: any) => mockInvoke(cmd, args),
  isTauriEnv: true,
}))

describe('AutoSummaryWorker', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    useAiTaskUiStore.getState().reset()
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
      featureMapping: {
        summaryProfileId: 'p1',
        translationProfileId: '',
        batchSummaryProfileId: '',
      },
      autoSummarizeNewArticles: true,
    } as any)
  })

  it('generates and stores per-article summary', async () => {
    mockInvoke.mockImplementation((cmd: string, args?: any) => {
      if (cmd === 'get_article_ai_summary') {
        return Promise.resolve(null)
      }

      if (cmd === 'get_article') {
        return Promise.resolve({
          id: args?.id ?? 1,
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

      if (cmd === 'upsert_article_ai_summary') {
        return Promise.resolve(null)
      }

      return Promise.resolve(null)
    })

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'My summary',
            },
          },
        ],
      }),
    } as any)

    render(<AutoSummaryWorker />)
    enqueueAutoSummary([1])

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('upsert_article_ai_summary', {
        articleId: 1,
        summary: 'My summary',
      })
    })

    expect(useAiTaskUiStore.getState().tasksByArticleId[1]).toBeUndefined()
  })

  it('marks task failed when summarization fails', async () => {
    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'get_article_ai_summary') {
        return Promise.resolve(null)
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

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as any)

    render(<AutoSummaryWorker />)
    enqueueAutoSummary([1])

    await waitFor(() => {
      const tasks = useAiTaskUiStore.getState().tasksByArticleId[1]
      expect(tasks?.[0].status).toBe('failed')
    })
  })
})

