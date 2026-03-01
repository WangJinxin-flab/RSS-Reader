import { useTranslation } from 'react-i18next'
import ArticleListPage from '@/components/ArticleListPage'

export default function StarredArticles() {
  const { t } = useTranslation()

  return (
    <ArticleListPage
      title={t('pages.starredArticles.title')}
      filter="starred"
      basePath="/starred"
      emptyMessage={t('pages.starredArticles.empty')}
      emptySubMessage={t('pages.starredArticles.emptyHint')}
      showAddFeed
    />
  )
}
