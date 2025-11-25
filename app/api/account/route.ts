import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Delete all user data in order (respecting foreign keys)
    // The cascade delete on User should handle most of this,
    // but we'll be explicit for safety

    // Delete task tags first (through tasks)
    await prisma.taskTag.deleteMany({
      where: {
        task: {
          milestone: {
            project: {
              userId
            }
          }
        }
      }
    })

    // Delete tasks
    await prisma.task.deleteMany({
      where: {
        milestone: {
          project: {
            userId
          }
        }
      }
    })

    // Delete milestones
    await prisma.milestone.deleteMany({
      where: {
        project: {
          userId
        }
      }
    })

    // Delete projects
    await prisma.project.deleteMany({
      where: { userId }
    })

    // Delete tags
    await prisma.tag.deleteMany({
      where: { userId }
    })

    // Delete columns
    await prisma.column.deleteMany({
      where: { userId }
    })

    // Delete AI recommendations
    await prisma.aIRecommendation.deleteMany({
      where: { userId }
    })

    // Delete user record
    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }
}
