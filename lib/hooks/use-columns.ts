import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UpdateColumnData } from '@/lib/validations'

// Fetch all columns
export function useColumns() {
  return useQuery({
    queryKey: ['columns'],
    queryFn: async () => {
      const response = await fetch('/api/columns')
      if (!response.ok) throw new Error('Failed to fetch columns')
      const json = await response.json()
      return json.data
    },
  })
}

// Update column mutation (rename only)
export function useUpdateColumn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateColumnData }) => {
      const response = await fetch(`/api/columns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update column')
      }
      return response.json().then(r => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['columns'] })
    },
  })
}
