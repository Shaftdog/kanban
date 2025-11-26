import { ColumnKey } from '@prisma/client'
import { prisma } from '@/lib/prisma'

/**
 * Initialize default columns for a new user
 * This should be called when a user signs up or on first login
 */
export async function initializeUserColumns(userId: string) {
  // Check if user already has columns
  const existingColumns = await prisma.column.findFirst({
    where: { userId },
  })

  if (existingColumns) {
    return // User already has columns
  }

  // Create default Kanban columns
  console.log(`📋 Creating default columns for user ${userId}...`)

  const columns = await prisma.$transaction([
    prisma.column.create({
      data: {
        userId,
        name: 'Projects',
        key: ColumnKey.PROJECTS,
        sortOrder: 0,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Milestones',
        key: ColumnKey.MILESTONES,
        sortOrder: 1,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Backlog',
        key: ColumnKey.BACKLOG,
        sortOrder: 2,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Working',
        key: ColumnKey.WORKING,
        sortOrder: 3,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Ready for Test',
        key: ColumnKey.READY_TEST,
        sortOrder: 4,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Agent Testing',
        key: ColumnKey.AGENT_TESTING,
        sortOrder: 5,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Deployed/Testing',
        key: ColumnKey.DEPLOYED_TESTING,
        sortOrder: 6,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Completed',
        key: ColumnKey.COMPLETED,
        sortOrder: 7,
      },
    }),
  ])

  console.log(`✅ Created ${columns.length} default columns for user ${userId}`)
  return columns
}

/**
 * Initialize default tags for a new user
 */
export async function initializeUserTags(userId: string) {
  // Check if user already has tags
  const existingTags = await prisma.tag.findFirst({
    where: { userId },
  })

  if (existingTags) {
    return // User already has tags
  }

  // Create default tags
  console.log(`🏷️  Creating default tags for user ${userId}...`)

  const tags = await prisma.$transaction([
    prisma.tag.create({
      data: {
        userId,
        name: 'Frontend',
        color: '#3b82f6',
      },
    }),
    prisma.tag.create({
      data: {
        userId,
        name: 'Backend',
        color: '#8b5cf6',
      },
    }),
    prisma.tag.create({
      data: {
        userId,
        name: 'Bug',
        color: '#ef4444',
      },
    }),
    prisma.tag.create({
      data: {
        userId,
        name: 'Feature',
        color: '#10b981',
      },
    }),
    prisma.tag.create({
      data: {
        userId,
        name: 'Urgent',
        color: '#f59e0b',
      },
    }),
  ])

  console.log(`✅ Created ${tags.length} default tags for user ${userId}`)
  return tags
}

/**
 * Create a sample welcome project for new users
 */
export async function createWelcomeProject(userId: string) {
  // Check if user already has projects
  const existingProjects = await prisma.project.findFirst({
    where: { userId },
  })

  if (existingProjects) {
    return // User already has projects
  }

  console.log(`📁 Creating welcome project for user ${userId}...`)

  // Get the milestones and backlog columns
  const milestonesColumn = await prisma.column.findFirst({
    where: { userId, key: 'MILESTONES' },
  })
  const backlogColumn = await prisma.column.findFirst({
    where: { userId, key: 'BACKLOG' },
  })

  if (!milestonesColumn || !backlogColumn) {
    console.error('Required columns not found')
    return
  }

  // Create welcome project
  const project = await prisma.project.create({
    data: {
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

  console.log(`✅ Created welcome project for user ${userId}`)
}

/**
 * Initialize all default data for a new user
 */
export async function initializeUserData(userId: string) {
  try {
    await initializeUserColumns(userId)
    await initializeUserTags(userId)
    await createWelcomeProject(userId)
    console.log(`✅ User initialization complete for ${userId}`)
  } catch (error) {
    console.error(`❌ Error initializing user data for ${userId}:`, error)
    throw error
  }
}
