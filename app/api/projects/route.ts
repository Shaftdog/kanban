import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createProjectSchema } from '@/lib/validations'
import { getWorkspaceContext } from '@/lib/workspace'

// GET /api/projects - List all projects for the authenticated user's workspace
export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContext()

    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: {
            milestones: true,
          },
        },
      },
    })

    return NextResponse.json({ data: projects })
  } catch (error) {
    console.error('Error fetching projects:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await getWorkspaceContext()

    const body = await request.json()
    const validatedData = createProjectSchema.parse(body)

    // Get the highest sortOrder to append the new project at the end
    const lastProject = await prisma.project.findFirst({
      where: { workspaceId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const project = await prisma.project.create({
      data: {
        ...validatedData,
        workspaceId,
        userId,
        sortOrder: (lastProject?.sortOrder ?? -1) + 1,
      },
    })

    return NextResponse.json({ data: project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
