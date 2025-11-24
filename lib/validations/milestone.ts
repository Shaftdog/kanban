import { z } from 'zod'

export const milestoneSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  name: z.string().min(1, 'Milestone name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().nullable(),
  value: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  effort: z.enum(['SMALL', 'MEDIUM', 'LARGE']).default('MEDIUM'),
  statusColumnId: z.string().uuid('Invalid column ID'),
  dependsOnMilestoneId: z.string().uuid('Invalid milestone ID').optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
})

export const createMilestoneSchema = milestoneSchema.omit({ sortOrder: true })

export const updateMilestoneSchema = milestoneSchema.partial().required({ projectId: true })

export type MilestoneFormData = z.infer<typeof milestoneSchema>
export type CreateMilestoneData = z.infer<typeof createMilestoneSchema>
export type UpdateMilestoneData = z.infer<typeof updateMilestoneSchema>
