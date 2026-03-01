import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleExternalNavigation } from '@/utils/externalNavigation'

const invokeMock = vi.fn()
const confirmDialogMock = vi.fn()
const toastInfoMock = vi.fn()
const toastErrorMock = vi.fn()
const toastWarningMock = vi.fn()
const toastSuccessMock = vi.fn()

vi.mock('@/utils/tauri', () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
  isTauriEnv: true,
}))

vi.mock('@tauri-apps/plugin-dialog', () => ({
  confirm: (...args: unknown[]) => confirmDialogMock(...args),
}))

vi.mock('@/stores/toastStore', () => ({
  toast: {
    info: (...args: unknown[]) => toastInfoMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
    warning: (...args: unknown[]) => toastWarningMock(...args),
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}))

describe('externalNavigation', () => {
  beforeEach(() => {
    invokeMock.mockReset()
    confirmDialogMock.mockReset()
    toastInfoMock.mockReset()
    toastErrorMock.mockReset()
    toastWarningMock.mockReset()
    toastSuccessMock.mockReset()
  })

  it('does not open browser when confirm is cancelled', async () => {
    confirmDialogMock.mockResolvedValue(false)

    const result = await handleExternalNavigation('https://example.com/path', {
      behavior: 'confirm',
    })

    expect(result).toBe('cancelled')
    expect(confirmDialogMock).toHaveBeenCalled()
    expect(invokeMock).not.toHaveBeenCalled()
  })

  it('opens system browser after confirm approved', async () => {
    confirmDialogMock.mockResolvedValue(true)

    const result = await handleExternalNavigation('https://example.com/path', {
      behavior: 'confirm',
    })

    expect(result).toBe('opened')
    expect(confirmDialogMock).toHaveBeenCalled()
    expect(invokeMock).toHaveBeenCalledWith('open_external_url', {
      url: 'https://example.com/path',
    })
  })
})
