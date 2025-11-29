/**
 * Data Migration Script: Migrate existing single-user data to workspace model
 *
 * This script:
 * 1. Creates a default workspace for the first user
 * 2. Adds the user as workspace OWNER
 * 3. Migrates all existing data (projects, columns, tags, AI recommendations) to the workspace
 * 4. Updates schema constraints to make workspaceId required
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting workspace migration...\n')

  try {
    // Step 1: Find the first user
    const firstUser = await prisma.user.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    if (!firstUser) {
      console.log('No users found in database. Migration complete.')
      return
    }

    console.log(`Found user: ${firstUser.email} (${firstUser.id})`)

    // Step 2: Check if workspace already exists
    const existingWorkspace = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM workspaces LIMIT 1
    `

    let workspaceId: string

    if (existingWorkspace && existingWorkspace.length > 0) {
      workspaceId = existingWorkspace[0].id
      console.log(`Workspace already exists: ${workspaceId}`)
    } else {
      // Step 3: Create a default workspace
      const workspaceName = `${firstUser.name || firstUser.email}'s Workspace`
      await prisma.$executeRaw`
        INSERT INTO workspaces (id, name, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${workspaceName}, NOW(), NOW())
      `

      // Get the created workspace ID
      const createdWorkspace = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM workspaces ORDER BY "createdAt" DESC LIMIT 1
      `

      workspaceId = createdWorkspace[0].id
      console.log(`Created workspace: ${workspaceId}\n`)

      // Step 4: Add user as workspace owner
      await prisma.$executeRaw`
        INSERT INTO workspace_members (id, "workspaceId", "userId", role, "joinedAt")
        VALUES (gen_random_uuid(), ${workspaceId}, ${firstUser.id}, 'OWNER', NOW())
      `
      console.log(`Added ${firstUser.email} as workspace OWNER\n`)
    }

    // Step 5: Count existing data
    const counts = {
      projects: await prisma.project.count({ where: { workspaceId: null } }),
      columns: await prisma.column.count({ where: { workspaceId: null } }),
      tags: await prisma.tag.count({ where: { workspaceId: null } }),
      aiRecommendations: await prisma.aIRecommendation.count({ where: { workspaceId: null } }),
    }

    console.log('Data to migrate:')
    console.log(`  - Projects: ${counts.projects}`)
    console.log(`  - Columns: ${counts.columns}`)
    console.log(`  - Tags: ${counts.tags}`)
    console.log(`  - AI Recommendations: ${counts.aiRecommendations}\n`)

    if (Object.values(counts).every(c => c === 0)) {
      console.log('All data already migrated.')
    } else {
      // Step 6: Migrate projects
      if (counts.projects > 0) {
        await prisma.$executeRaw`
          UPDATE projects
          SET "workspaceId" = ${workspaceId}
          WHERE "workspaceId" IS NULL
        `
        console.log(`✓ Migrated ${counts.projects} projects`)
      }

      // Step 7: Migrate columns
      if (counts.columns > 0) {
        await prisma.$executeRaw`
          UPDATE columns
          SET "workspaceId" = ${workspaceId}
          WHERE "workspaceId" IS NULL
        `
        console.log(`✓ Migrated ${counts.columns} columns`)
      }

      // Step 8: Migrate tags
      if (counts.tags > 0) {
        await prisma.$executeRaw`
          UPDATE tags
          SET "workspaceId" = ${workspaceId}
          WHERE "workspaceId" IS NULL
        `
        console.log(`✓ Migrated ${counts.tags} tags`)
      }

      // Step 9: Migrate AI recommendations
      if (counts.aiRecommendations > 0) {
        await prisma.$executeRaw`
          UPDATE ai_recommendations
          SET "workspaceId" = ${workspaceId}
          WHERE "workspaceId" IS NULL
        `
        console.log(`✓ Migrated ${counts.aiRecommendations} AI recommendations`)
      }
    }

    console.log('\n=== Phase 2: Update Schema Constraints ===\n')

    // Step 10: Make workspaceId NOT NULL and add foreign keys
    console.log('Making workspaceId NOT NULL...')

    await prisma.$executeRaw`
      ALTER TABLE projects
      ALTER COLUMN "workspaceId" SET NOT NULL,
      ADD CONSTRAINT "projects_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES workspaces(id) ON DELETE CASCADE ON UPDATE CASCADE
    `
    console.log('✓ Updated projects table')

    await prisma.$executeRaw`
      ALTER TABLE columns
      ALTER COLUMN "workspaceId" SET NOT NULL,
      ADD CONSTRAINT "columns_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES workspaces(id) ON DELETE CASCADE ON UPDATE CASCADE
    `
    console.log('✓ Updated columns table')

    await prisma.$executeRaw`
      ALTER TABLE tags
      ALTER COLUMN "workspaceId" SET NOT NULL,
      ADD CONSTRAINT "tags_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES workspaces(id) ON DELETE CASCADE ON UPDATE CASCADE
    `
    console.log('✓ Updated tags table')

    await prisma.$executeRaw`
      ALTER TABLE ai_recommendations
      ALTER COLUMN "workspaceId" SET NOT NULL,
      ADD CONSTRAINT "ai_recommendations_workspaceId_fkey"
        FOREIGN KEY ("workspaceId") REFERENCES workspaces(id) ON DELETE CASCADE ON UPDATE CASCADE
    `
    console.log('✓ Updated ai_recommendations table')

    console.log('\n=== Phase 3: Update Indexes ===\n')

    // Step 11: Drop old indexes and create new workspace-scoped ones
    await prisma.$executeRaw`
      -- Projects indexes
      DROP INDEX IF EXISTS "projects_userId_status_idx";
      DROP INDEX IF EXISTS "projects_userId_sortOrder_idx";
      DROP INDEX IF EXISTS "projects_userId_priority_idx";

      CREATE INDEX IF NOT EXISTS "projects_workspaceId_status_idx" ON projects("workspaceId", status);
      CREATE INDEX IF NOT EXISTS "projects_workspaceId_sortOrder_idx" ON projects("workspaceId", "sortOrder");
      CREATE INDEX IF NOT EXISTS "projects_workspaceId_priority_idx" ON projects("workspaceId", priority);

      -- Columns indexes
      DROP INDEX IF EXISTS "columns_userId_key_key";
      DROP INDEX IF EXISTS "columns_userId_sortOrder_idx";

      CREATE UNIQUE INDEX IF NOT EXISTS "columns_workspaceId_key_key" ON columns("workspaceId", key);
      CREATE INDEX IF NOT EXISTS "columns_workspaceId_sortOrder_idx" ON columns("workspaceId", "sortOrder");

      -- Tags indexes
      DROP INDEX IF EXISTS "tags_userId_name_key";
      DROP INDEX IF EXISTS "tags_userId_idx";

      CREATE UNIQUE INDEX IF NOT EXISTS "tags_workspaceId_name_key" ON tags("workspaceId", name);
      CREATE INDEX IF NOT EXISTS "tags_workspaceId_idx" ON tags("workspaceId");

      -- AI Recommendations indexes
      DROP INDEX IF EXISTS "ai_recommendations_userId_createdAt_idx";

      CREATE INDEX IF NOT EXISTS "ai_recommendations_workspaceId_createdAt_idx" ON ai_recommendations("workspaceId", "createdAt");
    `
    console.log('✓ Updated all indexes')

    console.log('\n✅ Migration completed successfully!')
    console.log(`\nWorkspace ID: ${workspaceId}`)
    console.log(`Owner: ${firstUser.email}\n`)

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
