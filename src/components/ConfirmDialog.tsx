import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Check } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'primary' | 'destructive'
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmVariant = 'primary'
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  const finalConfirmText = confirmText || t('confirmDialog.confirm')
  const finalCancelText = cancelText || t('confirmDialog.cancel')
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Content */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              {title}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {message}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {finalCancelText}
            </button>
            
            <button
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                confirmVariant === 'primary'
                  ? 'bg-primary-500 hover:bg-primary-600 text-white'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              {finalConfirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}