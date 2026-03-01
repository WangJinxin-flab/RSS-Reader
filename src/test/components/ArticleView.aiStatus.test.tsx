import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ArticleView from '@/components/ArticleView'
import { useAiTaskUiStore } from '@/stores/aiTaskUiStore'

const mockInvoke = vi.fn()

vi.mock('@/utils/tauri', () => ({
  invoke: (cmd: string, args?: any) => mockInvoke(cmd, args),
  isTauriEnv: true,
}))

vi.mock('@tauri-apps/api/event', () => ({
  listen: () => Promise.resolve(() => {}),
}))

describe('ArticleView AI status', () => {
  beforeEach(() => {
    mockInvoke.mockReset()
    useAiTaskUiStore.getState().reset()
  })

  it('shows AI task status and score badges', async () => {
    useAiTaskUiStore.getState().setProcessing(1, 'summary')

    mockInvoke.mockImplementation((cmd: string) => {
      if (cmd === 'get_article') {
        return Promise.resolve({
          id: 1,
          feedId: 1,
          title: 'Article title',
          link: 'https://example.com/article/1',
          content: '<p>hi</p>',
          isRead: true,
          isStarred: false,
          isFavorite: false,
          createdAt: '2026-01-01T00:00:00Z',
          scores: [
            {
              id: 11,
              articleId: 1,
              ruleId: '42',
              score: 0.8,
              badgeName: '相关性 A',
              createdAt: '2026-01-01T00:00:00Z',
            },
            {
              id: 12,
              articleId: 1,
              ruleId: '43',
              score: 0.2,
              badgeName: '相关性 B',
              createdAt: '2026-01-01T00:00:00Z',
            },
          ],
        })
      }

      if (cmd === 'get_article_tags') {
        return Promise.resolve([])
      }

      if (cmd === 'get_article_navigation') {
        return Promise.resolve([null, null])
      }

      return Promise.resolve(null)
    })

    render(
      <MemoryRouter initialEntries={['/feed/1/article/1']}>
        <Routes>
          <Route path="/feed/:feedId/article/:articleId" element={<ArticleView />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByRole('heading', { level: 1, name: 'Article title' })).toBeInTheDocument()
    expect(screen.getByLabelText('执行中')).toBeInTheDocument()
    expect(screen.getByText('相关性 A: 0.8')).toBeInTheDocument()
    expect(screen.getByText('相关性 B: 0.2')).toBeInTheDocument()
  })
})
