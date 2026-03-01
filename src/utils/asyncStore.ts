import { invoke } from '@/utils/tauri'

export interface AsyncState {
  isLoading: boolean
  error: string | null
}

export interface AsyncActions {
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

type SetState<T> = (partial: Partial<T> | ((state: T) => Partial<T>)) => void

export function createAsyncActions<T extends AsyncState>(
  set: SetState<T>
): AsyncActions {
  return {
    setLoading: (loading: boolean) => set({ isLoading: loading } as Partial<T>),
    setError: (error: string | null) => set({ error } as Partial<T>),
    clearError: () => set({ error: null } as Partial<T>),
  }
}

export interface InvokeOptions<T> {
  command: string
  args?: Record<string, unknown>
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
}

export async function invokeWithHandling<T>(
  options: InvokeOptions<T>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): Promise<T | null> {
  setLoading(true)
  setError(null)

  try {
    const result = await invoke<T>(options.command, options.args)
    options.onSuccess?.(result)
    return result
  } catch (error) {
    const errorMessage = String(error)
    setError(errorMessage)
    options.onError?.(errorMessage)
    console.error(`Failed to invoke ${options.command}:`, error)
    return null
  } finally {
    setLoading(false)
  }
}
