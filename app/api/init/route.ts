import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initializeUserData } from '@/lib/utils/init-user-data'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/init
 * Initialize default data for the current user
 * This endpoint should be called on first login or when the user needs setup
 */
export async function POST(_request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists in database, create if not
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
          avatarUrl: user.user_metadata?.avatar_url || null,
        },
      })
    }

    // Check if user is already a member of a workspace
    let membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: { workspace: true },
    })

    let workspaceId: string

    if (!membership) {
      // Create a new workspace for the user
      const workspaceName = `${dbUser.name || dbUser.email}'s Workspace`
      const workspace = await prisma.workspace.create({
        data: {
          name: workspaceName,
        },
      })

      // Add user as workspace owner
      await prisma.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          role: 'OWNER',
        },
      })

      workspaceId = workspace.id
      console.log(`Created workspace ${workspaceId} for user ${user.id}`)
    } else {
      workspaceId = membership.workspaceId
    }

    // Initialize default columns, tags, and welcome project
    await initializeUserData(user.id, workspaceId)

    return NextResponse.json({
      message: 'User data initialized successfully',
      data: {
        userId: user.id,
        workspaceId,
      },
    })
  } catch (error) {
    console.error('Error initializing user data:', error)
    return NextResponse.json(
      { error: 'Failed to initialize user data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/init
 * Check if user data is initialized
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a member of a workspace
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: user.id },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                columns: true,
              },
            },
          },
        },
      },
    })

    const isInitialized = !!membership && membership.workspace._count.columns > 0

    return NextResponse.json({
      data: {
        isInitialized,
        hasWorkspace: !!membership,
        workspaceId: membership?.workspaceId,
        columnsCount: membership?.workspace._count.columns ?? 0,
      },
    })
  } catch (error) {
    console.error('Error checking user initialization:', error)
    return NextResponse.json(
      { error: 'Failed to check user initialization' },
      { status: 500 }
    )
  }
}
