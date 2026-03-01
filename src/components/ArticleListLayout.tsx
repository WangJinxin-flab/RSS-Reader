import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { useSettingsStore } from '../stores/settingsStore'
import ResizableDivider from './ResizableDivider'
import ArticleListToolbar from './ArticleListToolbar'

interface ArticleListLayoutProps {
  children: ReactNode
}

export default function ArticleListLayout({ children }: ArticleListLayoutProps) {
  const { articleListWidth, setArticleListWidth } = useSettingsStore()

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Article List Column */}
      <div 
        className="flex flex-col bg-slate-50 dark:bg-slate-900 z-10 shrink-0 relative border-r border-slate-200 dark:border-slate-700/50 min-w-[250px] max-w-[600px]"
        style={{ width: articleListWidth }}
      >
        <ArticleListToolbar />
        <div className="flex-1 min-h-0 relative flex flex-col">
          {children}
        </div>
        
        {/* Resizable Handle */}
        <div className="absolute top-0 right-0 h-full z-20 translate-x-1/2">
          <ResizableDivider 
            width={articleListWidth}
            onResize={setArticleListWidth}
            minWidth={250}
            maxWidth={600}
            className="!mr-0"
          />
        </div>
      </div>
      
      {/* Article Content Column */}
      <div className="flex-1 min-w-0 overflow-hidden bg-white dark:bg-slate-900">
        <Outlet />
      </div>
    </div>
  )
}
