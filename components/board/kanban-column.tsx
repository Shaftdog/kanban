'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useMilestones, useCreateMilestone } from '@/lib/hooks'
import { DraggableMilestoneCard } from './draggable-milestone-card'
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
}

export function KanbanColumn({ column, projectId, filters, onMilestoneClick }: KanbanColumnProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [newMilestoneName, setNewMilestoneName] = useState('')

  // For now, we'll fetch all milestones and filter by column
  // In a real app, we'd have a dedicated endpoint for this
  const { data: allMilestones, isLoading } = useMilestones(projectId || '')
  const createMilestone = useCreateMilestone()

  // Apply filters
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

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const milestoneIds = milestones.map((m: any) => m.id)

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
            {milestones.length}
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
        <SortableContext items={milestoneIds} strategy={verticalListSortingStrategy}>
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
            ) : milestones.length > 0 ? (
              milestones.map((milestone: any) => (
                <DraggableMilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  onClick={() => onMilestoneClick?.(milestone)}
                />
              ))
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

        {/* Add Card Button / Form */}
        {column.key !== 'COMPLETED' && projectId && (
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
