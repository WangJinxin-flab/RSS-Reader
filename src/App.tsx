import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import ArticleList from './components/ArticleList'
import ArticleView from './components/ArticleView'
import EmptyView from './components/EmptyView'
import AllArticles from './pages/AllArticles'
import StarredArticles from './pages/StarredArticles'
import UnreadArticles from './pages/UnreadArticles'
import FavoriteArticles from './pages/FavoriteArticles'
import TaggedArticles from './pages/TaggedArticles'
import GroupView from './pages/GroupView'
import SearchResults from './pages/SearchResults'
import Settings from './pages/Settings'
import ToastContainer from './components/ToastContainer'
import GlobalContextMenu from './components/GlobalContextMenu'
import { ContextMenuProvider } from './components/ContextMenu'
import { useSettingsStore } from './stores/settingsStore'
import { useAutoCleanup } from './hooks/useAutoCleanup'
import { AiTaskWorker } from './components/rules/AiTaskWorker'
import { AutoSummaryWorker } from './components/ai/AutoSummaryWorker'
import { FeedAutoUpdater } from './components/FeedAutoUpdater'
import { useDisableDefaultContextMenu } from './hooks/useDisableDefaultContextMenu'
import { useExternalNavigationGuard } from './hooks/useExternalNavigationGuard'

function App() {
  const { fontSize } = useSettingsStore()
  useAutoCleanup()
  useDisableDefaultContextMenu()
  useExternalNavigationGuard()
  
  useEffect(() => {
    // 应用字体大小设置
    document.documentElement.setAttribute('data-font-size', fontSize)
  }, [fontSize])
  
  return (
    <ContextMenuProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="settings" element={<Settings />} />
            
            <Route path="/" element={<AllArticles />}>
              <Route index element={<EmptyView />} />
              <Route path="article/:articleId" element={<ArticleView />} />
            </Route>
            
            <Route path="unread" element={<UnreadArticles />}>
              <Route index element={<EmptyView />} />
              <Route path="article/:articleId" element={<ArticleView />} />
            </Route>
            
            <Route path="starred" element={<StarredArticles />}>
              <Route index element={<EmptyView />} />
              <Route path="article/:articleId" element={<ArticleView />} />
            </Route>
            
            <Route path="favorites" element={<FavoriteArticles />}>
              <Route index element={<EmptyView />} />
              <Route path="article/:articleId" element={<ArticleView />} />
            </Route>
            
            <Route path="tags/:tagId" element={<TaggedArticles />}>
              <Route index element={<EmptyView />} />
              <Route path="article/:articleId" element={<ArticleView />} />
            </Route>
            
            <Route path="group/:groupId" element={<GroupView />}>
              <Route index element={<EmptyView />} />
              <Route path="article/:articleId" element={<ArticleView />} />
            </Route>
            
            <Route path="feed/:feedId" element={<ArticleList />}>
              <Route index element={<EmptyView />} />
              <Route path="article/:articleId" element={<ArticleView />} />
            </Route>
            
            <Route path="search" element={<SearchResults />}>
              <Route index element={<EmptyView />} />
              <Route path="article/:articleId" element={<ArticleView />} />
            </Route>
          </Route>
        </Routes>
        <ToastContainer />
        <GlobalContextMenu />
        <AiTaskWorker />
        <AutoSummaryWorker />
        <FeedAutoUpdater />
      </BrowserRouter>
    </ContextMenuProvider>
  )
}

export default App
