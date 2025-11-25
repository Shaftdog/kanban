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

    // Initialize default columns and tags
    await initializeUserData(user.id)

    return NextResponse.json({
      message: 'User data initialized successfully',
      data: {
        userId: user.id,
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

    // Check if user has columns
    const columnsCount = await prisma.column.count({
      where: { userId: user.id },
    })

    const isInitialized = columnsCount > 0

    return NextResponse.json({
      data: {
        isInitialized,
        columnsCount,
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
