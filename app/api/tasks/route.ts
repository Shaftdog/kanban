import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createTaskSchema } from '@/lib/validations'

// GET /api/tasks?milestoneId=xxx - List tasks for a milestone (or all if no milestoneId)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const milestoneId = searchParams.get('milestoneId')

    // If milestoneId is provided, verify it belongs to user
    if (milestoneId) {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id: milestoneId,
          project: {
            userId: session.user.id,
          },
        },
      })

      if (!milestone) {
        return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
      }
    }

    // Fetch tasks - either for specific milestone or all user's tasks
    const tasks = await prisma.task.findMany({
      where: milestoneId
        ? {
            milestoneId,
          }
        : {
            milestone: {
              project: {
                userId: session.user.id,
              },
            },
          },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        statusColumn: true,
        milestone: {
          select: {
            id: true,
            name: true,
            priority: true,
            project: {
              select: {
                id: true,
                name: true,
                priority: true,
              },
            },
          },
        },
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

    return NextResponse.json({ data: tasks })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // Verify milestone belongs to user's project
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: validatedData.milestoneId,
        project: {
          userId: session.user.id,
        },
      },
    })

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    // Get the highest sortOrder
    const lastTask = await prisma.task.findFirst({
      where: { milestoneId: validatedData.milestoneId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    // Calculate priority score
    const scoreMap = { LOW: 1, MEDIUM: 2, HIGH: 3, SMALL: 1, LARGE: 3 }
    const priorityScore =
      scoreMap[validatedData.value] +
      scoreMap[validatedData.urgency] -
      scoreMap[validatedData.effort]

    const task = await prisma.task.create({
      data: {
        ...validatedData,
        sortOrder: (lastTask?.sortOrder ?? -1) + 1,
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

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
