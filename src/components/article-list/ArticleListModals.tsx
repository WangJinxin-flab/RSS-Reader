import AddToGroupModal from '@/components/AddToGroupModal'
import BatchSummaryModal from '@/components/BatchSummaryModal'
import { Article } from '@/types'

interface ArticleListModalsProps {
  isAddToGroupOpen: boolean
  isBatchSummaryOpen: boolean
  selectedArticleIds: number[]
  selectedArticles: Article[]
  onCloseAddToGroup: () => void
  onCloseBatchSummary: () => void
  onBatchSummaryComplete: () => void
}

export default function ArticleListModals({
  isAddToGroupOpen,
  isBatchSummaryOpen,
  selectedArticleIds,
  selectedArticles,
  onCloseAddToGroup,
  onCloseBatchSummary,
  onBatchSummaryComplete
}: ArticleListModalsProps) {
  return (
    <>
      <AddToGroupModal
        isOpen={isAddToGroupOpen}
        onClose={onCloseAddToGroup}
        articleIds={selectedArticleIds}
      />
      <BatchSummaryModal
        isOpen={isBatchSummaryOpen}
        onClose={onCloseBatchSummary}
        articles={selectedArticles}
        onComplete={onBatchSummaryComplete}
      />
    </>
  )
}
