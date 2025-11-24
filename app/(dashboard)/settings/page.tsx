'use client'

import { ColumnManager } from '@/components/settings/column-manager'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your application preferences and workflow configuration
        </p>
      </div>

      <ColumnManager />
    </div>
  )
}
