import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SearchBar from '@/components/SearchBar'

const mockInvoke = vi.fn()

vi.mock('@/utils/tauri', () => ({
  invoke: (cmd: string, args?: any) => mockInvoke(cmd, args),
  isTauriEnv: true,
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('SearchBar', () => {
  beforeEach(() => {
    mockInvoke.mockClear()
    mockInvoke.mockResolvedValue([])
  })

  it('should render search input', async () => {
    await act(async () => {
      renderWithRouter(<SearchBar />)
    })
    
    expect(screen.getByPlaceholderText(/搜索文章/)).toBeInTheDocument()
  })

  it('should update query on input change', async () => {
    await act(async () => {
      renderWithRouter(<SearchBar />)
    })
    
    const input = screen.getByPlaceholderText(/搜索文章/)
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test query' } })
    })
    
    expect(input).toHaveValue('test query')
  })

  it('should call search API when query is entered', async () => {
    mockInvoke.mockResolvedValueOnce([])
    
    await act(async () => {
      renderWithRouter(<SearchBar />)
    })
    
    const input = screen.getByPlaceholderText(/搜索文章/)
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } })
      fireEvent.focus(input)
    })
    
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('search_articles', { query: 'test' })
    })
  })

  it('should show search results', async () => {
    const mockArticles = [
      {
        id: 1,
        feedId: 1,
        title: 'Test Article',
        link: 'https://example.com/article',
        isRead: false,
        isStarred: false,
        isFavorite: false,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ]
    
    mockInvoke.mockResolvedValueOnce(mockArticles)
    
    await act(async () => {
      renderWithRouter(<SearchBar />)
    })
    
    const input = screen.getByPlaceholderText(/搜索文章/)
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } })
      fireEvent.focus(input)
    })
    
    await waitFor(() => {
      expect(screen.getByText('Test Article')).toBeInTheDocument()
    })
  })

  it('should show "no results" message when no articles found', async () => {
    mockInvoke.mockResolvedValueOnce([])
    
    await act(async () => {
      renderWithRouter(<SearchBar />)
    })
    
    const input = screen.getByPlaceholderText(/搜索文章/)
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'nonexistent' } })
      fireEvent.focus(input)
    })
    
    await waitFor(() => {
      expect(screen.getByText('未找到相关文章')).toBeInTheDocument()
    })
  })

  it('should hide results when input is cleared', async () => {
    mockInvoke.mockResolvedValueOnce([])
    
    await act(async () => {
      renderWithRouter(<SearchBar />)
    })
    
    const input = screen.getByPlaceholderText(/搜索文章/)
    
    await act(async () => {
      fireEvent.change(input, { target: { value: 'test' } })
      fireEvent.focus(input)
    })
    
    await waitFor(() => {
      expect(screen.getByText('未找到相关文章')).toBeInTheDocument()
    })
    
    await act(async () => {
      fireEvent.change(input, { target: { value: '' } })
    })
    
    expect(screen.queryByText('未找到相关文章')).not.toBeInTheDocument()
  })
})
