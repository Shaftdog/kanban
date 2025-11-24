import { PrismaClient, ColumnKey, Priority, Effort, ProjectStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a test user
  const testUserId = 'test-user-uuid' // In production, this would come from Supabase Auth

  // Clean up existing data for the test user
  console.log('🧹 Cleaning up existing test data...')
  await prisma.user.deleteMany({ where: { id: testUserId } })

  // Create test user
  console.log('👤 Creating test user...')
  const user = await prisma.user.create({
    data: {
      id: testUserId,
      email: 'test@example.com',
      name: 'Test User',
    },
  })

  // Create default Kanban columns
  console.log('📋 Creating default columns...')
  const columns = await prisma.$transaction([
    prisma.column.create({
      data: {
        userId: user.id,
        name: 'Projects',
        key: ColumnKey.PROJECTS,
        sortOrder: 0,
      },
    }),
    prisma.column.create({
      data: {
        userId: user.id,
        name: 'Backlog',
        key: ColumnKey.BACKLOG,
        sortOrder: 1,
      },
    }),
    prisma.column.create({
      data: {
        userId: user.id,
        name: 'Working',
        key: ColumnKey.WORKING,
        sortOrder: 2,
      },
    }),
    prisma.column.create({
      data: {
        userId: user.id,
        name: 'Ready for Test',
        key: ColumnKey.READY_TEST,
        sortOrder: 3,
      },
    }),
    prisma.column.create({
      data: {
        userId: user.id,
        name: 'Agent Testing',
        key: ColumnKey.AGENT_TESTING,
        sortOrder: 4,
      },
    }),
    prisma.column.create({
      data: {
        userId: user.id,
        name: 'Deployed/Testing',
        key: ColumnKey.DEPLOYED_TESTING,
        sortOrder: 5,
      },
    }),
    prisma.column.create({
      data: {
        userId: user.id,
        name: 'Completed',
        key: ColumnKey.COMPLETED,
        sortOrder: 6,
      },
    }),
  ])

  console.log(`✅ Created ${columns.length} columns`)

  // Create sample tags
  console.log('🏷️  Creating sample tags...')
  const tags = await prisma.$transaction([
    prisma.tag.create({
      data: {
        userId: user.id,
        name: 'Frontend',
        color: '#3b82f6',
      },
    }),
    prisma.tag.create({
      data: {
        userId: user.id,
        name: 'Backend',
        color: '#8b5cf6',
      },
    }),
    prisma.tag.create({
      data: {
        userId: user.id,
        name: 'Bug',
        color: '#ef4444',
      },
    }),
    prisma.tag.create({
      data: {
        userId: user.id,
        name: 'Feature',
        color: '#10b981',
      },
    }),
    prisma.tag.create({
      data: {
        userId: user.id,
        name: 'Urgent',
        color: '#f59e0b',
      },
    }),
  ])

  console.log(`✅ Created ${tags.length} tags`)

  // Create sample project
  console.log('📁 Creating sample project...')
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name: 'AI-Powered Kanban',
      description: 'Building an intelligent task management system',
      status: ProjectStatus.ACTIVE,
      sortOrder: 0,
    },
  })

  // Create sample milestone
  console.log('🎯 Creating sample milestone...')
  const milestone = await prisma.milestone.create({
    data: {
      projectId: project.id,
      name: 'Phase 1: Foundation',
      description: 'Set up project foundation and authentication',
      value: Priority.HIGH,
      urgency: Priority.HIGH,
      effort: Effort.LARGE,
      statusColumnId: columns[1].id, // Backlog
      sortOrder: 0,
    },
  })

  // Create sample tasks
  console.log('✅ Creating sample tasks...')
  const tasks = await prisma.$transaction([
    prisma.task.create({
      data: {
        milestoneId: milestone.id,
        name: 'Set up authentication',
        description: 'Implement Supabase authentication with login and register',
        value: Priority.HIGH,
        urgency: Priority.HIGH,
        effort: Effort.MEDIUM,
        statusColumnId: columns[2].id, // Working
        sortOrder: 0,
      },
    }),
    prisma.task.create({
      data: {
        milestoneId: milestone.id,
        name: 'Create database schema',
        description: 'Design and implement Prisma schema for all entities',
        value: Priority.HIGH,
        urgency: Priority.MEDIUM,
        effort: Effort.MEDIUM,
        statusColumnId: columns[6].id, // Completed
        completedAt: new Date(),
        sortOrder: 1,
      },
    }),
    prisma.task.create({
      data: {
        milestoneId: milestone.id,
        name: 'Build Kanban board UI',
        description: 'Create drag-and-drop Kanban board with columns',
        value: Priority.MEDIUM,
        urgency: Priority.MEDIUM,
        effort: Effort.LARGE,
        statusColumnId: columns[1].id, // Backlog
        sortOrder: 2,
      },
    }),
  ])

  // Add tags to tasks
  await prisma.taskTag.createMany({
    data: [
      { taskId: tasks[0].id, tagId: tags[0].id }, // Frontend
      { taskId: tasks[0].id, tagId: tags[3].id }, // Feature
      { taskId: tasks[1].id, tagId: tags[1].id }, // Backend
      { taskId: tasks[2].id, tagId: tags[0].id }, // Frontend
      { taskId: tasks[2].id, tagId: tags[3].id }, // Feature
    ],
  })

  console.log(`✅ Created ${tasks.length} tasks`)

  console.log('🎉 Seed completed successfully!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   • User: ${user.email}`)
  console.log(`   • Columns: ${columns.length}`)
  console.log(`   • Tags: ${tags.length}`)
  console.log(`   • Projects: 1`)
  console.log(`   • Milestones: 1`)
  console.log(`   • Tasks: ${tasks.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
