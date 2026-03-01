import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ArticleItem from '@/components/ArticleItem'
import { useAiTaskUiStore } from '@/stores/aiTaskUiStore'

describe('ArticleItem AI task status', () => {
  beforeEach(() => {
    useAiTaskUiStore.getState().reset()
  })

  it('shows animated AI icon when processing', () => {
    useAiTaskUiStore.getState().setProcessing(1, 'summary')

    render(
      <MemoryRouter>
        <ArticleItem
          article={{
            id: 1,
            feedId: 1,
            title: 'Article title',
            link: 'https://example.com/article/1',
            summary: 'summary',
            thumbnail: 'https://example.com/image.jpg',
            isRead: false,
            isStarred: false,
            isFavorite: false,
            createdAt: '2026-01-01T00:00:00Z',
          }}
          isSelected={false}
          onSelect={vi.fn()}
          linkTarget="/feed/1/article/1"
        />
      </MemoryRouter>
    )

    expect(screen.getByLabelText('执行中')).toBeInTheDocument()
  })

  it('shows failed AI icon when failed', () => {
    useAiTaskUiStore.getState().setFailed(1, 'summary', 'boom')

    render(
      <MemoryRouter>
        <ArticleItem
          article={{
            id: 1,
            feedId: 1,
            title: 'Article title',
            link: 'https://example.com/article/1',
            summary: 'summary',
            thumbnail: 'https://example.com/image.jpg',
            isRead: false,
            isStarred: false,
            isFavorite: false,
            createdAt: '2026-01-01T00:00:00Z',
          }}
          isSelected={false}
          onSelect={vi.fn()}
          linkTarget="/feed/1/article/1"
        />
      </MemoryRouter>
    )

    expect(screen.getByLabelText('执行失败')).toBeInTheDocument()
  })
})

