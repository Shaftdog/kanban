import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateMilestoneData, UpdateMilestoneData } from '@/lib/validations'

interface Milestone {
  id: string
  projectId: string
  name: string
  description: string | null
  value: 'LOW' | 'MEDIUM' | 'HIGH'
  urgency: 'LOW' | 'MEDIUM' | 'HIGH'
  effort: 'SMALL' | 'MEDIUM' | 'LARGE'
  statusColumnId: string
  priorityScore: number | null
  dependsOnMilestoneId: string | null
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  statusColumn?: {
    id: string
    name: string
    key: string
  }
  project?: {
    id: string
    name: string
  }
  _count?: {
    tasks: number
  }
}

// Fetch milestones for a project (or all milestones if no projectId)
export function useMilestones(projectId?: string | null) {
  return useQuery({
    queryKey: ['milestones', projectId || 'all'],
    queryFn: async (): Promise<Milestone[]> => {
      const url = projectId
        ? `/api/milestones?projectId=${projectId}`
        : '/api/milestones'
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch milestones')
      }
      const json = await response.json()
      return json.data
    },
  })
}

// Fetch single milestone
export function useMilestone(id: string) {
  return useQuery({
    queryKey: ['milestones', id],
    queryFn: async (): Promise<Milestone> => {
      const response = await fetch(`/api/milestones/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch milestone')
      }
      const json = await response.json()
      return json.data
    },
    enabled: !!id,
  })
}

// Create milestone mutation
export function useCreateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMilestoneData): Promise<Milestone> => {
      const response = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create milestone')
      }

      const json = await response.json()
      return json.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['milestones', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['milestones', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] })
    },
  })
}

// Update milestone mutation
export function useUpdateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: UpdateMilestoneData
    }): Promise<Milestone> => {
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update milestone')
      }

      const json = await response.json()
      return json.data
    },
    onSuccess: (milestone) => {
      queryClient.invalidateQueries({ queryKey: ['milestones', milestone.projectId] })
      queryClient.invalidateQueries({ queryKey: ['milestones', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['milestones', milestone.id] })
      queryClient.invalidateQueries({ queryKey: ['projects', milestone.projectId] })
    },
  })
}

// Delete milestone mutation
export function useDeleteMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, projectId: _projectId }: { id: string; projectId: string }): Promise<void> => {
      const response = await fetch(`/api/milestones/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete milestone')
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['milestones', variables.projectId] })
      queryClient.invalidateQueries({ queryKey: ['milestones', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.projectId] })
    },
  })
}

// Fetch milestone dependencies
export function useMilestoneDependencies(milestoneId: string) {
  return useQuery({
    queryKey: ['milestone-dependencies', milestoneId],
    queryFn: async () => {
      const response = await fetch(`/api/milestones/${milestoneId}/dependencies`)
      if (!response.ok) {
        throw new Error('Failed to fetch dependencies')
      }
      const json = await response.json()
      return json.data
    },
    enabled: !!milestoneId,
  })
}

// Update milestone dependency
export function useUpdateMilestoneDependency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      milestoneId,
      projectId: _projectId,
      dependsOnMilestoneId,
    }: {
      milestoneId: string
      projectId: string
      dependsOnMilestoneId: string | null
    }) => {
      const response = await fetch(`/api/milestones/${milestoneId}/dependencies`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dependsOnMilestoneId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update dependency')
      }

      return response.json().then((r) => r.data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['milestone-dependencies', variables.milestoneId] })
      queryClient.invalidateQueries({ queryKey: ['milestones'] })
    },
  })
}
