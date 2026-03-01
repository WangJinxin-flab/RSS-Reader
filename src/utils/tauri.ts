import { invoke as tauriInvoke, isTauri as checkIsTauri } from '@tauri-apps/api/core'

export const invoke = async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> => {
  if (!checkIsTauri()) {
    return Promise.reject(new Error('Tauri API not available in browser'))
  }

  return tauriInvoke<T>(cmd, args)
}

export const isTauriEnv = checkIsTauri()
