import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import AddFeedModal from '@/components/add-feed/AddFeedModal'
import * as tauriUtils from '@/utils/tauri'
import { toast } from '@/stores/toastStore'

// Mock the tauri utils
vi.mock('@/utils/tauri', () => ({
  invoke: vi.fn(),
  isTauriEnv: true,
}))

// Mock stores
vi.mock('@/stores/feedStore', () => ({
  useFeedStore: () => ({
    setFeeds: vi.fn(),
  }),
}))

vi.mock('@/stores/settingsStore', () => ({
  useSettingsStore: () => ({
    rsshubDomain: 'https://rsshub.app',
  }),
}))

// Mock toast
vi.mock('@/stores/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

describe('AddFeedModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render nothing when isOpen is false', () => {
    const { container } = render(<AddFeedModal isOpen={false} onClose={mockOnClose} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('should render modal content when isOpen is true', () => {
    render(<AddFeedModal isOpen={true} onClose={mockOnClose} />)
    expect(screen.getByText('添加订阅源')).toBeInTheDocument()
    expect(screen.getByLabelText('Feed URL')).toBeInTheDocument()
  })

  it('should call invoke and close modal on successful submission', async () => {
    const mockInvoke = vi.mocked(tauriUtils.invoke)
    mockInvoke.mockResolvedValueOnce({
      feed: { title: 'Test Feed' },
      articles: [],
    }) // fetch_and_add_feed result
    .mockResolvedValueOnce([]) // get_feeds result

    render(<AddFeedModal isOpen={true} onClose={mockOnClose} />)

    const urlInput = screen.getByLabelText('Feed URL')
    fireEvent.change(urlInput, { target: { value: 'https://example.com/feed.xml' } })

    const submitButton = screen.getByText('添加订阅')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('fetch_and_add_feed', expect.any(Object))
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should accept tuple-style backend response and close modal', async () => {
    const mockInvoke = vi.mocked(tauriUtils.invoke)
    mockInvoke
      .mockResolvedValueOnce([
        { title: 'Tuple Feed' },
        [],
      ])
      .mockResolvedValueOnce([])

    render(<AddFeedModal isOpen={true} onClose={mockOnClose} />)

    const urlInput = screen.getByLabelText('Feed URL')
    fireEvent.change(urlInput, { target: { value: 'https://example.com/feed.xml' } })

    const submitButton = screen.getByText('添加订阅')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('fetch_and_add_feed', expect.any(Object))
      expect(mockOnClose).toHaveBeenCalled()
      expect(toast.success).toHaveBeenCalledWith('成功添加订阅源: Tuple Feed')
      expect(toast.error).not.toHaveBeenCalled()
    })
  })

  it('should display HTTP error message verbatim (No Masking)', async () => {
    const mockInvoke = vi.mocked(tauriUtils.invoke)
    const errorMessage = 'Failed to fetch feed: HTTP 404 Not Found from https://example.com/feed.xml'
    mockInvoke.mockRejectedValueOnce(errorMessage)

    render(<AddFeedModal isOpen={true} onClose={mockOnClose} />)

    const urlInput = screen.getByLabelText('Feed URL')
    fireEvent.change(urlInput, { target: { value: 'https://example.com/feed.xml' } })

    const submitButton = screen.getByText('添加订阅')
    fireEvent.click(submitButton)

    await waitFor(() => {
      // This is the key assertion: verify the error message is NOT "Network request failed..."
      // but rather the exact string we mocked
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('should display Connection error message verbatim', async () => {
    const mockInvoke = vi.mocked(tauriUtils.invoke)
    const errorMessage = 'Failed to fetch feed from https://example.com: connection refused'
    mockInvoke.mockRejectedValueOnce(errorMessage)

    render(<AddFeedModal isOpen={true} onClose={mockOnClose} />)

    const urlInput = screen.getByLabelText('Feed URL')
    fireEvent.change(urlInput, { target: { value: 'https://example.com/feed.xml' } })

    const submitButton = screen.getByText('添加订阅')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })
})
