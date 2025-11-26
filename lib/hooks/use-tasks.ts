import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateTaskData, UpdateTaskData } from '@/lib/validations'

// Fetch tasks for a milestone (or all tasks if no milestoneId)
export function useTasks(milestoneId?: string | null) {
  return useQuery({
    queryKey: ['tasks', milestoneId || 'all'],
    queryFn: async () => {
      const url = milestoneId
        ? `/api/tasks?milestoneId=${milestoneId}`
        : '/api/tasks'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const json = await response.json()
      return json.data
    },
  })
}

// Create task mutation
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTaskData) => {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }
      return response.json().then(r => r.data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.milestoneId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] })
    },
  })
}

// Update task mutation
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskData }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }
      return response.json().then(r => r.data)
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task.milestoneId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] })
    },
  })
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, milestoneId: _milestoneId }: { id: string; milestoneId: string }) => {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.milestoneId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] })
    },
  })
}

// Update task tags mutation
export function useUpdateTaskTags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, milestoneId: _milestoneId, tagIds }: { taskId: string; milestoneId: string; tagIds: string[] }) => {
      const response = await fetch(`/api/tasks/${taskId}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagIds }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task tags')
      }
      return response.json().then(r => r.data)
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.milestoneId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'all'] })
    },
  })
}
