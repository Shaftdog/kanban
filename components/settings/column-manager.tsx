'use client'

import { useState } from 'react'
import { useColumns, useUpdateColumn } from '@/lib/hooks'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ColumnManager() {
  const { data: columns, isLoading, error } = useColumns()
  const updateColumn = useUpdateColumn()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleStartEdit = (columnId: string, currentName: string) => {
    setEditingId(columnId)
    setEditName(currentName)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleSaveEdit = async (columnId: string) => {
    if (!editName.trim()) return

    try {
      await updateColumn.mutateAsync({
        id: columnId,
        data: { name: editName },
      })
      setEditingId(null)
      setEditName('')
    } catch (err) {
      console.error('Failed to update column:', err)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Column Management</CardTitle>
          <CardDescription>Customize your Kanban board column names</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Column Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 dark:text-red-400">
            Error loading columns: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Column Management</CardTitle>
        <CardDescription>
          Customize your Kanban board column names. Column keys cannot be changed to maintain system consistency.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {columns?.map((column: any) => (
            <div
              key={column.id}
              className="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              {editingId === column.id ? (
                <>
                  <div className="flex-1">
                    <Label htmlFor={`column-${column.id}`} className="sr-only">
                      Column Name
                    </Label>
                    <Input
                      id={`column-${column.id}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Column name"
                      maxLength={50}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(column.id)
                        } else if (e.key === 'Escape') {
                          handleCancelEdit()
                        }
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(column.id)}
                      disabled={updateColumn.isPending || !editName.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={updateColumn.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {column.name}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Key: <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                        {column.key}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Order: {column.sortOrder}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartEdit(column.id, column.name)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Rename
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                About Column Management
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You can rename columns to match your workflow, but column keys remain fixed to ensure system consistency.
                The order of columns is also fixed to maintain a standard workflow progression.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
