'use client'

import { ColumnManager } from '@/components/settings/column-manager'
import { ProfileSettings } from '@/components/settings/profile-settings'
import { DataManagement } from '@/components/settings/data-management'
import { DangerZone } from '@/components/settings/danger-zone'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Manage your account, preferences, and workflow configuration
        </p>
      </div>

      <ProfileSettings />
      <ColumnManager />
      <DataManagement />
      <DangerZone />
    </div>
  )
}
