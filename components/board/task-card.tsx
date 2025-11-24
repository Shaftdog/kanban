'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Task {
  id: string
  name: string
  description: string | null
  value: 'LOW' | 'MEDIUM' | 'HIGH'
  urgency: 'LOW' | 'MEDIUM' | 'HIGH'
  effort: 'SMALL' | 'MEDIUM' | 'LARGE'
  priorityScore: number | null
  completedAt: Date | null
  statusColumnId: string
}

interface TaskCardProps {
  task: Task
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

export function TaskCard({ task }: TaskCardProps) {
  const isCompleted = task.completedAt !== null

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-slate-800 border-l-4 border-l-blue-500">
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start gap-2">
          {/* Checkbox for completed state */}
          {isCompleted && (
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <CardTitle
            className={`text-sm font-medium flex-1 ${
              isCompleted
                ? 'text-slate-500 dark:text-slate-500 line-through'
                : 'text-slate-900 dark:text-white'
            } line-clamp-2`}
          >
            {task.name}
          </CardTitle>
        </div>

        {task.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
            {task.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {/* Priority Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`px-1.5 py-0.5 text-xs rounded ${priorityColors[task.value]}`}>
            V: {task.value}
          </span>
          <span className={`px-1.5 py-0.5 text-xs rounded ${priorityColors[task.urgency]}`}>
            U: {task.urgency}
          </span>
          <span className={`px-1.5 py-0.5 text-xs rounded ${effortColors[task.effort]}`}>
            E: {task.effort}
          </span>
        </div>

        {/* Priority Score */}
        {task.priorityScore !== null && !isCompleted && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-400">Priority</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {task.priorityScore.toFixed(1)}
              </span>
            </div>
            <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                style={{ width: `${Math.min(task.priorityScore * 10, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
