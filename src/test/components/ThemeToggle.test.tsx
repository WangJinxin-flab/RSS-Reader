import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ThemeToggle from '@/components/ThemeToggle'
import { useSettingsStore } from '@/stores/settingsStore'

describe('ThemeToggle', () => {
  beforeEach(() => {
    useSettingsStore.getState().setTheme('system')
    document.documentElement.classList.remove('light', 'dark')
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  })

  it('should render three theme buttons', () => {
    render(<ThemeToggle />)

    expect(screen.getByRole('button', { name: /浅色/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /深色/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /系统/ })).toBeInTheDocument()
  })

  it('should apply light theme when light button clicked', () => {
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: /浅色/ }))
    expect(useSettingsStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('should apply dark theme when dark button clicked', () => {
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: /深色/ }))
    expect(useSettingsStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.classList.contains('light')).toBe(false)
  })

  it('should apply system theme with matchMedia fallback', () => {
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button', { name: /系统/ }))
    expect(useSettingsStore.getState().theme).toBe('system')
    // mocked matchMedia returns light preference
    expect(document.documentElement.classList.contains('light')).toBe(true)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
