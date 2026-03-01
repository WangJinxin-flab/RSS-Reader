import { ReactNode } from 'react'
import { UseArticleListOptions } from '@/hooks/useArticleList'
import ArticleListLayout from './ArticleListLayout'
import ArticleListContent from '@/components/article-list/ArticleListContent'
import {
  List,
  Inbox,
  Star,
  Bookmark,
  Tag as TagIcon,
  Search,
  Layers
} from 'lucide-react'

// Header icons mapping
const headerIcons = {
  all: List,
  unread: Inbox,
  starred: Star,
  favorite: Bookmark,
  tag: TagIcon,
  group: Layers,
  search: Search
}

interface ArticleListPageProps extends UseArticleListOptions {
  title: string
  subtitle?: string
  icon?: ReactNode
  iconType?: keyof typeof headerIcons
  basePath: string
  emptyMessage: string
  emptySubMessage?: string
  showAddFeed?: boolean
  showRefresh?: boolean
  showSelectAll?: boolean
  onRemoveFromGroup?: (articleIds: number[]) => Promise<void>
  extraHeaderContent?: ReactNode
  autoSummary?: string | null
  onCloseAutoSummary?: () => void
  isAutoSummarizing?: boolean
}

export default function ArticleListPage(props: ArticleListPageProps) {
  const {
    title,
    subtitle,
    icon,
    iconType = 'all',
    basePath,
    emptyMessage,
    emptySubMessage,
    showAddFeed = false,
    showRefresh = false,
    showSelectAll = true,
    onRemoveFromGroup,
    extraHeaderContent,
    autoSummary,
    onCloseAutoSummary,
    isAutoSummarizing,
    ...listOptions
  } = props

  return (
    <ArticleListLayout>
      <ArticleListContentWrapper
        title={title}
        subtitle={subtitle}
        icon={icon}
        iconType={iconType}
        basePath={basePath}
        emptyMessage={emptyMessage}
        emptySubMessage={emptySubMessage}
        showAddFeed={showAddFeed}
        showRefresh={showRefresh}
        showSelectAll={showSelectAll}
        onRemoveFromGroup={onRemoveFromGroup}
        extraHeaderContent={extraHeaderContent}
        autoSummary={autoSummary}
        onCloseAutoSummary={onCloseAutoSummary}
        isAutoSummarizing={isAutoSummarizing}
        listOptions={listOptions}
      />
    </ArticleListLayout>
  )
}

// Wrapper component to use the hook
import { useArticleList } from '@/hooks/useArticleList'

interface WrapperProps extends Omit<ArticleListPageProps, keyof UseArticleListOptions> {
  listOptions: UseArticleListOptions
}

function ArticleListContentWrapper({
  title,
  subtitle,
  icon,
  iconType,
  basePath,
  emptyMessage,
  emptySubMessage,
  showAddFeed,
  showRefresh,
  showSelectAll,
  onRemoveFromGroup,
  extraHeaderContent,
  autoSummary,
  onCloseAutoSummary,
  isAutoSummarizing,
  listOptions
}: WrapperProps) {
  const {
    articles,
    isLoading,
    isMoreLoading,
    hasMore,
    refreshError,
    selectedArticles,
    loadMore,
    refresh,
    handleSelectArticle,
    handleSelectAll,
    clearSelection,
    setArticles
  } = useArticleList(listOptions)

  return (
    <ArticleListContent
      title={title}
      subtitle={subtitle}
      icon={icon}
      iconType={iconType}
      basePath={basePath}
      articles={articles}
      isLoading={isLoading}
      isMoreLoading={isMoreLoading}
      hasMore={hasMore}
      refreshError={refreshError}
      selectedArticles={selectedArticles}
      emptyMessage={emptyMessage}
      emptySubMessage={emptySubMessage}
      showAddFeed={showAddFeed}
      showRefresh={showRefresh}
      showSelectAll={showSelectAll}
      onRemoveFromGroup={onRemoveFromGroup}
      extraHeaderContent={extraHeaderContent}
      autoSummary={autoSummary}
      onCloseAutoSummary={onCloseAutoSummary}
      isAutoSummarizing={isAutoSummarizing}
      onLoadMore={loadMore}
      onRefresh={refresh}
      onSelectArticle={handleSelectArticle}
      onSelectAll={handleSelectAll}
      onClearSelection={clearSelection}
      setArticles={setArticles}
    />
  )
}
