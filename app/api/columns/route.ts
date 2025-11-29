import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWorkspaceContext } from '@/lib/workspace'

// GET /api/columns - List all columns for the workspace
export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContext()

    const columns = await prisma.column.findMany({
      where: {
        workspaceId,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: columns })
  } catch (error) {
    console.error('Error fetching columns:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch columns' },
      { status: 500 }
    )
  }
}
