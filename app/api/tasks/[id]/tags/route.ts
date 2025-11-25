import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTagsSchema = z.object({
  tagIds: z.array(z.string().uuid()),
})

// PUT /api/tasks/[id]/tags - Update tags for a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: taskId } = await params
    const body = await request.json()
    const { tagIds } = updateTagsSchema.parse(body)

    // Verify task belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        milestone: {
          project: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Verify all tags belong to user
    const tags = await prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        userId: session.user.id,
      },
    })

    if (tags.length !== tagIds.length) {
      return NextResponse.json(
        { error: 'One or more tags not found' },
        { status: 404 }
      )
    }

    // Delete existing tags
    await prisma.taskTag.deleteMany({
      where: { taskId },
    })

    // Create new tag associations
    if (tagIds.length > 0) {
      await prisma.taskTag.createMany({
        data: tagIds.map((tagId) => ({
          taskId,
          tagId,
        })),
      })
    }

    // Fetch updated task with tags
    const updatedTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({ data: updatedTask })
  } catch (error) {
    console.error('Error updating task tags:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update task tags' },
      { status: 500 }
    )
  }
}
