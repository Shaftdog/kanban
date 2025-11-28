'use client'

import { PriorityBadge } from './priority-badge'

interface ProjectCardProps {
  project: any
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-purple-500">
      {/* Header with Priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-semibold text-slate-900 dark:text-white flex-1">
          {project.name}
        </h4>
        <PriorityBadge wbsCode={String(project.priority || 0)} type="project" />
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          {/* Milestone count */}
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{project._count?.milestones || 0} milestones</span>
          </div>
        </div>

        {/* Created date */}
        {project.createdAt && (
          <span>
            {new Date(project.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}
      </div>
    </div>
  )
}
