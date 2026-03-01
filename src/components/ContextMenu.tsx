import { useState, useEffect, useRef, createContext, useContext } from 'react'
import {
  Edit2,
  Trash2,
  Copy,
  Link2
} from 'lucide-react'

interface MenuItem {
  icon?: React.ElementType
  label: string
  onClick: () => void
  danger?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: MenuItem[]
  onClose: () => void
}

const ContextMenuContext = createContext<{
  showMenu: (x: number, y: number, items: MenuItem[]) => void
  hideMenu: () => void
} | null>(null)

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext)
  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider')
  }
  return context
}

const ContextMenu = ({ x, y, items, onClose }: ContextMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const adjustedX = Math.min(x, window.innerWidth - 200)
  const adjustedY = Math.min(y, window.innerHeight - (items.length * 40 + 20))

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100"
      style={{
        left: adjustedX,
        top: adjustedY,
        minWidth: '160px'
      }}
    >
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick()
            onClose()
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors cursor-pointer ${
            item.danger
              ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          {item.icon && <item.icon className="w-4 h-4" />}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

export const ContextMenuProvider = ({ children }: { children: React.ReactNode }) => {
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null)

  const showMenu = (x: number, y: number, items: MenuItem[]) => {
    setMenu({ x, y, items })
  }

  const hideMenu = () => {
    setMenu(null)
  }

  return (
    <ContextMenuContext.Provider value={{ showMenu, hideMenu }}>
      {children}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={hideMenu}
        />
      )}
    </ContextMenuContext.Provider>
  )
}

export const preventContextMenu = (e: React.MouseEvent) => {
  e.preventDefault()
}

export { Edit2, Trash2, Copy, Link2 }
