export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 space-y-6">
        <div className="space-y-3">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
          <div className="h-10 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
          <div className="h-10 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
          <div className="h-24 bg-slate-100 dark:bg-slate-700/50 animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}
