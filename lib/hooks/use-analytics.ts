import { useQuery } from '@tanstack/react-query'

export interface AnalyticsData {
  overview: {
    totalProjects: number
    totalMilestones: number
    totalTasks: number
    completedTasks: number
    completionRate: number
  }
  tasksByColumn: Array<{
    column: string
    columnKey: string
    count: number
  }>
  tasksByPriority: Array<{
    priority: string
    count: number
  }>
  tasksByEffort: Array<{
    effort: string
    count: number
  }>
  completionTrend: Array<{
    date: string
    completed: number
  }>
  projectBreakdown: Array<{
    projectName: string
    milestones: number
    tasks: number
    completedTasks: number
  }>
  recentActivity: Array<{
    type: 'milestone' | 'task'
    name: string
    action: string
    timestamp: string
  }>
}

interface UseAnalyticsOptions {
  projectId?: string | null
  startDate?: string | null
  endDate?: string | null
}

async function fetchAnalytics(options: UseAnalyticsOptions): Promise<AnalyticsData> {
  const params = new URLSearchParams()
  if (options.projectId) {
    params.set('projectId', options.projectId)
  }
  if (options.startDate) {
    params.set('startDate', options.startDate)
  }
  if (options.endDate) {
    params.set('endDate', options.endDate)
  }

  const url = `/api/analytics${params.toString() ? `?${params}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch analytics')
  }

  return response.json()
}

export function useAnalytics(options: UseAnalyticsOptions = {}) {
  return useQuery({
    queryKey: ['analytics', options.projectId, options.startDate, options.endDate],
    queryFn: () => fetchAnalytics(options),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  })
}
