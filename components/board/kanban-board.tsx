'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { useColumns, useUpdateMilestone } from '@/lib/hooks'
import { useUpdateTask } from '@/lib/hooks/use-tasks'
import { useUpdateProject } from '@/lib/hooks/use-projects'
import { KanbanColumn } from './kanban-column'
import { MilestoneCard } from './milestone-card'
import { TaskCard } from './task-card'
import { ProjectCard } from './project-card'
import { BoardFilters, FilterState } from './board-filters'
import { AIButton } from '../ai/ai-button'
import { AIPanel } from '../ai/ai-panel'
import { ItemDetailModal } from './item-detail-modal'
import { TaskDetailModal } from './task-detail-modal'

interface KanbanBoardProps {
  projectId?: string | null
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data: columns, isLoading, error } = useColumns()
  const [selectedProject, _setSelectedProject] = useState<string | null>(projectId || null)
  const [activeMilestone, setActiveMilestone] = useState<any>(null)
  const [activeTask, setActiveTask] = useState<any>(null)
  const [activeProject, setActiveProject] = useState<any>(null)
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    projectIds: [],
    tagIds: [],
    values: [],
    hideCompleted: false,
    itemType: 'all',
  })
  const updateMilestone = useUpdateMilestone()
  const updateTask = useUpdateTask()
  const updateProject = useUpdateProject()

  const handleMilestoneClick = (milestone: any) => {
    setSelectedMilestone(milestone)
    setSelectedTask(null) // Clear selected task when opening milestone
    setIsDetailModalOpen(true)
  }

  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setIsTaskModalOpen(true)
  }

  // Set up sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const data = active.data.current

    // Determine what type of item is being dragged
    if (data?.milestone) {
      setActiveMilestone(data.milestone)
    } else if (data?.task) {
      setActiveTask(data.task)
    } else if (data?.project) {
      setActiveProject(data.project)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    // Clear all active items
    setActiveMilestone(null)
    setActiveTask(null)
    setActiveProject(null)

    if (!over) return

    const itemId = active.id as string
    const newColumnId = over.id as string
    const data = active.data.current

    // Handle milestone drag
    if (data?.milestone) {
      const milestone = data.milestone
      if (milestone.statusColumnId === newColumnId) return

      try {
        await updateMilestone.mutateAsync({
          id: itemId,
          data: {
            projectId: milestone.projectId,
            statusColumnId: newColumnId,
          },
        })
      } catch (error) {
        console.error('Failed to update milestone:', error)
      }
    }
    // Handle task drag
    else if (data?.task) {
      const task = data.task
      if (task.statusColumnId === newColumnId) return

      try {
        await updateTask.mutateAsync({
          id: itemId,
          data: {
            milestoneId: task.milestoneId,
            statusColumnId: newColumnId,
          },
        })
      } catch (error) {
        console.error('Failed to update task:', error)
      }
    }
    // Handle project drag
    else if (data?.project) {
      const project = data.project
      if (project.statusColumnId === newColumnId) return

      try {
        await updateProject.mutateAsync({
          id: itemId,
          data: {
            statusColumnId: newColumnId,
          },
        })
      } catch (error) {
        console.error('Failed to update project:', error)
      }
    }
  }

  const handleDragCancel = () => {
    setActiveMilestone(null)
    setActiveTask(null)
    setActiveProject(null)
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-80 h-[600px] bg-slate-200 dark:bg-slate-700 animate-pulse rounded-lg"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
        Error loading board: {error.message}
      </div>
    )
  }

  const handleInitialize = async () => {
    setIsInitializing(true)
    setInitError(null)

    try {
      const response = await fetch('/api/init', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to initialize workspace')
      }

      // Reload the page to show the initialized board
      window.location.reload()
    } catch (err) {
      setInitError(err instanceof Error ? err.message : 'Failed to initialize workspace')
      setIsInitializing(false)
    }
  }

  if (!columns || columns.length === 0) {

    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10m0-10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
          />
        </svg>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          Welcome to AI-Powered Kanban!
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Let&apos;s set up your workspace with default columns and get you started
        </p>
        <button
          onClick={handleInitialize}
          disabled={isInitializing}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
        >
          {isInitializing ? 'Initializing...' : 'Initialize Workspace'}
        </button>
        {initError && (
          <p className="mt-4 text-red-600 dark:text-red-400">
            Error: {initError}
          </p>
        )}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="h-full flex flex-col">
        {/* Board Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Kanban Board
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Drag and drop milestones and tasks to update their status
            </p>
          </div>
          <AIButton onClick={() => setIsAIPanelOpen(true)} />
        </div>

        {/* Filters */}
        <BoardFilters onFilterChange={setFilters} />

        {/* Board Container */}
        <div className="flex-1 overflow-hidden">
          <div className="flex gap-4 h-full overflow-x-auto pb-4">
            {columns.map((column: any) => (
              <KanbanColumn
                key={column.id}
                column={column}
                projectId={selectedProject}
                filters={filters}
                onMilestoneClick={handleMilestoneClick}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeMilestone ? (
          <div className="rotate-3 scale-105">
            <MilestoneCard milestone={activeMilestone} />
          </div>
        ) : activeTask ? (
          <div className="rotate-3 scale-105">
            <TaskCard task={activeTask} />
          </div>
        ) : activeProject ? (
          <div className="rotate-3 scale-105">
            <ProjectCard project={activeProject} />
          </div>
        ) : null}
      </DragOverlay>

      {/* AI Panel */}
      <AIPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        focusProjectId={selectedProject || undefined}
      />

      {/* Milestone Detail Modal */}
      <ItemDetailModal
        item={selectedMilestone}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedMilestone(null)
        }}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false)
          setSelectedTask(null)
        }}
      />
    </DndContext>
  )
}
