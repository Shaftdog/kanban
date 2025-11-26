import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { updateTaskSchema } from '@/lib/validations'

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const task = await prisma.task.findFirst({
      where: {
        id,
        milestone: {
          project: {
            userId: session.user.id,
          },
        },
      },
      include: {
        milestone: {
          select: {
            id: true,
            name: true,
            projectId: true,
          },
        },
        statusColumn: true,
        dependsOnTask: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json({ data: task })
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify task belongs to user's project
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        milestone: {
          project: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    console.log('PATCH /api/tasks/[id] - Request body:', JSON.stringify(body, null, 2))
    const validatedData = updateTaskSchema.parse(body)
    console.log('PATCH /api/tasks/[id] - Validated data:', JSON.stringify(validatedData, null, 2))

    // Recalculate priority score if relevant fields changed
    let priorityScore = existingTask.priorityScore
    if (validatedData.value || validatedData.urgency || validatedData.effort) {
      const scoreMap = { LOW: 1, MEDIUM: 2, HIGH: 3, SMALL: 1, LARGE: 3 }
      const value = validatedData.value ?? existingTask.value
      const urgency = validatedData.urgency ?? existingTask.urgency
      const effort = validatedData.effort ?? existingTask.effort
      priorityScore = scoreMap[value] + scoreMap[urgency] - scoreMap[effort]
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...validatedData,
        priorityScore,
      },
      include: {
        statusColumn: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    return NextResponse.json({ data: task })
  } catch (error) {
    console.error('Error updating task:', error)

    // Log full error details
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify task belongs to user's project
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        milestone: {
          project: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await prisma.task.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
