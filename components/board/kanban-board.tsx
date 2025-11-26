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
import { KanbanColumn } from './kanban-column'
import { MilestoneCard } from './milestone-card'
import { BoardFilters, FilterState } from './board-filters'
import { AIButton } from '../ai/ai-button'
import { AIPanel } from '../ai/ai-panel'
import { ItemDetailModal } from './item-detail-modal'

interface KanbanBoardProps {
  projectId?: string | null
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data: columns, isLoading, error } = useColumns()
  const [selectedProject, _setSelectedProject] = useState<string | null>(projectId || null)
  const [activeMilestone, setActiveMilestone] = useState<any>(null)
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false)
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
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

  const handleMilestoneClick = (milestone: any) => {
    setSelectedMilestone(milestone)
    setIsDetailModalOpen(true)
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
    setActiveMilestone(active.data.current?.milestone)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveMilestone(null)

    if (!over) return

    const milestoneId = active.id as string
    const newColumnId = over.id as string
    const milestone = active.data.current?.milestone

    if (!milestone || milestone.statusColumnId === newColumnId) {
      return // No change needed
    }

    // Optimistically update the UI
    try {
      await updateMilestone.mutateAsync({
        id: milestoneId,
        data: {
          projectId: milestone.projectId,
          statusColumnId: newColumnId,
        },
      })
    } catch (error) {
      console.error('Failed to update milestone:', error)
      // The mutation will handle rollback via TanStack Query
    }
  }

  const handleDragCancel = () => {
    setActiveMilestone(null)
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
          Let's set up your workspace with default columns and get you started
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
        ) : null}
      </DragOverlay>

      {/* AI Panel */}
      <AIPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        focusProjectId={selectedProject || undefined}
      />

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedMilestone}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedMilestone(null)
        }}
      />
    </DndContext>
  )
}
