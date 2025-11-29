import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWorkspaceContext } from '@/lib/workspace'

/**
 * GET /api/workspace
 * Get current workspace details and members
 */
export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContext()

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        invitations: {
          where: {
            acceptedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            projects: true,
            columns: true,
            tags: true,
          },
        },
      },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    return NextResponse.json({ data: workspace })
  } catch (error) {
    console.error('Error fetching workspace:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    )
  }
}
