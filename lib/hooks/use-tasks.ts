import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreateTaskData, UpdateTaskData } from '@/lib/validations'

// Fetch tasks for a milestone
export function useTasks(milestoneId: string) {
  return useQuery({
    queryKey: ['tasks', milestoneId],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?milestoneId=${milestoneId}`)
      if (!response.ok) throw new Error('Failed to fetch tasks')
      const json = await response.json()
      return json.data
    },
    enabled: !!milestoneId,
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
    },
  })
}

// Delete task mutation
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, milestoneId }: { id: string; milestoneId: string }) => {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.milestoneId] })
    },
  })
}
