import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  priority: z.number().int().min(0).max(999).default(0),
  sortOrder: z.number().int().nonnegative().default(0),
})

export const createProjectSchema = projectSchema.omit({ sortOrder: true })

export const updateProjectSchema = projectSchema.partial()

export type ProjectFormData = z.infer<typeof projectSchema>
export type CreateProjectData = z.infer<typeof createProjectSchema>
export type UpdateProjectData = z.infer<typeof updateProjectSchema>
