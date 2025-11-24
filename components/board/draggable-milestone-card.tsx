'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { MilestoneCard } from './milestone-card'

interface DraggableMilestoneCardProps {
  milestone: any
}

export function DraggableMilestoneCard({ milestone }: DraggableMilestoneCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: milestone.id,
    data: {
      milestone,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <MilestoneCard milestone={milestone} />
    </div>
  )
}
