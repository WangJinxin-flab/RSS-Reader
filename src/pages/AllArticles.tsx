import { useTranslation } from 'react-i18next'
import ArticleListPage from '@/components/ArticleListPage'

export default function AllArticles() {
  const { t } = useTranslation()

  return (
    <ArticleListPage
      title={t('pages.allArticles.title')}
      filter="all"
      basePath=""
      emptyMessage={t('pages.allArticles.empty')}
      emptySubMessage={t('pages.allArticles.emptyHint')}
      showAddFeed
    />
  )
}
