import { z } from 'zod'

export const taskSchema = z.object({
  milestoneId: z.string().uuid('Invalid milestone ID'),
  name: z.string().min(1, 'Task name is required').max(200, 'Name must be 200 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().nullable(),
  value: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  effort: z.enum(['SMALL', 'MEDIUM', 'LARGE']).default('SMALL'),
  statusColumnId: z.string().uuid('Invalid column ID'),
  dependsOnTaskId: z.string().uuid('Invalid task ID').optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
})

export const createTaskSchema = taskSchema.omit({ sortOrder: true, completedAt: true })

export const updateTaskSchema = taskSchema.partial().required({ milestoneId: true })

export const completeTaskSchema = z.object({
  completed: z.boolean(),
})

export type TaskFormData = z.infer<typeof taskSchema>
export type CreateTaskData = z.infer<typeof createTaskSchema>
export type UpdateTaskData = z.infer<typeof updateTaskSchema>
export type CompleteTaskData = z.infer<typeof completeTaskSchema>
