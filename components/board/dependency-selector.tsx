'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMilestones, useMilestoneDependencies, useUpdateMilestoneDependency } from '@/lib/hooks'
import { toast } from 'sonner'

interface DependencySelectorProps {
  milestoneId: string
  projectId: string
}

export function DependencySelector({ milestoneId, projectId }: DependencySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { data: allMilestones, isLoading: milestonesLoading } = useMilestones(projectId)
  const { data: dependencies, isLoading: depsLoading } = useMilestoneDependencies(milestoneId)
  const updateDependency = useUpdateMilestoneDependency()

  // Filter out the current milestone from the list of available dependencies
  const availableMilestones = (allMilestones || []).filter(
    (m: any) => m.id !== milestoneId
  )

  const handleDependencyChange = async (value: string) => {
    const newDependencyId = value === 'none' ? null : value

    try {
      await updateDependency.mutateAsync({
        milestoneId,
        projectId,
        dependsOnMilestoneId: newDependencyId,
      })
      toast.success(
        newDependencyId ? 'Dependency set successfully' : 'Dependency removed'
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update dependency'
      )
    }
  }

  const isLoading = milestonesLoading || depsLoading

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Dependencies</Label>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isExpanded ? 'Hide' : 'Edit'}
        </button>
      </div>

      {/* Current Dependencies Display */}
      <div className="space-y-2">
        {/* Depends On */}
        {dependencies?.dependsOn ? (
          <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
            <svg
              className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-medium">Depends on:</span> {dependencies.dependsOn.name}
            </span>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No dependencies set
          </p>
        )}

        {/* Blocks */}
        {dependencies?.blocks && dependencies.blocks.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Blocks
            </p>
            {dependencies.blocks.map((blocked: any) => (
              <div
                key={blocked.id}
                className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-md"
              >
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <span className="text-sm text-red-800 dark:text-red-200">
                  {blocked.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Panel */}
      {isExpanded && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
          <div className="space-y-2">
            <Label className="text-xs">Depends On</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
              </div>
            ) : (
              <Select
                value={dependencies?.dependsOn?.id || 'none'}
                onValueChange={handleDependencyChange}
                disabled={updateDependency.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a milestone..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-slate-500">No dependency</span>
                  </SelectItem>
                  {availableMilestones.map((milestone: any) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This milestone cannot start until the dependency is completed.
            </p>
          </div>

          {updateDependency.isPending && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-600"></div>
              Updating...
            </div>
          )}
        </div>
      )}
    </div>
  )
}
