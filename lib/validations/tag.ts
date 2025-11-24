import { z } from 'zod'

export const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Name must be 50 characters or less'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color').default('#3b82f6'),
})

export const createTagSchema = tagSchema

export const updateTagSchema = tagSchema.partial()

export type TagFormData = z.infer<typeof tagSchema>
export type CreateTagData = z.infer<typeof createTagSchema>
export type UpdateTagData = z.infer<typeof updateTagSchema>
