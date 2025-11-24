import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaClient } from '@prisma/client'
import { updateColumnSchema } from '@/lib/validations'

const prisma = new PrismaClient()

// PATCH /api/columns/[id] - Update a column (rename only, key is immutable)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify column belongs to user
    const existingColumn = await prisma.column.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingColumn) {
      return NextResponse.json({ error: 'Column not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = updateColumnSchema.parse(body)

    const column = await prisma.column.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({ data: column })
  } catch (error) {
    console.error('Error updating column:', error)

    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update column' },
      { status: 500 }
    )
  }
}
