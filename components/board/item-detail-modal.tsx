'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useUpdateMilestone, useDeleteMilestone, useColumns, useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/hooks'
import { TagSelector } from './tag-selector'
import { DependencySelector } from './dependency-selector'
import { PriorityBadge } from './priority-badge'
import { toast } from 'sonner'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH'
type Effort = 'SMALL' | 'MEDIUM' | 'LARGE'

interface Milestone {
  id: string
  projectId: string
  name: string
  description: string | null
  value: Priority
  urgency: Priority
  effort: Effort
  statusColumnId: string
  priority: number
  priorityScore: number | null
  dependsOnMilestoneId: string | null
  sortOrder: number
  createdAt: Date | string
  updatedAt: Date | string
  statusColumn?: {
    id: string
    name: string
    key: string
  }
  _count?: {
    tasks: number
  }
}

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
}

interface ItemDetailModalProps {
  item: Milestone | null
  isOpen: boolean
  onClose: () => void
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Low', color: 'bg-slate-100 text-slate-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-600' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-600' },
]

const effortOptions: { value: Effort; label: string; color: string }[] = [
  { value: 'SMALL', label: 'Small', color: 'bg-green-100 text-green-600' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-600' },
  { value: 'LARGE', label: 'Large', color: 'bg-red-100 text-red-600' },
]

export function ItemDetailModal({ item, isOpen, onClose }: ItemDetailModalProps) {
  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState<Priority>('MEDIUM')
  const [urgency, setUrgency] = useState<Priority>('MEDIUM')
  const [effort, setEffort] = useState<Effort>('MEDIUM')
  const [statusColumnId, setStatusColumnId] = useState('')
  const [priority, setPriority] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskPriority, setNewTaskPriority] = useState(0)
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null)
  const [editingTaskPriority, setEditingTaskPriority] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDescriptionRef = useRef<string>('')

  // Hooks
  const { data: columns } = useColumns()
  const { data: tasks, isLoading: tasksLoading } = useTasks(item?.id || '')
  const updateMilestone = useUpdateMilestone()
  const deleteMilestone = useDeleteMilestone()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  // Initialize form when item changes
  useEffect(() => {
    if (item) {
      setName(item.name)
      setDescription(item.description || '')
      setValue(item.value)
      setUrgency(item.urgency)
      setEffort(item.effort)
      setStatusColumnId(item.statusColumnId)
      setPriority(item.priority || 0)
      setIsEditing(false)
    }
  }, [item])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showDeleteDialog) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, showDeleteDialog, onClose])

  // Autosave description changes (debounced)
  useEffect(() => {
    if (!item || !isOpen) return
    if (description === lastSavedDescriptionRef.current) return
    if (description === (item.description || '')) {
      lastSavedDescriptionRef.current = description
      return
    }

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }

    // Set new timer for autosave
    autosaveTimerRef.current = setTimeout(async () => {
      if (!item) return

      setIsSaving(true)
      try {
        await updateMilestone.mutateAsync({
          id: item.id,
          data: {
            projectId: item.projectId,
            description: description.trim() || null,
          },
        })
        lastSavedDescriptionRef.current = description
      } catch (error) {
        // Silent fail for autosave
      } finally {
        setIsSaving(false)
      }
    }, 1500) // 1.5 second debounce

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [description, item, isOpen, updateMilestone])

  // Reset last saved description when item changes (only on ID change, not any prop)
  useEffect(() => {
    if (item) {
      lastSavedDescriptionRef.current = item.description || ''
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id])

  const handleSave = async () => {
    if (!item) return

    try {
      await updateMilestone.mutateAsync({
        id: item.id,
        data: {
          projectId: item.projectId,
          name: name.trim(),
          description: description.trim() || null,
          value,
          urgency,
          effort,
          statusColumnId,
          priority,
        },
      })
      setIsEditing(false)
      toast.success('Milestone updated successfully')
    } catch (error) {
      toast.error('Failed to update milestone')
    }
  }

  const handleDelete = async () => {
    if (!item) return

    try {
      await deleteMilestone.mutateAsync({
        id: item.id,
        projectId: item.projectId,
      })
      setShowDeleteDialog(false)
      onClose()
      toast.success('Milestone deleted successfully')
    } catch (error) {
      toast.error('Failed to delete milestone')
    }
  }

  const handleAddTask = async () => {
    if (!item || !newTaskName.trim()) return

    try {
      await createTask.mutateAsync({
        milestoneId: item.id,
        name: newTaskName.trim(),
        description: null,
        value: 'MEDIUM',
        urgency: 'MEDIUM',
        effort: 'SMALL',
        statusColumnId: item.statusColumnId,
        priority: newTaskPriority,
      })
      setNewTaskName('')
      setNewTaskPriority(0)
      setIsAddingTask(false)
      toast.success('Task created successfully')
    } catch (error) {
      toast.error('Failed to create task')
    }
  }

  const handleToggleTaskComplete = async (task: Task) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: {
          milestoneId: task.milestoneId,
          completedAt: task.completedAt ? null : new Date(),
        },
      })
    } catch (error) {
      toast.error('Failed to update task')
    }
  }

  const handleDeleteTask = async (task: Task) => {
    try {
      await deleteTask.mutateAsync({
        id: task.id,
        milestoneId: task.milestoneId,
      })
      toast.success('Task deleted')
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const hasChanges = useCallback(() => {
    if (!item) return false
    return (
      name !== item.name ||
      description !== (item.description || '') ||
      value !== item.value ||
      urgency !== item.urgency ||
      effort !== item.effort ||
      statusColumnId !== item.statusColumnId ||
      priority !== (item.priority || 0)
    )
  }, [item, name, description, value, urgency, effort, statusColumnId, priority])

  const completedTasks = (tasks || []).filter((t: Task) => t.completedAt !== null)
  const incompleteTasks = (tasks || []).filter((t: Task) => t.completedAt === null)
  const completionPercentage = tasks?.length
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0

  if (!item) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {isEditing ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg font-semibold"
                    placeholder="Milestone name"
                    autoFocus
                  />
                ) : (
                  <DialogTitle
                    className="text-xl font-semibold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                    onClick={() => setIsEditing(true)}
                  >
                    {item.name}
                  </DialogTitle>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    Milestone
                  </span>
                  {item.priorityScore !== null && (
                    <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                      Score: {item.priorityScore.toFixed(1)}
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

          <div className="space-y-6 mt-4">
            {/* Status Column */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusColumnId}
                onValueChange={(value) => {
                  setStatusColumnId(value)
                  setIsEditing(true)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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

            {/* WBS Priority */}
            <div className="space-y-2">
              <Label>Priority (WBS Order)</Label>
              <Input
                type="number"
                min="0"
                max="999"
                value={priority}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0
                  setPriority(Math.max(0, Math.min(999, val)))
                  setIsEditing(true)
                }}
                placeholder="e.g., 1, 2, 3..."
                className="w-full"
              />
              <p className="text-xs text-slate-500">Enter 1 for first priority, 2 for second, etc.</p>
            </div>

            {/* Priority Fields */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Value</Label>
                <Select
                  value={value}
                  onValueChange={(v: Priority) => {
                    setValue(v)
                    setIsEditing(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={`px-2 py-0.5 rounded ${opt.color}`}>
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urgency</Label>
                <Select
                  value={urgency}
                  onValueChange={(v: Priority) => {
                    setUrgency(v)
                    setIsEditing(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={`px-2 py-0.5 rounded ${opt.color}`}>
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Effort</Label>
                <Select
                  value={effort}
                  onValueChange={(v: Effort) => {
                    setEffort(v)
                    setIsEditing(true)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {effortOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={`px-2 py-0.5 rounded ${opt.color}`}>
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Description</Label>
                {isSaving && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-500"></div>
                    Saving...
                  </span>
                )}
              </div>
              <Textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setIsEditing(true)
                }}
                placeholder="Add a description..."
                rows={4}
              />
              <p className="text-xs text-slate-400">
                Changes are saved automatically
              </p>
            </div>

            {/* Dependencies Section */}
            {item && (
              <DependencySelector
                milestoneId={item.id}
                projectId={item.projectId}
              />
            )}

            {/* Subtasks Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Subtasks</Label>
                {tasks && tasks.length > 0 && (
                  <span className="text-sm text-slate-500">
                    {completedTasks.length}/{tasks.length} completed ({completionPercentage}%)
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {tasks && tasks.length > 0 && (
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              )}

              {/* Task List */}
              <div className="space-y-2">
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Incomplete Tasks */}
                    {incompleteTasks.map((task: Task) => (
                      <div
                        key={task.id}
                        className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/50 group"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleTaskComplete(task)}
                            className="w-5 h-5 rounded border-2 border-slate-300 dark:border-slate-600 hover:border-green-500 flex items-center justify-center flex-shrink-0"
                          >
                            {/* Empty checkbox */}
                          </button>
                          <button
                            onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{task.name}</span>
                              {task.priority > 0 && (
                                <PriorityBadge
                                  wbsCode={String(task.priority)}
                                  type="task"
                                />
                              )}
                            </div>
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {task.tags.map((taskTag) => (
                                  <span
                                    key={taskTag.tagId}
                                    className="px-1.5 py-0.5 text-xs rounded-full text-white"
                                    style={{ backgroundColor: taskTag.tag.color }}
                                  >
                                    {taskTag.tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1 flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {/* Expanded Task Details with Tags and Priority */}
                        {expandedTaskId === task.id && item && (
                          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                            <div>
                              <Label className="text-xs">Priority (WBS Order)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="999"
                                value={editingTaskPriority[task.id] ?? task.priority ?? 0}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0
                                  const newPriority = Math.max(0, Math.min(999, val))
                                  setEditingTaskPriority(prev => ({
                                    ...prev,
                                    [task.id]: newPriority
                                  }))
                                }}
                                onBlur={async () => {
                                  const newPriority = editingTaskPriority[task.id]
                                  console.log('onBlur triggered for task:', task.id)
                                  console.log('newPriority from state:', newPriority)
                                  console.log('current task.priority:', task.priority)
                                  console.log('editingTaskPriority state:', editingTaskPriority)

                                  if (newPriority !== undefined && newPriority !== task.priority) {
                                    console.log('Priority changed, calling API...')
                                    const payload = {
                                      id: task.id,
                                      data: {
                                        milestoneId: task.milestoneId,
                                        priority: newPriority,
                                      },
                                    }
                                    console.log('API payload:', JSON.stringify(payload, null, 2))

                                    try {
                                      const result = await updateTask.mutateAsync(payload)
                                      console.log('API success:', result)
                                      toast.success('Priority updated')
                                    } catch (error) {
                                      console.error('API error:', error)
                                      toast.error('Failed to update priority')
                                    }
                                  } else {
                                    console.log('No change detected, skipping API call')
                                  }
                                }}
                                placeholder="e.g., 1, 2, 3..."
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Tags</Label>
                              <div className="mt-1">
                                <TagSelector
                                  taskId={task.id}
                                  milestoneId={item.id}
                                  selectedTags={task.tags || []}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Completed Tasks */}
                    {completedTasks.map((task: Task) => (
                      <div
                        key={task.id}
                        className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/50 group opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleTaskComplete(task)}
                            className="w-5 h-5 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0"
                          >
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <span className="flex-1 text-sm line-through text-slate-500">{task.name}</span>
                          <button
                            onClick={() => handleDeleteTask(task)}
                            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 p-1 flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Empty state */}
                    {tasks?.length === 0 && !isAddingTask && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                        No subtasks yet
                      </p>
                    )}
                  </>
                )}

                {/* Add Task Form */}
                {isAddingTask ? (
                  <div className="space-y-2 mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                    <div>
                      <Label className="text-xs">Task Name</Label>
                      <Input
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder="Task name..."
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTask()
                          if (e.key === 'Escape') {
                            setIsAddingTask(false)
                            setNewTaskName('')
                            setNewTaskPriority(0)
                          }
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Priority (WBS Order)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="999"
                        value={newTaskPriority}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          setNewTaskPriority(Math.max(0, Math.min(999, val)))
                        }}
                        placeholder="e.g., 1, 2, 3..."
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleAddTask}
                        disabled={!newTaskName.trim() || createTask.isPending}
                        className="flex-1"
                      >
                        {createTask.isPending ? 'Adding...' : 'Add'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsAddingTask(false)
                          setNewTaskName('')
                          setNewTaskPriority(0)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingTask(true)}
                    className="w-full mt-2"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add subtask
                  </Button>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-500 dark:text-slate-400">
                <div>
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{' '}
                  {new Date(item.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Save Button */}
            {hasChanges() && (
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (item) {
                      setName(item.name)
                      setDescription(item.description || '')
                      setValue(item.value)
                      setUrgency(item.urgency)
                      setEffort(item.effort)
                      setStatusColumnId(item.statusColumnId)
                      setPriority(item.priority || 0)
                      setIsEditing(false)
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={updateMilestone.isPending}
                >
                  {updateMilestone.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{item.name}&quot;? This action cannot be undone.
              All subtasks will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMilestone.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
