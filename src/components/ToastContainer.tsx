import { useToastStore, Toast } from '@/stores/toastStore'
import { Check, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <Check className="w-5 h-5" />
      case 'error':
        return <AlertCircle className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'info':
        return <Info className="w-5 h-5" />
    }
  }

  const getStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'text-accent-700 dark:text-accent-300 border-accent-500'
      case 'error':
        return 'text-red-700 dark:text-red-300 border-red-500'
      case 'warning':
        return 'text-amber-700 dark:text-amber-300 border-amber-500'
      case 'info':
        return 'text-blue-700 dark:text-blue-300 border-blue-500'
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border-l-4 shadow-lg animate-slide-up bg-white dark:bg-slate-800 ${getStyles(toast.type)}`}
        >
          <div className="flex-shrink-0 pt-0.5">
            {getIcon(toast.type)}
          </div>
          <p className="flex-1 font-medium text-sm break-words">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
