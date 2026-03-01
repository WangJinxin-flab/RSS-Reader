import { useTranslation } from 'react-i18next'
import ArticleListPage from '@/components/ArticleListPage'

export default function FavoriteArticles() {
  const { t } = useTranslation()

  return (
    <ArticleListPage
      title={t('pages.favoriteArticles.title')}
      filter="favorite"
      basePath="/favorites"
      emptyMessage={t('pages.favoriteArticles.empty')}
      emptySubMessage={t('pages.favoriteArticles.emptyHint')}
      showAddFeed
    />
  )
}
