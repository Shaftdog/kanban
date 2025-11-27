'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateTask, useDeleteTask } from '@/lib/hooks'
import { TagSelector } from './tag-selector'
import { PriorityBadge } from './priority-badge'
import { toast } from 'sonner'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
type Effort = 'SMALL' | 'MEDIUM' | 'LARGE'

interface TaskTag {
  taskId: string
  tagId: string
  tag: {
    id: string
    name: string
    color: string
  }
}

interface Task {
  id: string
  milestoneId: string
  name: string
  description: string | null
  value: Priority
  urgency: Priority
  effort: Effort
  statusColumnId: string
  priority: number
  priorityScore: number | null
  completedAt: Date | string | null
  sortOrder: number
  createdAt: Date | string
  updatedAt: Date | string
  tags?: TaskTag[]
  milestone?: {
    id: string
    name: string
    project?: {
      id: string
      name: string
    }
  }
}

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState<Priority>('MEDIUM')
  const [urgency, setUrgency] = useState<Priority>('MEDIUM')
  const [effort, setEffort] = useState<Effort>('MEDIUM')
  const [priority, setPriority] = useState(0)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setName(task.name)
      setDescription(task.description || '')
      setValue(task.value)
      setUrgency(task.urgency)
      setEffort(task.effort)
      setPriority(task.priority)
    }
  }, [task])

  const handleSave = async () => {
    if (!task) return

    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          milestoneId: task.milestoneId,
          name,
          description: description || null,
          value,
          urgency,
          effort,
          priority,
        },
      })
      toast.success('Task updated successfully')
    } catch (error) {
      toast.error('Failed to update task')
    }
  }

  const handleDelete = async () => {
    if (!task) return

    try {
      await deleteTask.mutateAsync(task.id)
      toast.success('Task deleted successfully')
      onClose()
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const handleToggleComplete = async () => {
    if (!task) return

    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          milestoneId: task.milestoneId,
          completedAt: task.completedAt ? null : new Date(),
        },
      })
      toast.success(task.completedAt ? 'Task marked as incomplete' : 'Task marked as complete')
    } catch (error) {
      toast.error('Failed to update task')
    }
  }

  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2">{task.name}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  Task
                </span>
                {task.milestone && (
                  <>
                    <span>in</span>
                    <span className="font-medium">{task.milestone.name}</span>
                    {task.milestone.project && (
                      <>
                        <span>•</span>
                        <span className="font-medium">{task.milestone.project.name}</span>
                      </>
                    )}
                  </>
                )}
                {typeof task.priorityScore === 'number' && (
                  <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                    Score: {task.priorityScore.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Completion Status */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <button
              onClick={handleToggleComplete}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                task.completedAt
                  ? 'border-green-500 bg-green-500'
                  : 'border-slate-300 dark:border-slate-600 hover:border-green-500'
              }`}
            >
              {task.completedAt && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-sm font-medium">
              {task.completedAt ? 'Mark as incomplete' : 'Mark as complete'}
            </span>
          </div>

          {/* Task Name */}
          <div>
            <Label>Task Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter task name"
            />
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task description..."
              rows={4}
            />
          </div>

          {/* Priority (WBS Order) */}
          <div>
            <Label className="flex items-center gap-2">
              Priority (WBS Order)
              {priority > 0 && (
                <PriorityBadge wbsCode={String(priority)} type="task" />
              )}
            </Label>
            <Input
              type="number"
              min="0"
              max="999"
              value={priority}
              onChange={(e) => setPriority(parseInt(e.target.value) || 0)}
              placeholder="1, 2, 3..."
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Lower numbers appear first (1 before 2)
            </p>
          </div>

          {/* Value, Urgency, Effort */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Value</Label>
              <Select value={value} onValueChange={(v) => setValue(v as Priority)}>
                <SelectTrigger>
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
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as Priority)}>
                <SelectTrigger>
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
              <Label>Effort</Label>
              <Select value={effort} onValueChange={(v) => setEffort(v as Effort)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMALL">Small</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LARGE">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <TagSelector
              taskId={task.id}
              selectedTags={task.tags || []}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateTask.isPending || !name.trim()}>
              {updateTask.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">Delete Task</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Are you sure you want to delete "{task.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={deleteTask.isPending}>
                  {deleteTask.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
