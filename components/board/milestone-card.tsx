'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Milestone {
  id: string
  name: string
  description: string | null
  value: 'LOW' | 'MEDIUM' | 'HIGH'
  urgency: 'LOW' | 'MEDIUM' | 'HIGH'
  effort: 'SMALL' | 'MEDIUM' | 'LARGE'
  priorityScore: number | null
  statusColumnId: string
  _count?: {
    tasks: number
  }
}

interface MilestoneCardProps {
  milestone: Milestone
}

const priorityColors = {
  LOW: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  MEDIUM: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  HIGH: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
}

const effortColors = {
  SMALL: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  MEDIUM: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  LARGE: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

export function MilestoneCard({ milestone }: MilestoneCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-800 border-l-4 border-l-purple-500">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
            {milestone.name}
          </CardTitle>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {milestone.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
            {milestone.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {/* Priority Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[milestone.value]}`}>
            V: {milestone.value}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${priorityColors[milestone.urgency]}`}>
            U: {milestone.urgency}
          </span>
          <span className={`px-2 py-0.5 text-xs rounded ${effortColors[milestone.effort]}`}>
            E: {milestone.effort}
          </span>
        </div>

        {/* Priority Score */}
        {milestone.priorityScore !== null && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400">Priority Score</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {milestone.priorityScore.toFixed(1)}
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${Math.min(milestone.priorityScore * 10, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Tasks Count */}
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <span>{milestone._count?.tasks || 0} tasks</span>
        </div>

        {/* Expanded Tasks Section (placeholder for now) */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Task list coming soon...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
