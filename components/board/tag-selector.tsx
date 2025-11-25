'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTags, useCreateTag, useUpdateTaskTags } from '@/lib/hooks'
import { toast } from 'sonner'

interface Tag {
  id: string
  name: string
  color: string
}

interface TaskTag {
  taskId: string
  tagId: string
  tag: Tag
}

interface TagSelectorProps {
  taskId: string
  milestoneId: string
  selectedTags: TaskTag[]
  onTagsChange?: () => void
}

const defaultColors = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

export function TagSelector({ taskId, milestoneId, selectedTags, onTagsChange }: TagSelectorProps) {
  const { data: allTags, isLoading } = useTags()
  const createTag = useCreateTag()
  const updateTaskTags = useUpdateTaskTags()

  const [isCreating, setIsCreating] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagColor, setNewTagColor] = useState(defaultColors[0])
  const [isExpanded, setIsExpanded] = useState(false)

  const selectedTagIds = new Set(selectedTags.map((t) => t.tagId))

  const handleToggleTag = async (tagId: string) => {
    const newTagIds = selectedTagIds.has(tagId)
      ? Array.from(selectedTagIds).filter((id) => id !== tagId)
      : [...Array.from(selectedTagIds), tagId]

    try {
      await updateTaskTags.mutateAsync({
        taskId,
        milestoneId,
        tagIds: newTagIds,
      })
      onTagsChange?.()
    } catch (error) {
      toast.error('Failed to update tags')
    }
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    try {
      const tag = await createTag.mutateAsync({
        name: newTagName.trim(),
        color: newTagColor,
      })

      // Add the new tag to the task
      await updateTaskTags.mutateAsync({
        taskId,
        milestoneId,
        tagIds: [...Array.from(selectedTagIds), tag.id],
      })

      setNewTagName('')
      setIsCreating(false)
      onTagsChange?.()
      toast.success('Tag created and added')
    } catch (error) {
      toast.error('Failed to create tag')
    }
  }

  return (
    <div className="space-y-2">
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.length === 0 ? (
          <span className="text-sm text-slate-500 dark:text-slate-400">No tags</span>
        ) : (
          selectedTags.map((taskTag) => (
            <span
              key={taskTag.tagId}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full text-white"
              style={{ backgroundColor: taskTag.tag.color }}
            >
              {taskTag.tag.name}
              <button
                onClick={() => handleToggleTag(taskTag.tagId)}
                className="hover:bg-white/20 rounded-full p-0.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isExpanded ? 'Hide' : 'Edit tags'}
        </button>
      </div>

      {/* Tag Selection Panel */}
      {isExpanded && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
          {/* Available Tags */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
              Available Tags
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
              </div>
            ) : allTags && allTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((tag: Tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleToggleTag(tag.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full transition-all ${
                      selectedTagIds.has(tag.id)
                        ? 'ring-2 ring-offset-1 ring-blue-500'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: tag.color,
                      color: 'white',
                    }}
                  >
                    {selectedTagIds.has(tag.id) && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No tags yet</p>
            )}
          </div>

          {/* Create New Tag */}
          {isCreating ? (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name..."
                autoFocus
                className="h-8 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateTag()
                  if (e.key === 'Escape') {
                    setIsCreating(false)
                    setNewTagName('')
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Color:</span>
                <div className="flex gap-1">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-5 h-5 rounded-full transition-all ${
                        newTagColor === color ? 'ring-2 ring-offset-1 ring-slate-400' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || createTag.isPending}
                  className="h-7 text-xs"
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false)
                    setNewTagName('')
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 pt-2 border-t border-slate-200 dark:border-slate-700"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create new tag
            </button>
          )}
        </div>
      )}
    </div>
  )
}
