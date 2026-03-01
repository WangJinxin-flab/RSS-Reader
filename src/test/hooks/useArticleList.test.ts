import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useArticleList } from '@/hooks/useArticleList'

vi.mock('@/utils/tauri', () => ({
  invoke: vi.fn(),
  isTauriEnv: true
}))

vi.mock('@/hooks/useArticleUpdateListener', () => ({
  useArticleUpdateListener: vi.fn()
}))

import { invoke } from '@/utils/tauri'

const mockedInvoke = vi.mocked(invoke)

function makeArticle(id: number, title: string) {
  return {
    id,
    feedId: 1,
    title,
    link: `https://example.com/${id}`,
    isRead: false,
    isStarred: false,
    isFavorite: false,
    createdAt: '2026-01-01T00:00:00Z'
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

describe('useArticleList', () => {
  beforeEach(() => {
    mockedInvoke.mockReset()
  })

  it('calls beforeRefresh before reloading articles', async () => {
    mockedInvoke.mockResolvedValueOnce([makeArticle(1, 'first')])
    mockedInvoke.mockResolvedValueOnce([makeArticle(2, 'second')])

    const beforeRefresh = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useArticleList({
        filter: 'all',
        beforeRefresh
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(beforeRefresh).toHaveBeenCalledTimes(1)
  })

  it('keeps existing articles visible while refresh is in flight', async () => {
    mockedInvoke.mockResolvedValueOnce([makeArticle(1, 'old')])
    const nextLoad = deferred<any[]>()
    mockedInvoke.mockImplementationOnce(() => nextLoad.promise)

    const { result } = renderHook(() =>
      useArticleList({
        filter: 'all'
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.articles.map((a) => a.title)).toEqual(['old'])

    let refreshPromise: Promise<void> | undefined
    act(() => {
      refreshPromise = result.current.refresh()
    })

    // Refresh started but new data not resolved yet.
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.articles.map((a) => a.title)).toEqual(['old'])

    await act(async () => {
      nextLoad.resolve([makeArticle(2, 'new')])
      await refreshPromise
    })

    expect(result.current.articles.map((a) => a.title)).toEqual(['new'])
  })

  it('enters loading state immediately while beforeRefresh is running', async () => {
    mockedInvoke.mockResolvedValueOnce([makeArticle(1, 'old')])
    mockedInvoke.mockResolvedValueOnce([makeArticle(2, 'new')])

    const blocker = deferred<void>()
    const beforeRefresh = vi.fn(async () => {
      await blocker.promise
    })

    const { result } = renderHook(() =>
      useArticleList({
        filter: 'all',
        beforeRefresh
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.refresh()
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      blocker.resolve()
    })
  })

  it('exposes refreshError when beforeRefresh fails', async () => {
    mockedInvoke.mockResolvedValueOnce([makeArticle(1, 'old')])
    mockedInvoke.mockResolvedValueOnce([makeArticle(1, 'old')])

    const beforeRefresh = vi.fn(async () => {
      throw new Error('network down')
    })

    const { result } = renderHook(() =>
      useArticleList({
        filter: 'all',
        beforeRefresh
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.refreshError).toBe('network down')
  })
})
