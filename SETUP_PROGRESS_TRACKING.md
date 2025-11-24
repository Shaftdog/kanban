# Progress Tracking Setup Guide

This document explains how to set up automated progress tracking for the Kanban project.

## Overview

The progress tracking system automatically monitors your development progress and updates `PROGRESS.md` based on:
- Files created
- Tests passing
- Test coverage
- Git commits
- Database migrations

## Files Created

1. **PROGRESS.md** - Master checklist with all phases and tasks
2. **scripts/check-progress.js** - Automated progress checker
3. **scripts/phase-report.js** - Detailed progress report generator
4. **.github/workflows/update-progress.yml** - GitHub Action for auto-updates

## Setup Instructions

### 1. Install Dependencies (if not already done)

```bash
# No additional dependencies needed - uses Node.js built-ins
# Husky will be installed during Phase 1
```

### 2. Make Scripts Executable (Linux/Mac)

```bash
chmod +x scripts/check-progress.js
chmod +x scripts/phase-report.js
```

### 3. Add NPM Scripts to package.json

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "check-progress": "node scripts/check-progress.js",
    "progress": "node scripts/phase-report.js",
    "phase-report": "node scripts/phase-report.js"
  }
}
```

### 4. Set Up Husky Git Hooks (Phase 1)

When you reach Phase 1 and install Husky:

```bash
# Install Husky
npm install -D husky
npx husky init

# Add post-commit hook
echo "npm run check-progress" > .husky/post-commit
chmod +x .husky/post-commit  # Linux/Mac only
```

### 5. Enable GitHub Actions

The workflow `.github/workflows/update-progress.yml` will run automatically on:
- Every push to `main` or `develop` branches
- Manual trigger via GitHub UI

**No additional setup required** - just push to GitHub!

## Usage

### Manual Progress Check

Run anytime to update progress:

```bash
npm run check-progress
```

This will:
- ✅ Auto-check completed tasks based on file existence
- 📊 Update phase progress percentages
- 🏷️ Update status badges
- 💾 Save changes to PROGRESS.md

### View Progress Report

Get a beautiful CLI report:

```bash
npm run progress
```

This displays:
- 📊 Overall progress bar
- 📋 Phase summary with status indicators
- 🎯 Current phase details
- ⚡ Next 3 actions to take
- ⚠️ Any blockers
- 📝 Task breakdown (completed vs pending)

### Automatic Updates

Progress is automatically updated:
- **After every commit** (via Husky hook)
- **After every push** (via GitHub Actions)
- **When tests run** (coverage updates)

## How Auto-Checking Works

The system uses smart detection to automatically check tasks:

### Phase 0 - DevOps Setup
- ✅ "Create GitHub repository" → checks for `.git` folder
- ✅ "Set up Vercel project" → checks for `vercel.json` or `.vercel` folder
- ✅ "Install ESLint" → checks for `.eslintrc.json`
- ✅ "Set up Husky" → checks for `.husky` folder
- And more...

### Phase 1 - Foundation
- ✅ "Initialize Next.js" → checks for `next.config.js`
- ✅ "Install Supabase" → checks `package.json` for `@supabase/supabase-js`
- ✅ "Write schema.prisma" → checks for `model Project` in file
- ✅ "Create login page" → checks for `app/(auth)/login/page.tsx`
- And more...

### All Phases
Similar smart detection for all 163 tasks across 8 phases!

## Customization

### Add Custom Checks

Edit `scripts/check-progress.js` and add to `PHASE_CRITERIA`:

```javascript
'phase-X': [
  {
    name: 'Your task name',
    check: () => exists('path/to/file') || fileContains('file.ts', 'some text')
  },
  // ... more checks
]
```

### Modify Report Format

Edit `scripts/phase-report.js` to customize:
- Colors (via `colors` object)
- Report sections
- Output format

### Adjust GitHub Action

Edit `.github/workflows/update-progress.yml` to:
- Change trigger branches
- Modify run frequency
- Add notifications (Slack, Discord, etc.)

## Tips & Best Practices

### ✅ DO:
- Run `npm run progress` regularly to see your progress
- Commit often to trigger automatic updates
- Review PROGRESS.md to plan your next steps
- Use the checklist as your source of truth

### ❌ DON'T:
- Manually edit progress percentages (they're auto-calculated)
- Manually check/uncheck tasks that have auto-detection (they'll be overwritten)
- Delete PROGRESS.md (it's your project roadmap!)

### 💡 Pro Tips:
1. **Alias the commands** for quick access:
   ```bash
   alias progress="npm run progress"
   alias check="npm run check-progress"
   ```

2. **Use in your morning routine**: Start each dev session with `npm run progress` to see what to work on

3. **Share with stakeholders**: PROGRESS.md is a great status update document

4. **Track velocity**: Compare progress over time by looking at git history of PROGRESS.md

## Troubleshooting

### Progress not updating automatically?

1. Check Husky is installed:
   ```bash
   ls -la .husky
   ```

2. Check post-commit hook exists:
   ```bash
   cat .husky/post-commit
   ```

3. Make sure it's executable:
   ```bash
   chmod +x .husky/post-commit
   ```

### GitHub Action not running?

1. Check workflow file exists:
   ```bash
   ls -la .github/workflows/update-progress.yml
   ```

2. Check GitHub Actions are enabled in repo settings

3. Check you have push permissions

### Tasks not being auto-checked?

1. Verify the file/content exists as expected
2. Check the criteria in `scripts/check-progress.js`
3. Run with debug: `node scripts/check-progress.js` and check output
4. Manually check the task if needed (auto-check will respect it)

## Example Workflow

Here's a typical development workflow with progress tracking:

```bash
# Morning: Check what to work on
npm run progress

# Work on tasks...
# Create files, write code, run tests

# Afternoon: Commit your work
git add .
git commit -m "feat: implement user authentication"
# → Husky automatically runs check-progress.js
# → PROGRESS.md is updated

# Push to GitHub
git push
# → GitHub Action runs
# → PROGRESS.md is auto-committed if changes detected

# End of day: Review progress
npm run progress
# See what you accomplished! 🎉
```

## Advanced: CI/CD Integration

You can integrate progress checks into your CI pipeline:

```yaml
# In your ci.yml
jobs:
  test:
    steps:
      # ... your test steps ...

      - name: Update progress
        run: npm run check-progress

      - name: Check if phase complete
        run: |
          PROGRESS=$(grep "Current Phase" PROGRESS.md)
          echo "Current status: $PROGRESS"
```

## Questions?

If you run into issues:
1. Check this guide first
2. Review the script source code (it's well-commented)
3. Open an issue on GitHub

---

**Happy tracking! 📊🚀**
