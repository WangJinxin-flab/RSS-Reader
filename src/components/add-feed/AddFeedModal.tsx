import AddFeedHeader from './AddFeedHeader'
import AddFeedForm from './AddFeedForm'

interface AddFeedModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddFeedModal({ isOpen, onClose }: AddFeedModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
        <AddFeedHeader onClose={onClose} />
        <AddFeedForm onClose={onClose} />
      </div>
    </div>
  )
}
