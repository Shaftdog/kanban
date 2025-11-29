import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getWorkspaceContext } from '@/lib/workspace'
import { z } from 'zod'
import crypto from 'crypto'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
})

/**
 * POST /api/workspace/invite
 * Send an invitation to join the workspace
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId, role } = await getWorkspaceContext()

    // Only workspace owners can invite new members (optional: remove this check if all members can invite)
    // if (role !== 'OWNER') {
    //   return NextResponse.json(
    //     { error: 'Only workspace owners can invite members' },
    //     { status: 403 }
    //   )
    // }

    const body = await request.json()
    const { email } = inviteSchema.parse(body)

    // Check if user is already a member
    const existingMember = await prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        user: {
          email,
        },
      },
    })

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 400 }
      )
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      )
    }

    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex')

    // Create invitation (expires in 7 days)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId,
        email,
        invitedById: userId,
        token,
        expiresAt,
      },
      include: {
        workspace: true,
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // TODO: Send invitation email
    // For now, we'll return the invitation link
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

    console.log(`Invitation created for ${email}. Link: ${inviteUrl}`)

    // In production, you would send an email here using Resend or another email service
    // await sendInvitationEmail({
    //   to: email,
    //   invitedBy: invitation.invitedBy.name || invitation.invitedBy.email,
    //   workspaceName: invitation.workspace.name,
    //   inviteUrl,
    // })

    return NextResponse.json(
      {
        data: {
          invitation: {
            id: invitation.id,
            email: invitation.email,
            expiresAt: invitation.expiresAt,
          },
          inviteUrl, // In production, don't return this - just send the email
        },
        message: 'Invitation sent successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating invitation:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}
