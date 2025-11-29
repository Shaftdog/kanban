import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWorkspaceContext } from '@/lib/workspace'

/**
 * DELETE /api/workspace/members/[memberId]
 * Remove a member from the workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params
    const { workspaceId, userId, role } = await getWorkspaceContext()

    // Find the member to remove
    const memberToRemove = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    })

    if (!memberToRemove) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Verify member belongs to the same workspace
    if (memberToRemove.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Member does not belong to this workspace' },
        { status: 403 }
      )
    }

    // Prevent removing the workspace owner (optional)
    if (memberToRemove.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 403 }
      )
    }

    // Allow users to remove themselves, or require OWNER role to remove others
    const canRemove = memberToRemove.userId === userId || role === 'OWNER'

    if (!canRemove) {
      return NextResponse.json(
        { error: 'You do not have permission to remove this member' },
        { status: 403 }
      )
    }

    // Remove the member
    await prisma.workspaceMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({
      message: 'Member removed successfully',
    })
  } catch (error) {
    console.error('Error removing member:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
