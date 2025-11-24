import { z } from 'zod'

export const columnSchema = z.object({
  name: z.string().min(1, 'Column name is required').max(50, 'Name must be 50 characters or less'),
  key: z.enum(['PROJECTS', 'BACKLOG', 'WORKING', 'READY_TEST', 'AGENT_TESTING', 'DEPLOYED_TESTING', 'COMPLETED']),
  sortOrder: z.number().int().nonnegative(),
})

export const updateColumnSchema = z.object({
  name: z.string().min(1, 'Column name is required').max(50, 'Name must be 50 characters or less'),
})

export const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string().uuid()).min(1, 'At least one column ID is required'),
})

export type ColumnFormData = z.infer<typeof columnSchema>
export type UpdateColumnData = z.infer<typeof updateColumnSchema>
export type ReorderColumnsData = z.infer<typeof reorderColumnsSchema>
