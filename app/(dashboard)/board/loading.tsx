export default function BoardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 space-y-3">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
              <div className="h-32 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded" />
              <div className="h-32 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
