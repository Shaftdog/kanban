import { PrismaClient, ColumnKey } from '@prisma/client'

const prisma = new PrismaClient()

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
        name: 'Backlog',
        key: ColumnKey.BACKLOG,
        sortOrder: 1,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Working',
        key: ColumnKey.WORKING,
        sortOrder: 2,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Ready for Test',
        key: ColumnKey.READY_TEST,
        sortOrder: 3,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Agent Testing',
        key: ColumnKey.AGENT_TESTING,
        sortOrder: 4,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Deployed/Testing',
        key: ColumnKey.DEPLOYED_TESTING,
        sortOrder: 5,
      },
    }),
    prisma.column.create({
      data: {
        userId,
        name: 'Completed',
        key: ColumnKey.COMPLETED,
        sortOrder: 6,
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
 * Initialize all default data for a new user
 */
export async function initializeUserData(userId: string) {
  try {
    await initializeUserColumns(userId)
    await initializeUserTags(userId)
    console.log(`✅ User initialization complete for ${userId}`)
  } catch (error) {
    console.error(`❌ Error initializing user data for ${userId}:`, error)
    throw error
  }
}
