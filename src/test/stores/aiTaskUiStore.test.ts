import { beforeEach, describe, expect, it } from 'vitest'
import { useAiTaskUiStore } from '@/stores/aiTaskUiStore'

describe('aiTaskUiStore', () => {
  beforeEach(() => {
    useAiTaskUiStore.getState().reset()
  })

  it('tracks per-article processing and failed tasks', () => {
    const { setProcessing, setFailed, clearTask } = useAiTaskUiStore.getState()

    setProcessing(1, 'summary')
    setProcessing(1, 'rule:score:42')

    expect(useAiTaskUiStore.getState().tasksByArticleId[1]).toEqual([
      { key: 'summary', status: 'processing' },
      { key: 'rule:score:42', status: 'processing' },
    ])

    setFailed(1, 'rule:score:42', 'network error')

    expect(useAiTaskUiStore.getState().tasksByArticleId[1]).toEqual([
      { key: 'summary', status: 'processing' },
      { key: 'rule:score:42', status: 'failed', error: 'network error' },
    ])

    clearTask(1, 'summary')
    expect(useAiTaskUiStore.getState().tasksByArticleId[1]).toEqual([
      { key: 'rule:score:42', status: 'failed', error: 'network error' },
    ])

    clearTask(1, 'rule:score:42')
    expect(useAiTaskUiStore.getState().tasksByArticleId[1]).toBeUndefined()
  })
})

