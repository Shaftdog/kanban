#!/usr/bin/env node

/**
 * Automated Progress Checker
 *
 * This script analyzes the project state and automatically updates PROGRESS.md
 * with checkmarks based on completed work.
 *
 * Usage:
 *   node scripts/check-progress.js
 *   npm run check-progress
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const PROGRESS_FILE = path.join(ROOT_DIR, 'PROGRESS.md');

// Helper to check if file/directory exists
function exists(filepath) {
  return fs.existsSync(path.join(ROOT_DIR, filepath));
}

// Helper to check if string exists in file
function fileContains(filepath, searchString) {
  try {
    const fullPath = path.join(ROOT_DIR, filepath);
    if (!fs.existsSync(fullPath)) return false;
    const content = fs.readFileSync(fullPath, 'utf8');
    return content.includes(searchString);
  } catch {
    return false;
  }
}

// Helper to count checked items in markdown
function countCheckedItems(markdown) {
  const checkedPattern = /- \[x\]/gi;
  return (markdown.match(checkedPattern) || []).length;
}

// Helper to count total checkboxes in markdown
function countTotalItems(markdown) {
  const checkboxPattern = /- \[ \]|- \[x\]/gi;
  return (markdown.match(checkboxPattern) || []).length;
}

// Get test coverage percentage
function getTestCoverage() {
  try {
    if (!exists('coverage/coverage-summary.json')) return 0;
    const coverage = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'coverage/coverage-summary.json'), 'utf8')
    );
    return Math.round(coverage.total.lines.pct || 0);
  } catch {
    return 0;
  }
}

// Check if tests are passing
function areTestsPassing() {
  try {
    execSync('npm test -- --run', { stdio: 'pipe', cwd: ROOT_DIR });
    return true;
  } catch {
    return false;
  }
}

// Define phase completion criteria
const PHASE_CRITERIA = {
  'phase-0': [
    { name: 'Create GitHub repository', check: () => exists('.git') },
    { name: 'Set up Vercel project', check: () => exists('vercel.json') || exists('.vercel') },
    { name: 'Install and configure ESLint', check: () => exists('.eslintrc.json') || exists('eslint.config.js') },
    { name: 'Install and configure Prettier', check: () => exists('.prettierrc') || exists('.prettierrc.json') },
    { name: 'Set up Husky for git hooks', check: () => exists('.husky') },
    { name: 'Create `.env.local.example` template', check: () => exists('.env.local.example') },
    { name: 'Write initial README.md', check: () => exists('README.md') && fs.statSync(path.join(ROOT_DIR, 'README.md')).size > 500 },
  ],
  'phase-1': [
    { name: 'Initialize Next.js 15 project', check: () => exists('next.config.js') && fileContains('package.json', '"next"') },
    { name: 'Install core dependencies', check: () => fileContains('package.json', '@supabase/supabase-js') && fileContains('package.json', '@prisma/client') },
    { name: 'Configure Tailwind', check: () => exists('tailwind.config.ts') || exists('tailwind.config.js') },
    { name: 'Initialize Prisma', check: () => exists('prisma/schema.prisma') },
    { name: 'Write complete schema.prisma', check: () => fileContains('prisma/schema.prisma', 'model Project') && fileContains('prisma/schema.prisma', 'model Task') },
    { name: 'Run initial migration', check: () => exists('prisma/migrations') },
    { name: 'Create Supabase client utilities', check: () => exists('lib/supabase/client.ts') || exists('lib/supabase/client.js') },
    { name: 'Implement middleware for route protection', check: () => exists('middleware.ts') || exists('middleware.js') },
    { name: 'Create login page', check: () => exists('app/(auth)/login/page.tsx') || exists('app/login/page.tsx') },
    { name: 'Create register page', check: () => exists('app/(auth)/register/page.tsx') || exists('app/register/page.tsx') },
    { name: 'Create root layout with providers', check: () => exists('app/layout.tsx') },
    { name: 'Build dashboard layout', check: () => exists('app/(dashboard)/layout.tsx') || exists('components/layout/sidebar.tsx') },
    { name: 'Create placeholder page: /board', check: () => exists('app/(dashboard)/board/page.tsx') || exists('app/board/page.tsx') },
    { name: 'Create placeholder page: /projects', check: () => exists('app/(dashboard)/projects/page.tsx') || exists('app/projects/page.tsx') },
  ],
  'phase-1.5': [
    { name: 'Configure Vitest', check: () => exists('vitest.config.ts') || fileContains('package.json', 'vitest') },
    { name: 'Configure Playwright', check: () => exists('playwright.config.ts') },
    { name: 'Write unit tests for validation schemas', check: () => exists('lib/validations') && (exists('__tests__') || exists('tests/unit')) },
    { name: 'Add test step to GitHub Actions', check: () => exists('.github/workflows/ci.yml') && fileContains('.github/workflows/ci.yml', 'npm test') },
    { name: 'Configure test coverage reporting', check: () => fileContains('vitest.config.ts', 'coverage') || fileContains('package.json', 'coverage') },
  ],
  'phase-2': [
    { name: 'Write Zod schema for Project', check: () => exists('lib/validations/project.ts') },
    { name: 'Write Zod schema for Task', check: () => exists('lib/validations/task.ts') },
    { name: 'Implement POST /api/projects', check: () => exists('app/api/projects/route.ts') },
    { name: 'Implement GET /api/projects/[id]', check: () => exists('app/api/projects/[id]/route.ts') },
    { name: 'Implement Task API', check: () => exists('app/api/tasks/route.ts') },
    { name: 'Build Projects list page', check: () => exists('app/(dashboard)/projects/page.tsx') || exists('app/projects/page.tsx') },
  ],
  'phase-3': [
    { name: 'Create KanbanBoard component', check: () => exists('components/board/kanban-board.tsx') },
    { name: 'Create KanbanColumn component', check: () => exists('components/board/kanban-column.tsx') },
    { name: 'Create KanbanCard component', check: () => exists('components/board/kanban-card.tsx') },
    { name: 'Set up DndContext', check: () => fileContains('components/board/kanban-board.tsx', 'DndContext') || fileContains('components/board/kanban-board.tsx', '@dnd-kit') },
    { name: 'Build BoardFilters component', check: () => exists('components/board/board-filters.tsx') },
  ],
  'phase-4': [
    { name: 'Install OpenAI SDK', check: () => fileContains('package.json', '"openai"') },
    { name: 'Create OpenAI client wrapper', check: () => exists('lib/ai/openai.ts') },
    { name: 'Write system prompt', check: () => exists('lib/ai/prompts.ts') },
    { name: 'Implement POST /api/ai/prioritize', check: () => exists('app/api/ai/prioritize/route.ts') },
    { name: 'Create AIPanel component', check: () => exists('components/ai/ai-panel.tsx') },
    { name: 'Create AIRecommendations component', check: () => exists('components/ai/ai-recommendations.tsx') },
  ],
  'phase-5': [
    { name: 'Create TaskDetailModal component', check: () => exists('components/tasks/task-detail-modal.tsx') },
    { name: 'Create DependencySelector component', check: () => exists('components/tasks/task-dependencies.tsx') || fileContains('components/tasks/task-detail-modal.tsx', 'dependencies') },
    { name: 'Create TagSelector component', check: () => exists('components/tasks/task-form.tsx') || fileContains('components/tasks/task-detail-modal.tsx', 'tags') },
  ],
  'phase-6': [
    { name: 'Build analytics page', check: () => exists('app/(dashboard)/analytics/page.tsx') || fileContains('app/(dashboard)/projects/[projectId]/page.tsx', 'chart') },
    { name: 'Run Lighthouse audit', check: () => exists('lighthouse-report.html') || exists('docs/lighthouse-report.md') },
    { name: 'Create keyboard shortcuts help modal', check: () => exists('components/shared/keyboard-shortcuts.tsx') || exists('components/layout/help-modal.tsx') },
  ],
};

// Auto-check tasks based on criteria
function autoCheckTasks(progressContent) {
  let updated = progressContent;

  for (const [phase, criteria] of Object.entries(PHASE_CRITERIA)) {
    for (const { name, check } of criteria) {
      try {
        if (check()) {
          // Find the task and check it if unchecked
          const uncheckedPattern = new RegExp(`- \\[ \\] ${escapeRegex(name)}`, 'g');
          if (uncheckedPattern.test(updated)) {
            updated = updated.replace(uncheckedPattern, `- [x] ${name}`);
            console.log(`✅ Auto-checked: ${name}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error checking "${name}":`, error.message);
      }
    }
  }

  return updated;
}

// Escape special regex characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Calculate phase progress
function calculatePhaseProgress(markdown, phaseTitle) {
  // Extract phase section
  const phasePattern = new RegExp(`## ${escapeRegex(phaseTitle)}[\\s\\S]*?(?=\\n## |$)`, 'i');
  const match = markdown.match(phasePattern);

  if (!match) return { checked: 0, total: 0, percentage: 0 };

  const phaseContent = match[0];
  const checked = countCheckedItems(phaseContent);
  const total = countTotalItems(phaseContent);
  const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

  return { checked, total, percentage };
}

// Update phase progress in table
function updatePhaseTable(markdown) {
  const phases = [
    'Phase 0 — DevOps & Environment Setup',
    'Phase 1 — Project Foundation & Authentication',
    'Phase 1.5 — Testing Infrastructure',
    'Phase 2 — Core Data CRUD',
    'Phase 3 — Kanban Board & Drag-and-Drop',
    'Phase 4 — AI Integration',
    'Phase 5 — Detail Views & Task Management',
    'Phase 6 — Polish, Analytics & Production Prep',
  ];

  let updated = markdown;

  phases.forEach(phase => {
    const { checked, total, percentage } = calculatePhaseProgress(markdown, phase);

    // Determine status emoji
    let status = '🔴 Not Started';
    if (percentage === 100) status = '🟢 Complete';
    else if (percentage > 0) status = '🟡 In Progress';

    // Find and update the table row
    const rowPattern = new RegExp(
      `(\\| \\[${escapeRegex(phase.split(' —')[0])}\\].*?\\| )([^|]+)(\\| )(\\d+%\\s+\\(\\d+\\/\\d+\\))`,
      'i'
    );

    updated = updated.replace(rowPattern, `$1${status}$3${percentage}% (${checked}/${total})`);
  });

  return updated;
}

// Update overall progress
function updateOverallProgress(markdown) {
  const totalChecked = countCheckedItems(markdown);
  const totalItems = countTotalItems(markdown);
  const percentage = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  const progressPattern = /📊 \*\*Overall Progress:\*\* \d+% Complete \(\d+\/\d+ tasks\)/;
  const replacement = `📊 **Overall Progress:** ${percentage}% Complete (${totalChecked}/${totalItems} tasks)`;

  return markdown.replace(progressPattern, replacement);
}

// Update status badges
function updateStatusBadges(markdown) {
  let updated = markdown;

  // Test badge
  const testsPassing = areTestsPassing();
  const testBadge = testsPassing
    ? '![Tests](https://img.shields.io/badge/tests-passing-brightgreen)'
    : '![Tests](https://img.shields.io/badge/tests-failing-red)';
  updated = updated.replace(/!\[Tests\]\(.*?\)/, testBadge);

  // Coverage badge
  const coverage = getTestCoverage();
  let coverageColor = 'red';
  if (coverage >= 80) coverageColor = 'brightgreen';
  else if (coverage >= 60) coverageColor = 'yellow';
  else if (coverage >= 40) coverageColor = 'orange';

  const coverageBadge = `![Coverage](https://img.shields.io/badge/coverage-${coverage}%25-${coverageColor})`;
  updated = updated.replace(/!\[Coverage\]\(.*?\)/, coverageBadge);

  // Build badge
  const hasBuild = exists('vercel.json') || exists('.vercel');
  const buildBadge = hasBuild
    ? '![Build](https://img.shields.io/badge/build-configured-brightgreen)'
    : '![Build](https://img.shields.io/badge/build-not%20configured-lightgrey)';
  updated = updated.replace(/!\[Build\]\(.*?\)/, buildBadge);

  // Deployment badge
  const hasDeployment = exists('.vercel') || exists('.github/workflows/deploy.yml');
  const deployBadge = hasDeployment
    ? '![Deployment](https://img.shields.io/badge/deployment-configured-brightgreen)'
    : '![Deployment](https://img.shields.io/badge/deployment-not%20configured-lightgrey)';
  updated = updated.replace(/!\[Deployment\]\(.*?\)/, deployBadge);

  return updated;
}

// Main function
function main() {
  console.log('🔍 Checking project progress...\n');

  if (!fs.existsSync(PROGRESS_FILE)) {
    console.error('❌ PROGRESS.md not found!');
    process.exit(1);
  }

  let progress = fs.readFileSync(PROGRESS_FILE, 'utf8');

  // Auto-check tasks
  console.log('📝 Auto-checking completed tasks...');
  progress = autoCheckTasks(progress);

  // Update phase table
  console.log('📊 Updating phase progress table...');
  progress = updatePhaseTable(progress);

  // Update overall progress
  console.log('🎯 Updating overall progress...');
  progress = updateOverallProgress(progress);

  // Update status badges
  console.log('🏷️  Updating status badges...');
  progress = updateStatusBadges(progress);

  // Update timestamp
  const timestamp = new Date().toISOString().split('T')[0];
  progress = progress.replace(
    /\*\*Last Updated:\*\*.*/,
    `**Last Updated:** ${timestamp} (auto-updated)`
  );

  // Write back to file
  fs.writeFileSync(PROGRESS_FILE, progress, 'utf8');

  console.log('\n✅ Progress updated successfully!');
  console.log(`📄 Check ${PROGRESS_FILE} for details\n`);

  // Print summary
  const totalChecked = countCheckedItems(progress);
  const totalItems = countTotalItems(progress);
  const percentage = totalItems > 0 ? Math.round((totalChecked / totalItems) * 100) : 0;

  console.log(`📈 Summary: ${totalChecked}/${totalItems} tasks complete (${percentage}%)`);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { autoCheckTasks, calculatePhaseProgress, updatePhaseTable };
