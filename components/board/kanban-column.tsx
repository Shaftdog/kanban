'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMilestones, useCreateMilestone, useProjects } from '@/lib/hooks'
import { useTasks } from '@/lib/hooks/use-tasks'
import { DraggableMilestoneCard } from './draggable-milestone-card'
import { DraggableTaskCard } from './draggable-task-card'
import { DraggableProjectCard } from './draggable-project-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterState } from './board-filters'
import { toast } from 'sonner'

interface Column {
  id: string
  name: string
  key: string
  sortOrder: number
}

interface KanbanColumnProps {
  column: Column
  projectId: string | null
  filters: FilterState
  onMilestoneClick?: (_milestone: any) => void
  onTaskClick?: (_task: any) => void
}

export function KanbanColumn({ column, projectId, filters, onMilestoneClick, onTaskClick }: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newMilestoneName, setNewMilestoneName] = useState('')

  // Fetch data based on column type
  const { data: allProjects, isLoading: projectsLoading } = useProjects()
  const { data: allMilestones, isLoading: milestonesLoading } = useMilestones(projectId)
  const { data: allTasks, isLoading: tasksLoading } = useTasks(null)
  const createMilestone = useCreateMilestone()

  // Determine column type
  const isProjectsColumn = column.key === 'PROJECTS'
  const _isMilestonesColumn = column.key === 'MILESTONES'
  const isBacklogColumn = column.key === 'BACKLOG'

  const isLoading = isProjectsColumn
    ? projectsLoading
    : isBacklogColumn
    ? tasksLoading
    : milestonesLoading

  // Apply filters for projects
  const projects = (allProjects || [])
    .filter((p: any) => {
      // Filter by column
      if (p.statusColumnId !== column.id) return false

      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = p.name.toLowerCase().includes(searchLower)
        const matchesDescription = p.description?.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesDescription) return false
      }

      // Filter by item type - projects are shown only when itemType is 'all'
      if (filters.itemType !== 'all') {
        return false
      }

      return true
    })
    .sort((a: any, b: any) => a.priority - b.priority) // Sort by WBS priority ascending (1, 2, 3...)

  // Apply filters for milestones
  const milestones = (allMilestones || [])
    .filter((m: any) => {
      // Filter by column
      if (m.statusColumnId !== column.id) return false

      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = m.name.toLowerCase().includes(searchLower)
        const matchesDescription = m.description?.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesDescription) return false
      }

      // Filter by project
      if (filters.projectIds.length > 0 && !filters.projectIds.includes(m.projectId)) {
        return false
      }

      // Filter by value
      if (filters.values.length > 0 && !filters.values.includes(m.value)) {
        return false
      }

      // Filter by item type
      if (filters.itemType !== 'all' && filters.itemType !== 'milestones') {
        return false
      }

      // Hide completed (completed column)
      if (filters.hideCompleted && column.key === 'COMPLETED') {
        return false
      }

      return true
    })
    .sort((a: any, b: any) => a.priority - b.priority) // Sort by WBS priority ascending (1, 2, 3...)

  // Apply filters and priority sorting for tasks (BACKLOG column)
  const tasks = (allTasks || [])
    .filter((t: any) => {
      // Filter by column
      if (t.statusColumnId !== column.id) return false

      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesName = t.name.toLowerCase().includes(searchLower)
        const matchesDescription = t.description?.toLowerCase().includes(searchLower)
        if (!matchesName && !matchesDescription) return false
      }

      // Filter by project
      if (filters.projectIds.length > 0 && !filters.projectIds.includes(t.milestone?.project?.id)) {
        return false
      }

      // Filter by value
      if (filters.values.length > 0 && !filters.values.includes(t.value)) {
        return false
      }

      // Filter by item type
      if (filters.itemType !== 'all' && filters.itemType !== 'tasks') {
        return false
      }

      // Hide completed
      if (filters.hideCompleted && t.completedAt) {
        return false
      }

      return true
    })
    // WBS-based sorting: Project priority (asc) -> Milestone priority (asc) -> Task priority (asc)
    // Items with priority 0 (no WBS code) go to the bottom at each level
    .sort((a: any, b: any) => {
      // Sort by project priority first (lower WBS number comes first: 1 before 2, 0 at bottom)
      const projectPriorityA = a.milestone?.project?.priority || 0
      const projectPriorityB = b.milestone?.project?.priority || 0
      if (projectPriorityA !== projectPriorityB) {
        if (projectPriorityA === 0) return 1  // a goes to bottom
        if (projectPriorityB === 0) return -1 // b goes to bottom
        return projectPriorityA - projectPriorityB
      }

      // Then by milestone priority (lower WBS number comes first: 1 before 2, 0 at bottom)
      const milestonePriorityA = a.milestone?.priority || 0
      const milestonePriorityB = b.milestone?.priority || 0
      if (milestonePriorityA !== milestonePriorityB) {
        if (milestonePriorityA === 0) return 1  // a goes to bottom
        if (milestonePriorityB === 0) return -1 // b goes to bottom
        return milestonePriorityA - milestonePriorityB
      }

      // Finally by task priority (lower WBS number comes first: 1 before 2, 0 at bottom)
      const taskPriorityA = a.priority || 0
      const taskPriorityB = b.priority || 0
      if (taskPriorityA === 0 && taskPriorityB === 0) return 0
      if (taskPriorityA === 0) return 1  // a goes to bottom
      if (taskPriorityB === 0) return -1 // b goes to bottom
      return taskPriorityA - taskPriorityB
    })

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  // Use appropriate items for drag and drop context based on column type
  const items = isProjectsColumn ? projects : isBacklogColumn ? tasks : milestones
  const itemIds = items.map((item: any) => item.id)

  const handleAddMilestone = async () => {
    if (!newMilestoneName.trim() || !projectId) return

    try {
      await createMilestone.mutateAsync({
        projectId,
        name: newMilestoneName.trim(),
        description: null,
        value: 'MEDIUM',
        urgency: 'MEDIUM',
        effort: 'MEDIUM',
        priority: 0,
        statusColumnId: column.id,
      })
      setNewMilestoneName('')
      setIsAdding(false)
      toast.success('Milestone created successfully')
    } catch (error) {
      toast.error('Failed to create milestone')
    }
  }

  const handleCancelAdd = () => {
    setNewMilestoneName('')
    setIsAdding(false)
  }

  return (
    <div className="flex-shrink-0 w-80 flex flex-col">
      {/* Column Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            {column.name}
          </h3>
          <span className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
            {items.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 overflow-y-auto min-h-[500px] transition-colors ${
          isOver ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400' : ''
        }`}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {isLoading ? (
              <>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-white dark:bg-slate-800 rounded-lg animate-pulse"
                  />
                ))}
              </>
            ) : items.length > 0 ? (
              isProjectsColumn ? (
                // Show projects in PROJECTS column
                projects.map((project: any) => (
                  <DraggableProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => {
                      // Handle project click
                    }}
                  />
                ))
              ) : isBacklogColumn ? (
                // Show tasks in BACKLOG column
                tasks.map((task: any) => (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                  />
                ))
              ) : (
                // Show milestones in MILESTONES and workflow columns
                milestones.map((milestone: any) => (
                  <DraggableMilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onClick={() => onMilestoneClick?.(milestone)}
                  />
                ))
              )
            ) : (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-sm text-slate-400 dark:text-slate-600">
                No items
              </p>
            </div>
          )}
          </div>
        </SortableContext>

        {/* Add Card Button / Form - only show for PROJECTS and MILESTONES columns */}
        {(column.key === 'PROJECTS' || column.key === 'MILESTONES') && projectId && (
          <>
            {isAdding ? (
              <div className="mt-3 space-y-2">
                <Input
                  value={newMilestoneName}
                  onChange={(e) => setNewMilestoneName(e.target.value)}
                  placeholder="Enter milestone name..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMilestone()
                    if (e.key === 'Escape') handleCancelAdd()
                  }}
                  className="bg-white dark:bg-slate-800"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddMilestone}
                    disabled={!newMilestoneName.trim() || createMilestone.isPending}
                    className="flex-1"
                  >
                    {createMilestone.isPending ? 'Adding...' : 'Add'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelAdd}
                    disabled={createMilestone.isPending}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setIsAdding(true)}
                className="w-full mt-3 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add card
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
