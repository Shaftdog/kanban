'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function DataManagement() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Fetch all user data
      const [projectsRes, milestonesRes, tasksRes, tagsRes, columnsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/milestones'),
        fetch('/api/tasks'),
        fetch('/api/tags'),
        fetch('/api/columns')
      ])

      const projects = await projectsRes.json()
      const milestones = await milestonesRes.json()
      const tasks = await tasksRes.json()
      const tags = await tagsRes.json()
      const columns = await columnsRes.json()

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        data: {
          projects,
          milestones,
          tasks,
          tags,
          columns
        }
      }

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kanban-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Data exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export data')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>Export or backup your Kanban board data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Export Data</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Download all your projects, milestones, tasks, and tags as a JSON file.
            This can be used as a backup or to transfer data.
          </p>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isExporting ? 'Exporting...' : 'Export to JSON'}
          </Button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg opacity-60">
          <h4 className="font-medium text-slate-900 dark:text-white mb-2">Import Data</h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Import data from a previously exported JSON file. Coming soon.
          </p>
          <Button variant="outline" disabled>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import from JSON
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
