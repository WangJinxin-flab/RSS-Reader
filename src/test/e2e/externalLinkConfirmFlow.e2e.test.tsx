import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useExternalNavigationGuard } from '@/hooks/useExternalNavigationGuard'
import { useSettingsStore } from '@/stores/settingsStore'

const invokeMock = vi.fn()
const confirmDialogMock = vi.fn()

vi.mock('@/utils/tauri', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
  isTauriEnv: true,
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  confirm: (...args: unknown[]) => confirmDialogMock(...args),
}))

vi.mock('@/stores/toastStore', () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    success: vi.fn(),
  },
}))

function ExternalLinkPage() {
  useExternalNavigationGuard()

  return (
    <main>
      <a data-testid="article-link" href="https://example.com/readme">
        阅读原文
      </a>
    </main>
  )
}

describe('external link confirm flow (e2e)', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    confirmDialogMock.mockReset()
    confirmDialogMock.mockResolvedValue(false)
    useSettingsStore.setState({ externalLinkBehavior: 'confirm' })
  })

  it('does not open system browser when user cancels confirm dialog', async () => {
    render(<ExternalLinkPage />)

    const link = screen.getByTestId('article-link')
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true })
    link.dispatchEvent(clickEvent)

    expect(clickEvent.defaultPrevented).toBe(true)

    await waitFor(() => {
      expect(confirmDialogMock).toHaveBeenCalledTimes(1)
    })

    expect(invokeMock).not.toHaveBeenCalled()
  })
})
