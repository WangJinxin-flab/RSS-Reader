import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useDisableDefaultContextMenu } from '@/hooks/useDisableDefaultContextMenu'

function TestComponent() {
  useDisableDefaultContextMenu()

  return (
    <div>
      <div data-testid="surface">surface</div>
      <input data-testid="input" />
    </div>
  )
}

describe('useDisableDefaultContextMenu', () => {
  it('prevents default context menu on normal surfaces', () => {
    render(<TestComponent />)

    const surface = screen.getByTestId('surface')
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    surface.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('does not block context menu for input controls', () => {
    render(<TestComponent />)

    const input = screen.getByTestId('input')
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    input.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(false)
  })
})

