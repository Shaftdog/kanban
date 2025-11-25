'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateMilestone, useUpdateMilestone, useColumns } from '@/lib/hooks'

interface MilestoneDialogProps {
  open: boolean
  onOpenChange: (_open: boolean) => void
  projectId: string
  milestone?: {
    id: string
    name: string
    description: string | null
    value: 'LOW' | 'MEDIUM' | 'HIGH'
    urgency: 'LOW' | 'MEDIUM' | 'HIGH'
    effort: 'SMALL' | 'MEDIUM' | 'LARGE'
    statusColumnId: string
  } | null
}

export function MilestoneDialog({ open, onOpenChange, projectId, milestone }: MilestoneDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [effort, setEffort] = useState<'SMALL' | 'MEDIUM' | 'LARGE'>('MEDIUM')
  const [statusColumnId, setStatusColumnId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createMilestone = useCreateMilestone()
  const updateMilestone = useUpdateMilestone()
  const { data: columns, isLoading: columnsLoading } = useColumns()

  useEffect(() => {
    if (milestone) {
      setName(milestone.name)
      setDescription(milestone.description || '')
      setValue(milestone.value)
      setUrgency(milestone.urgency)
      setEffort(milestone.effort)
      setStatusColumnId(milestone.statusColumnId)
    } else {
      setName('')
      setDescription('')
      setValue('MEDIUM')
      setUrgency('MEDIUM')
      setEffort('MEDIUM')
      // Set default to backlog column if available
      if (columns && columns.length > 0) {
        const backlogColumn = columns.find((col: any) => col.key === 'backlog')
        setStatusColumnId(backlogColumn?.id || columns[0].id)
      }
    }
    setError(null)
  }, [milestone, open, columns])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!statusColumnId) {
      setError('Please select a status column')
      return
    }

    try {
      if (milestone) {
        await updateMilestone.mutateAsync({
          id: milestone.id,
          data: {
            projectId,
            name,
            description: description || null,
            value,
            urgency,
            effort,
            statusColumnId,
          },
        })
      } else {
        await createMilestone.mutateAsync({
          projectId,
          name,
          description: description || null,
          value,
          urgency,
          effort,
          statusColumnId,
        })
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{milestone ? 'Edit Milestone' : 'Create Milestone'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="name">Milestone Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter milestone name"
                required
                className="mt-2"
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter milestone description (optional)"
                className="mt-2 w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {description.length}/500 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">Value *</Label>
                <Select value={value} onValueChange={(v) => setValue(v as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgency">Urgency *</Label>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="effort">Effort *</Label>
                <Select value={effort} onValueChange={(v) => setEffort(v as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMALL">Small</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="LARGE">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={statusColumnId}
                  onValueChange={setStatusColumnId}
                  disabled={columnsLoading}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={columnsLoading ? "Loading..." : "Select status"} />
                  </SelectTrigger>
                  <SelectContent>
                    {columns?.map((col: any) => (
                      <SelectItem key={col.id} value={col.id}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMilestone.isPending || updateMilestone.isPending || columnsLoading}
            >
              {createMilestone.isPending || updateMilestone.isPending
                ? 'Saving...'
                : milestone
                ? 'Update'
                : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
