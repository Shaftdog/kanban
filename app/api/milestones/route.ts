import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { createMilestoneSchema } from '@/lib/validations'

// GET /api/milestones?projectId=xxx - List milestones for a project (or all if no projectId)
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
    const projectId = searchParams.get('projectId')

    // If projectId is provided, verify it belongs to user
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.user.id,
        },
      })

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
    }

    // Fetch milestones - either for specific project or all user's milestones
    const milestones = await prisma.milestone.findMany({
      where: projectId
        ? {
            projectId,
          }
        : {
            project: {
              userId: session.user.id,
            },
          },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        statusColumn: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        dependsOnMilestone: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json({ data: milestones })
  } catch (error) {
    console.error('Error fetching milestones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    )
  }
}

// POST /api/milestones - Create a new milestone
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
    const validatedData = createMilestoneSchema.parse(body)

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get the highest sortOrder to append the new milestone at the end
    const lastMilestone = await prisma.milestone.findFirst({
      where: { projectId: validatedData.projectId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    // Calculate priority score (simple formula: value + urgency - effort)
    const scoreMap = { LOW: 1, MEDIUM: 2, HIGH: 3, SMALL: 1, LARGE: 3 }
    const priorityScore =
      scoreMap[validatedData.value] +
      scoreMap[validatedData.urgency] -
      scoreMap[validatedData.effort]

    const milestone = await prisma.milestone.create({
      data: {
        ...validatedData,
        sortOrder: (lastMilestone?.sortOrder ?? -1) + 1,
        priorityScore,
      },
      include: {
        statusColumn: true,
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    })

    return NextResponse.json({ data: milestone }, { status: 201 })
  } catch (error) {
    console.error('Error creating milestone:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create milestone' },
      { status: 500 }
    )
  }
}
