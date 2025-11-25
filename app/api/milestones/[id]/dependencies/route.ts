import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateDependencySchema = z.object({
  dependsOnMilestoneId: z.string().uuid().nullable(),
})

// Check for circular dependencies
async function wouldCreateCircularDependency(
  milestoneId: string,
  newDependencyId: string | null
): Promise<boolean> {
  if (!newDependencyId) return false
  if (milestoneId === newDependencyId) return true

  // Walk the dependency chain to check for cycles
  const visited = new Set<string>()
  let currentId: string | null = newDependencyId

  while (currentId) {
    if (visited.has(currentId)) return true
    if (currentId === milestoneId) return true
    visited.add(currentId)

    const dep: { dependsOnMilestoneId: string | null } | null = await prisma.milestone.findUnique({
      where: { id: currentId },
      select: { dependsOnMilestoneId: true },
    })
    currentId = dep?.dependsOnMilestoneId || null
  }

  return false
}

// PUT /api/milestones/[id]/dependencies - Update milestone dependency
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

    const { id: milestoneId } = await params
    const body = await request.json()
    const { dependsOnMilestoneId } = updateDependencySchema.parse(body)

    // Verify milestone belongs to user
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

    // If setting a dependency, verify it belongs to user and check for circular
    if (dependsOnMilestoneId) {
      const dependencyMilestone = await prisma.milestone.findFirst({
        where: {
          id: dependsOnMilestoneId,
          project: {
            userId: session.user.id,
          },
        },
      })

      if (!dependencyMilestone) {
        return NextResponse.json(
          { error: 'Dependency milestone not found' },
          { status: 404 }
        )
      }

      // Check for circular dependency
      const isCircular = await wouldCreateCircularDependency(
        milestoneId,
        dependsOnMilestoneId
      )
      if (isCircular) {
        return NextResponse.json(
          { error: 'This would create a circular dependency' },
          { status: 400 }
        )
      }
    }

    // Update the milestone
    const updatedMilestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: { dependsOnMilestoneId },
      include: {
        dependsOnMilestone: {
          select: { id: true, name: true },
        },
        blockedMilestones: {
          select: { id: true, name: true },
        },
      },
    })

    return NextResponse.json({ data: updatedMilestone })
  } catch (error) {
    console.error('Error updating milestone dependency:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update milestone dependency' },
      { status: 500 }
    )
  }
}

// GET /api/milestones/[id]/dependencies - Get milestone dependencies
export async function GET(
  _request: NextRequest,
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

    const { id: milestoneId } = await params

    // Verify milestone belongs to user and get dependencies
    const milestone = await prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        dependsOnMilestone: {
          select: { id: true, name: true, statusColumnId: true },
        },
        blockedMilestones: {
          select: { id: true, name: true, statusColumnId: true },
        },
      },
    })

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        dependsOn: milestone.dependsOnMilestone,
        blocks: milestone.blockedMilestones,
      },
    })
  } catch (error) {
    console.error('Error fetching milestone dependencies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dependencies' },
      { status: 500 }
    )
  }
}
