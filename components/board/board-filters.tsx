'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProjects, useTags } from '@/lib/hooks'

interface BoardFiltersProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  search: string
  projectIds: string[]
  tagIds: string[]
  values: ('LOW' | 'MEDIUM' | 'HIGH')[]
  hideCompleted: boolean
  itemType: 'all' | 'milestones' | 'tasks'
}

export function BoardFilters({ onFilterChange }: BoardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    projectIds: [],
    tagIds: [],
    values: [],
    hideCompleted: false,
    itemType: 'all',
  })

  const { data: projects } = useProjects()
  const { data: tags } = useTags()

  // Load filters from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('kanban-board-filters')
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters)
        setFilters(parsed)
        onFilterChange(parsed)
      } catch (error) {
        console.error('Failed to parse saved filters:', error)
      }
    }
  }, [])

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)
    onFilterChange(updated)
    // Save to localStorage
    localStorage.setItem('kanban-board-filters', JSON.stringify(updated))
  }

  const clearFilters = () => {
    const cleared: FilterState = {
      search: '',
      projectIds: [],
      tagIds: [],
      values: [],
      hideCompleted: false,
      itemType: 'all',
    }
    setFilters(cleared)
    onFilterChange(cleared)
    // Clear from localStorage
    localStorage.removeItem('kanban-board-filters')
  }

  const hasActiveFilters =
    filters.search ||
    filters.projectIds.length > 0 ||
    filters.tagIds.length > 0 ||
    filters.values.length > 0 ||
    filters.hideCompleted ||
    filters.itemType !== 'all'

  return (
    <div className="mb-6 space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            type="search"
            placeholder="Search milestones and tasks..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full">
              {[
                filters.search ? 1 : 0,
                filters.projectIds.length,
                filters.tagIds.length,
                filters.values.length,
                filters.hideCompleted ? 1 : 0,
                filters.itemType !== 'all' ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 space-y-4 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Item Type Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Item Type</Label>
              <div className="flex gap-2">
                {(['all', 'milestones', 'tasks'] as const).map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={filters.itemType === type ? 'default' : 'outline'}
                    onClick={() => updateFilters({ itemType: type })}
                    className="flex-1 capitalize"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Value Filter */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Value Priority</Label>
              <div className="flex flex-wrap gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={filters.values.includes(value) ? 'default' : 'outline'}
                    onClick={() => {
                      const newValues = filters.values.includes(value)
                        ? filters.values.filter((v) => v !== value)
                        : [...filters.values, value]
                      updateFilters({ values: newValues })
                    }}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            {/* Hide Completed */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Status</Label>
              <Button
                size="sm"
                variant={filters.hideCompleted ? 'default' : 'outline'}
                onClick={() => updateFilters({ hideCompleted: !filters.hideCompleted })}
                className="w-full"
              >
                {filters.hideCompleted ? 'Show All' : 'Hide Completed'}
              </Button>
            </div>
          </div>

          {/* Projects Filter (if available) */}
          {projects && projects.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Projects</Label>
              <div className="flex flex-wrap gap-2">
                {projects.map((project: any) => (
                  <Button
                    key={project.id}
                    size="sm"
                    variant={filters.projectIds.includes(project.id) ? 'default' : 'outline'}
                    onClick={() => {
                      const newProjectIds = filters.projectIds.includes(project.id)
                        ? filters.projectIds.filter((id) => id !== project.id)
                        : [...filters.projectIds, project.id]
                      updateFilters({ projectIds: newProjectIds })
                    }}
                  >
                    {project.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tags Filter (if available) */}
          {tags && tags.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: any) => (
                  <Button
                    key={tag.id}
                    size="sm"
                    variant={filters.tagIds.includes(tag.id) ? 'default' : 'outline'}
                    onClick={() => {
                      const newTagIds = filters.tagIds.includes(tag.id)
                        ? filters.tagIds.filter((id) => id !== tag.id)
                        : [...filters.tagIds, tag.id]
                      updateFilters({ tagIds: newTagIds })
                    }}
                    style={{
                      borderColor: filters.tagIds.includes(tag.id) ? tag.color : undefined,
                      backgroundColor: filters.tagIds.includes(tag.id) ? tag.color : undefined,
                    }}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
