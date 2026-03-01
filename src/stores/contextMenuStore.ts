import { create } from 'zustand'

export type ContextMenuType = 'article' | 'feed' | 'group' | 'tag'

interface ContextMenuState {
  isOpen: boolean
  position: { x: number; y: number }
  type: ContextMenuType | null
  data: any
  close: () => void
  open: (type: ContextMenuType, position: { x: number; y: number }, data: any) => void
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  position: { x: 0, y: 0 },
  type: null,
  data: null,
  close: () => set({ isOpen: false }),
  open: (type, position, data) => set({ isOpen: true, position, type, data }),
}))
