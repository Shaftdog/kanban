import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/columns - List all columns for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const columns = await prisma.column.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: columns })
  } catch (error) {
    console.error('Error fetching columns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch columns' },
      { status: 500 }
    )
  }
}
