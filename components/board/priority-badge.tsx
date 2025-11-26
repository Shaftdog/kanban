'use client'

interface WBSBadgeProps {
  wbsCode: string // e.g., "1", "1.2", or "1.2.3"
  type: 'project' | 'milestone' | 'task'
}

export function WBSBadge({ wbsCode, type }: WBSBadgeProps) {
  // Hide if no priority set (wbs code is just zeros)
  if (wbsCode === '0' || wbsCode === '0.0' || wbsCode === '0.0.0') return null

  const getColorClass = () => {
    switch (type) {
      case 'project':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700'
      case 'milestone':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700'
      case 'task':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
    }
  }

  const getLabel = () => {
    switch (type) {
      case 'project':
        return 'WBS'
      case 'milestone':
        return 'WBS'
      case 'task':
        return 'WBS'
    }
  }

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${getColorClass()}`}
      title={`Work Breakdown Structure: ${wbsCode}`}
    >
      <span className="font-mono">{wbsCode}</span>
    </div>
  )
}

// Keep the old name for backwards compatibility
export { WBSBadge as PriorityBadge }
