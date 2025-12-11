import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

interface ParsedData {
    milestones: Array<{
        name: string
        tasks: string[]
    }>
}

function parseRTF(rtfContent: string): ParsedData {
    const lines = rtfContent.split('\n')
    const milestones: Array<{ name: string; tasks: string[] }> = []
    let currentMilestone: { name: string; tasks: string[] } | null = null

    for (const line of lines) {
        // Skip RTF formatting lines
        if (line.startsWith('{') || line.startsWith('\\') || line.trim() === '}') {
            continue
        }

        const trimmed = line.trim()

        // Skip empty lines
        if (!trimmed) continue

        // Check if this is a milestone (ALL CAPS)
        // Looking for lines that are all uppercase letters/spaces
        const textOnly = trimmed.replace(/[^a-zA-Z\s]/g, '').trim()

        if (textOnly && textOnly === textOnly.toUpperCase() && textOnly.length > 2) {
            // This is a milestone
            if (currentMilestone) {
                milestones.push(currentMilestone)
            }
            currentMilestone = {
                name: textOnly,
                tasks: []
            }
        } else if (currentMilestone && textOnly.length > 0) {
            // This is a task under the current milestone
            // Clean up the text
            const cleanTask = textOnly.replace(/^[-•□◦]\s*/, '').trim()
            if (cleanTask) {
                currentMilestone.tasks.push(cleanTask)
            }
        }
    }

    // Don't forget the last milestone
    if (currentMilestone) {
        milestones.push(currentMilestone)
    }

    return { milestones }
}

export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const { projectName, rtfContent } = body

        if (!projectName || !rtfContent) {
            return NextResponse.json(
                { error: 'Missing projectName or rtfContent' },
                { status: 400 }
            )
        }

        console.log(`📁 Importing project: ${projectName}`)

        // Parse the content
        const { milestones } = parseRTF(rtfContent)

        console.log(`✅ Found ${milestones.length} milestones`)

        // Get the "Backlog" column for default status
        const backlogColumn = await prisma.column.findFirst({
            where: {
                userId: user.id,
                key: 'BACKLOG',
            },
        })

        if (!backlogColumn) {
            return NextResponse.json(
                { error: 'Backlog column not found. Please initialize workspace first.' },
                { status: 400 }
            )
        }

        // Create or find the project
        let project = await prisma.project.findFirst({
            where: {
                userId: user.id,
                name: projectName,
            },
        })

        if (!project) {
            project = await prisma.project.create({
                data: {
                    userId: user.id,
                    name: projectName,
                    description: `Imported from ${projectName}.rtf`,
                },
            })
        }

        // Import milestones and tasks
        let milestoneCount = 0
        let taskCount = 0

        for (const milestoneData of milestones) {
            // Create the milestone
            const milestone = await prisma.milestone.create({
                data: {
                    projectId: project.id,
                    name: milestoneData.name,
                    description: `${milestoneData.tasks.length} tasks`,
                    statusColumnId: backlogColumn.id,
                    value: 'MEDIUM',
                    urgency: 'MEDIUM',
                    effort: 'MEDIUM',
                },
            })

            milestoneCount++

            // Create tasks for this milestone
            for (const taskName of milestoneData.tasks) {
                await prisma.task.create({
                    data: {
                        milestoneId: milestone.id,
                        name: taskName,
                        statusColumnId: backlogColumn.id,
                    },
                })
                taskCount++
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                project: {
                    id: project.id,
                    name: project.name,
                },
                milestoneCount,
                taskCount,
            },
        })
    } catch (error) {
        console.error('Error importing RTF:', error)
        return NextResponse.json(
            {
                error: 'Failed to import project',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}
