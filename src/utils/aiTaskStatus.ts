import i18n from '@/i18n'
import { AiUiTask } from '@/stores/aiTaskUiStore'

export interface AiTaskCounts {
  pending: number
  processing: number
  failed: number
  total: number
}

export function countTasksByStatus(tasks: AiUiTask[]): AiTaskCounts {
  return tasks.reduce(
    (acc, task) => {
      acc.total++
      if (task.status === 'pending') acc.pending++
      else if (task.status === 'processing') acc.processing++
      else if (task.status === 'failed') acc.failed++
      return acc
    },
    { pending: 0, processing: 0, failed: 0, total: 0 }
  )
}

export function getDisplayStatus(counts: AiTaskCounts): {
  hasFailed: boolean
  hasProcessing: boolean
  hasPending: boolean
  displayText: string
  icon: 'alert' | 'sparkles' | 'clock'
} {
  const hasFailed = counts.failed > 0
  const hasProcessing = counts.processing > 0
  const hasPending = counts.pending > 0

  let displayText = ''
  let icon: 'alert' | 'sparkles' | 'clock' = 'clock'

  if (hasFailed && !hasProcessing && !hasPending) {
    displayText = counts.failed === 1 ? i18n.t('aiTaskStatus.failed') : i18n.t('aiTaskStatus.failedCount', { count: counts.failed })
    icon = 'alert'
  } else if (hasProcessing && hasPending) {
    displayText = i18n.t('aiTaskStatus.queuedAndRunning', { queued: counts.pending, running: counts.processing })
    icon = 'sparkles'
  } else if (hasProcessing) {
    displayText = counts.processing === 1 ? i18n.t('aiTaskStatus.running') : i18n.t('aiTaskStatus.runningCount', { count: counts.processing })
    icon = 'sparkles'
  } else if (hasPending) {
    displayText = counts.pending === 1 ? i18n.t('aiTaskStatus.queued') : i18n.t('aiTaskStatus.queuedCount', { count: counts.pending })
    icon = 'clock'
  }

  return { hasFailed, hasProcessing, hasPending, displayText, icon }
}

export function getAiTaskSummary(tasks: AiUiTask[]): string {
  const counts = countTasksByStatus(tasks)
  const parts: string[] = []

  if (counts.pending > 0) {
    parts.push(counts.pending === 1 ? i18n.t('aiTaskStatus.queued') : i18n.t('aiTaskStatus.queuedCount', { count: counts.pending }))
  }
  if (counts.processing > 0) {
    parts.push(counts.processing === 1 ? i18n.t('aiTaskStatus.running') : i18n.t('aiTaskStatus.runningCount', { count: counts.processing }))
  }
  if (counts.failed > 0) {
    parts.push(counts.failed === 1 ? i18n.t('aiTaskStatus.failed') : i18n.t('aiTaskStatus.failedCount', { count: counts.failed }))
  }

  return parts.join(' · ') || i18n.t('aiTaskStatus.noTasks')
}
