import { ColumnKey } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Initialize default columns for a new workspace
 * This should be called when a workspace is created
 */
export async function initializeUserColumns(userId: string, workspaceId: string) {
  // Check if workspace already has columns
  const existingColumns = await prisma.column.findFirst({
    where: { workspaceId },
  })

  if (existingColumns) {
    return // Workspace already has columns
  }

  // Create default Kanban columns
  console.log(`📋 Creating default columns for workspace ${workspaceId}...`)

  const columns = await prisma.$transaction([
    prisma.column.create({
      data: {
        workspaceId,
        userId,
        name: 'Projects',
        key: ColumnKey.PROJECTS,
        sortOrder: 0,
      },
    }),
    prisma.column.create({
      data: {
        workspaceId,
        userId,
        name: 'Milestones',
        key: ColumnKey.MILESTONES,
        sortOrder: 1,
      },
    }),
    prisma.column.create({
      data: {
        workspaceId,
        userId,
        name: 'Backlog',
        key: ColumnKey.BACKLOG,
        sortOrder: 2,
      },
    }),
    prisma.column.create({
      data: {
        workspaceId,
        userId,
        name: 'Working',
        key: ColumnKey.WORKING,
        sortOrder: 3,
      },
    }),
    prisma.column.create({
      data: {
        workspaceId,
        userId,
        name: 'Ready for Test',
        key: ColumnKey.READY_TEST,
        sortOrder: 4,
      },
    }),
    prisma.column.create({
      data: {
        workspaceId,
        userId,
        name: 'Agent Testing',
        key: ColumnKey.AGENT_TESTING,
        sortOrder: 5,
      },
    }),
    prisma.column.create({
      data: {
        workspaceId,
        userId,
        name: 'Deployed/Testing',
        key: ColumnKey.DEPLOYED_TESTING,
        sortOrder: 6,
      },
    }),
    prisma.column.create({
      data: {
        workspaceId,
        userId,
        name: 'Completed',
        key: ColumnKey.COMPLETED,
        sortOrder: 7,
      },
    }),
  ])

  console.log(`✅ Created ${columns.length} default columns for workspace ${workspaceId}`)
  return columns
}

/**
 * Initialize default tags for a new workspace
 */
export async function initializeUserTags(userId: string, workspaceId: string) {
  // Check if workspace already has tags
  const existingTags = await prisma.tag.findFirst({
    where: { workspaceId },
  })

  if (existingTags) {
    return // Workspace already has tags
  }

  // Create default tags
  console.log(`🏷️  Creating default tags for workspace ${workspaceId}...`)

  const tags = await prisma.$transaction([
    prisma.tag.create({
      data: {
        workspaceId,
        userId,
        name: 'Frontend',
        color: '#3b82f6',
      },
    }),
    prisma.tag.create({
      data: {
        workspaceId,
        userId,
        name: 'Backend',
        color: '#8b5cf6',
      },
    }),
    prisma.tag.create({
      data: {
        workspaceId,
        userId,
        name: 'Bug',
        color: '#ef4444',
      },
    }),
    prisma.tag.create({
      data: {
        workspaceId,
        userId,
        name: 'Feature',
        color: '#10b981',
      },
    }),
    prisma.tag.create({
      data: {
        workspaceId,
        userId,
        name: 'Urgent',
        color: '#f59e0b',
      },
    }),
  ])

  console.log(`✅ Created ${tags.length} default tags for workspace ${workspaceId}`)
  return tags
}

/**
 * Create a sample welcome project for new workspaces
 */
export async function createWelcomeProject(userId: string, workspaceId: string) {
  // Check if workspace already has projects
  const existingProjects = await prisma.project.findFirst({
    where: { workspaceId },
  })

  if (existingProjects) {
    return // Workspace already has projects
  }

  console.log(`📁 Creating welcome project for workspace ${workspaceId}...`)

  // Get the milestones and backlog columns
  const milestonesColumn = await prisma.column.findFirst({
    where: { workspaceId, key: 'MILESTONES' },
  })
  const backlogColumn = await prisma.column.findFirst({
    where: { workspaceId, key: 'BACKLOG' },
  })

  if (!milestonesColumn || !backlogColumn) {
    console.error('Required columns not found')
    return
  }

  // Create welcome project
  const project = await prisma.project.create({
    data: {
      workspaceId,
      userId,
      name: 'Welcome to AI-Powered Kanban! 👋',
      description: 'Get started with your intelligent task management system',
      status: 'ACTIVE',
      priority: 1, // Highest priority for welcome project
      sortOrder: 0,
    },
  })

  // Create sample milestone
  const milestone = await prisma.milestone.create({
    data: {
      projectId: project.id,
      name: 'Learn the basics',
      description: 'Explore the features of your new Kanban board',
      value: 'HIGH',
      urgency: 'MEDIUM',
      effort: 'SMALL',
      priority: 1, // Highest priority milestone
      statusColumnId: milestonesColumn.id,
      sortOrder: 0,
    },
  })

  // Create sample tasks in the backlog
  await prisma.task.create({
    data: {
      milestoneId: milestone.id,
      name: 'Explore the Kanban board',
      description: 'Check out all the columns and drag cards around',
      value: 'MEDIUM',
      urgency: 'LOW',
      effort: 'SMALL',
      statusColumnId: backlogColumn.id,
      sortOrder: 0,
    },
  })

  console.log(`✅ Created welcome project for workspace ${workspaceId}`)
}

/**
 * Initialize all default data for a new workspace
 */
export async function initializeUserData(userId: string, workspaceId: string) {
  try {
    await initializeUserColumns(userId, workspaceId)
    await initializeUserTags(userId, workspaceId)
    await createWelcomeProject(userId, workspaceId)
    console.log(`✅ Workspace initialization complete for ${workspaceId}`)
  } catch (error) {
    console.error(`❌ Error initializing workspace data for ${workspaceId}:`, error)
    throw error
  }
}
