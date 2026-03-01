import { useEffect } from 'react'

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  return !!target.closest('input, textarea, [contenteditable="true"]')
}

export function useDisableDefaultContextMenu() {
  useEffect(() => {
    const handleContextMenu = (event: MouseEvent) => {
      if (isEditableTarget(event.target)) return
      event.preventDefault()
    }

    document.addEventListener('contextmenu', handleContextMenu, true)
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true)
    }
  }, [])
}

