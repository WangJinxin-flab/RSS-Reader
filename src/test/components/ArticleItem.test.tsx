import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ArticleItem from '@/components/ArticleItem'

describe('ArticleItem', () => {
  it('renders selection checkbox before article title content', () => {
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
            createdAt: '2026-01-01T00:00:00Z'
          }}
          isSelected={false}
          onSelect={vi.fn()}
          linkTarget="/feed/1/article/1"
        />
      </MemoryRouter>
    )

    const checkbox = screen.getByRole('checkbox')
    const heading = screen.getByRole('heading', { name: 'Article title' })

    const relation = checkbox.compareDocumentPosition(heading)
    expect((relation & Node.DOCUMENT_POSITION_FOLLOWING) !== 0).toBe(true)
  })
})

