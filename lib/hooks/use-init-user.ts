import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'

/**
 * Hook to check if user is initialized and initialize if needed
 */
export function useInitUser() {
  const [shouldInit, setShouldInit] = useState(false)

  // Check if user is initialized
  const { data: initStatus, isLoading: checkingStatus } = useQuery({
    queryKey: ['user-init-status'],
    queryFn: async () => {
      const response = await fetch('/api/init')
      if (!response.ok) throw new Error('Failed to check init status')
      return response.json()
    },
    retry: 1,
  })

  // Initialize user data mutation
  const initMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/init', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to initialize user')
      return response.json()
    },
  })

  // Auto-initialize if needed (runs once when status is known)
  useEffect(() => {
    if (initStatus?.data && !initStatus.data.isInitialized && !shouldInit) {
      setShouldInit(true)
      initMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initStatus])

  return {
    isInitialized: initStatus?.data?.isInitialized ?? false,
    isChecking: checkingStatus,
    isInitializing: initMutation.isPending,
    error: initMutation.error,
  }
}
