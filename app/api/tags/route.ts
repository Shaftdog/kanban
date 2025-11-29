import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTagSchema } from '@/lib/validations'
import { getWorkspaceContext } from '@/lib/workspace'

// GET /api/tags - List all tags for the workspace
export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContext()

    const tags = await prisma.tag.findMany({
      where: {
        workspaceId,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ data: tags })
  } catch (error) {
    console.error('Error fetching tags:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await getWorkspaceContext()

    const body = await request.json()
    const validatedData = createTagSchema.parse(body)

    const tag = await prisma.tag.create({
      data: {
        ...validatedData,
        workspaceId,
        userId,
      },
    })

    return NextResponse.json({ data: tag }, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)

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
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
