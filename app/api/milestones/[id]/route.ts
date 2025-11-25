import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { updateMilestoneSchema } from '@/lib/validations'

// GET /api/milestones/[id] - Get a single milestone
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

    const milestone = await prisma.milestone.findFirst({
      where: {
        id,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        project: true,
        statusColumn: true,
        dependsOnMilestone: {
          select: {
            id: true,
            name: true,
          },
        },
        tasks: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
          include: {
            statusColumn: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    })

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    return NextResponse.json({ data: milestone })
  } catch (error) {
    console.error('Error fetching milestone:', error)
    return NextResponse.json(
      { error: 'Failed to fetch milestone' },
      { status: 500 }
    )
  }
}

// PATCH /api/milestones/[id] - Update a milestone
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

    // Verify milestone belongs to user's project
    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        id,
        project: {
          userId: session.user.id,
        },
      },
    })

    if (!existingMilestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateMilestoneSchema.parse(body)

    // Recalculate priority score if relevant fields changed
    let priorityScore = existingMilestone.priorityScore
    if (validatedData.value || validatedData.urgency || validatedData.effort) {
      const scoreMap = { LOW: 1, MEDIUM: 2, HIGH: 3, SMALL: 1, LARGE: 3 }
      const value = validatedData.value ?? existingMilestone.value
      const urgency = validatedData.urgency ?? existingMilestone.urgency
      const effort = validatedData.effort ?? existingMilestone.effort
      priorityScore = scoreMap[value] + scoreMap[urgency] - scoreMap[effort]
    }

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...validatedData,
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

    return NextResponse.json({ data: milestone })
  } catch (error) {
    console.error('Error updating milestone:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update milestone' },
      { status: 500 }
    )
  }
}

// DELETE /api/milestones/[id] - Delete a milestone
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

    // Verify milestone belongs to user's project
    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        id,
        project: {
          userId: session.user.id,
        },
      },
    })

    if (!existingMilestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    await prisma.milestone.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error deleting milestone:', error)
    return NextResponse.json(
      { error: 'Failed to delete milestone' },
      { status: 500 }
    )
  }
}
