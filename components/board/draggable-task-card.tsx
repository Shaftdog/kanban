'use client'

import { useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from './task-card'

interface DraggableTaskCardProps {
  task: any
  onClick?: () => void
}

export function DraggableTaskCard({ task, onClick }: DraggableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
      task,
    },
  })

  // Track if this is a click vs drag
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  const hasDragged = useRef(false)

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY }
    hasDragged.current = false
    // Call the original listener
    listeners?.onPointerDown?.(e as any)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartPos.current) {
      const dx = Math.abs(e.clientX - dragStartPos.current.x)
      const dy = Math.abs(e.clientY - dragStartPos.current.y)
      if (dx > 5 || dy > 5) {
        hasDragged.current = true
      }
    }
  }

  const handlePointerUp = () => {
    if (!hasDragged.current && onClick) {
      onClick()
    }
    dragStartPos.current = null
    hasDragged.current = false
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <TaskCard task={task} />
    </div>
  )
}
