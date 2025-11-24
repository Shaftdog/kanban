'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProject, useMilestones } from '@/lib/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { MilestoneDialog } from '@/components/milestones/milestone-dialog'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id)
  const { data: milestones, isLoading: milestonesLoading } = useMilestones(id)
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false)

  if (projectError) {
    return (
      <div className="text-red-600 dark:text-red-400">
        Error loading project: {projectError.message}
      </div>
    )
  }

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4" />
          <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-full mb-2" />
        </div>
      </div>
    )
  }

  if (!project) {
    return <div>Project not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/projects')}
            className="mb-2 -ml-2"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {project.description}
            </p>
          )}
        </div>
        {project.status === 'ARCHIVED' && (
          <span className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full">
            Archived
          </span>
        )}
      </div>

      {/* Milestones Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Milestones
          </h2>
          <Button onClick={() => setMilestoneDialogOpen(true)}>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Milestone
          </Button>
        </div>

        {milestonesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 animate-pulse"
              >
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-full mb-2" />
                <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : milestones && milestones.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {milestones.map((milestone) => (
              <Card key={milestone.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-base">{milestone.name}</CardTitle>
                    <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                      {milestone.statusColumn?.name || 'Unknown'}
                    </span>
                  </div>
                  {milestone.description && (
                    <CardDescription className="text-sm line-clamp-2">
                      {milestone.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                      Value: {milestone.value}
                    </span>
                    <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                      Urgency: {milestone.urgency}
                    </span>
                    <span className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                      Effort: {milestone.effort}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {milestone._count?.tasks || 0} tasks
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-slate-400 dark:text-slate-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No milestones yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Break down your project into milestones
            </p>
            <Button onClick={() => setMilestoneDialogOpen(true)}>Add First Milestone</Button>
          </div>
        )}
      </div>

      {/* Milestone Dialog */}
      <MilestoneDialog
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        projectId={id}
      />
    </div>
  )
}
