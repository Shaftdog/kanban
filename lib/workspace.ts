/**
 * Workspace utilities for multi-user collaboration
 */

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export interface WorkspaceContext {
  workspaceId: string
  userId: string
  role: 'OWNER' | 'MEMBER'
}

/**
 * Get the user's workspace context from their session
 * Throws an error if user is not authenticated or not a workspace member
 */
export async function getWorkspaceContext(): Promise<WorkspaceContext> {
  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  // Get user's workspace membership
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      userId: session.user.id,
    },
    select: {
      workspaceId: true,
      role: true,
    },
  })

  if (!membership) {
    throw new Error('User is not a member of any workspace')
  }

  return {
    workspaceId: membership.workspaceId,
    userId: session.user.id,
    role: membership.role,
  }
}

/**
 * Verify that a user has access to a specific workspace
 */
export async function verifyWorkspaceAccess(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  })

  return !!membership
}

/**
 * Get all members of a workspace
 */
export async function getWorkspaceMembers(workspaceId: string) {
  return prisma.workspaceMember.findMany({
    where: {
      workspaceId,
    },
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
  })
}
