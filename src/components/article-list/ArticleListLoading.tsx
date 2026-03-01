export default function ArticleListLoading() {
  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      <header className="p-6 border-b border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      </header>
      <div className="flex-1 p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white dark:bg-slate-800 rounded-xl p-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
