export default function ProjectsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 space-y-3"
          >
            <div className="h-6 bg-slate-200 dark:bg-slate-700 animate-pulse rounded w-3/4" />
            <div className="h-4 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded w-full" />
            <div className="h-4 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded w-5/6" />
          </div>
        ))}
      </div>
    </div>
  )
}
