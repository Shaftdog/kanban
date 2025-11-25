import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ColumnKey, Column, Priority, Effort } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// Type definitions for Prisma results
type TaskWithRelations = {
  id: string
  value: Priority
  effort: Effort
  completedAt: Date | null
  statusColumn: { name: string; key: ColumnKey }
  milestone: { project: { id: string; name: string } }
}

type MilestoneWithRelations = {
  project: { name: string }
  statusColumn: { name: string; key: ColumnKey }
}

type RecentMilestone = {
  name: string
  updatedAt: Date
  statusColumn: { name: string }
}

type RecentTask = {
  name: string
  updatedAt: Date
  completedAt: Date | null
  statusColumn: { name: string }
}

interface AnalyticsData {
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

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get URL params for date filtering
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Fetch all data in parallel
    const [
      projects,
      columns,
      milestones,
      tasks,
      recentMilestones,
      recentTasks
    ] = await Promise.all([
      // Get projects
      prisma.project.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          ...(projectId ? { id: projectId } : {})
        },
        select: {
          id: true,
          name: true
        }
      }),
      // Get columns
      prisma.column.findMany({
        where: { userId },
        orderBy: { sortOrder: 'asc' }
      }),
      // Get milestones
      prisma.milestone.findMany({
        where: {
          project: {
            userId,
            status: 'ACTIVE',
            ...(projectId ? { id: projectId } : {})
          },
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        },
        include: {
          project: { select: { name: true } },
          statusColumn: { select: { name: true, key: true } }
        }
      }),
      // Get tasks
      prisma.task.findMany({
        where: {
          milestone: {
            project: {
              userId,
              status: 'ACTIVE',
              ...(projectId ? { id: projectId } : {})
            }
          },
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        },
        include: {
          milestone: {
            select: {
              name: true,
              project: { select: { id: true, name: true } }
            }
          },
          statusColumn: { select: { name: true, key: true } }
        }
      }),
      // Recent milestones
      prisma.milestone.findMany({
        where: {
          project: {
            userId,
            status: 'ACTIVE'
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          name: true,
          updatedAt: true,
          statusColumn: { select: { name: true } }
        }
      }),
      // Recent tasks
      prisma.task.findMany({
        where: {
          milestone: {
            project: {
              userId,
              status: 'ACTIVE'
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          name: true,
          updatedAt: true,
          completedAt: true,
          statusColumn: { select: { name: true } }
        }
      })
    ])

    // Calculate overview
    const typedTasks = tasks as TaskWithRelations[]
    const typedMilestones = milestones as MilestoneWithRelations[]
    const typedRecentMilestones = recentMilestones as RecentMilestone[]
    const typedRecentTasks = recentTasks as RecentTask[]
    const typedColumns = columns as Column[]

    const completedTasks = typedTasks.filter((t: TaskWithRelations) => t.statusColumn.key === ColumnKey.COMPLETED).length
    const totalTasks = typedTasks.length

    const overview = {
      totalProjects: projects.length,
      totalMilestones: milestones.length,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    }

    // Tasks by column
    const tasksByColumn = typedColumns.map((col: Column) => ({
      column: col.name,
      columnKey: col.key,
      count: typedTasks.filter((t: TaskWithRelations) => t.statusColumn.key === col.key).length
    }))

    // Tasks by priority (value)
    const tasksByPriority = ['HIGH', 'MEDIUM', 'LOW'].map((priority: string) => ({
      priority,
      count: typedTasks.filter((t: TaskWithRelations) => t.value === priority).length
    }))

    // Tasks by effort
    const tasksByEffort = ['SMALL', 'MEDIUM', 'LARGE'].map((effort: string) => ({
      effort,
      count: typedTasks.filter((t: TaskWithRelations) => t.effort === effort).length
    }))

    // Completion trend (last 7 days)
    const completionTrend: AnalyticsData['completionTrend'] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const completedOnDay = typedTasks.filter((t: TaskWithRelations) => {
        if (!t.completedAt) return false
        const completed = new Date(t.completedAt)
        return completed >= date && completed < nextDate
      }).length

      completionTrend.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        completed: completedOnDay
      })
    }

    // Project breakdown
    const projectBreakdown = projects.map((project: { id: string; name: string }) => {
      const projectMilestones = typedMilestones.filter((m: MilestoneWithRelations) => m.project.name === project.name)
      const projectTasks = typedTasks.filter((t: TaskWithRelations) => t.milestone.project.id === project.id)
      const projectCompletedTasks = projectTasks.filter((t: TaskWithRelations) => t.statusColumn.key === ColumnKey.COMPLETED).length

      return {
        projectName: project.name,
        milestones: projectMilestones.length,
        tasks: projectTasks.length,
        completedTasks: projectCompletedTasks
      }
    })

    // Recent activity
    const recentActivity: AnalyticsData['recentActivity'] = []

    typedRecentMilestones.forEach((m: RecentMilestone) => {
      recentActivity.push({
        type: 'milestone',
        name: m.name,
        action: `Moved to ${m.statusColumn.name}`,
        timestamp: m.updatedAt.toISOString()
      })
    })

    typedRecentTasks.forEach((t: RecentTask) => {
      recentActivity.push({
        type: 'task',
        name: t.name,
        action: t.completedAt ? 'Completed' : `Moved to ${t.statusColumn.name}`,
        timestamp: t.updatedAt.toISOString()
      })
    })

    // Sort by timestamp and take latest 10
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    const latestActivity = recentActivity.slice(0, 10)

    const analyticsData: AnalyticsData = {
      overview,
      tasksByColumn,
      tasksByPriority,
      tasksByEffort,
      completionTrend,
      projectBreakdown,
      recentActivity: latestActivity
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
