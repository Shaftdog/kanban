# DevOps Setup Guide - Phase 0

Complete guide to set up infrastructure for the AI-Powered Kanban application.

## ✅ Already Complete

- [x] Create GitHub repository
- [x] Install and configure ESLint
- [x] Install and configure Prettier
- [x] Create `.env.local.example` template
- [x] Set up GitHub Actions CI/CD workflow
- [x] Create progress tracking system

## 🔄 Manual Setup Required

### 1. Vercel Project Setup

**Steps:**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `https://github.com/Shaftdog/kanban`
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
5. Click "Deploy" (it will fail initially - that's expected)

**Environment Variables** (add in Vercel dashboard):
```
# Supabase (add after step 2)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# OpenAI (add in Phase 4)
OPENAI_API_KEY=

# Upstash Redis (add in Phase 4)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Sentry (optional, add in Phase 6)
SENTRY_DSN=
```

**Get Vercel IDs for GitHub Actions:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
cd kanban
vercel link

# Get project details
cat .vercel/project.json
```

Add to GitHub Secrets:
- `VERCEL_TOKEN` - From vercel.com/account/tokens
- `VERCEL_ORG_ID` - From `.vercel/project.json`
- `VERCEL_PROJECT_ID` - From `.vercel/project.json`

---

### 2. Supabase Projects Setup

**Create 3 Projects:**

#### A. Local Development (Optional - or use cloud)
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local Supabase
supabase init

# Start local stack
supabase start
```

Outputs:
- API URL: `http://localhost:54321`
- Anon key: (copy this)
- Service role key: (copy this)

#### B. Staging Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Name: `kanban-staging`
4. Database password: (generate strong password)
5. Region: Choose closest (e.g., `us-east-1`)
6. Click "Create new project"

Once created, go to Project Settings → API:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

Go to Project Settings → Database:
- Copy **Connection string (URI)** → `DATABASE_URL`
- Replace `[YOUR-PASSWORD]` with your database password

#### C. Production Project
Repeat the same steps as staging but name it `kanban-production`

**Configure RLS (Row Level Security)**:
Will be done in Phase 1 after schema is created.

---

### 3. GitHub Secrets Configuration

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

Required secrets:
```
# Vercel
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=

# Supabase Staging
STAGING_SUPABASE_URL=
STAGING_SUPABASE_ANON_KEY=
STAGING_DATABASE_URL=

# Supabase Production
PROD_SUPABASE_URL=
PROD_SUPABASE_ANON_KEY=
PROD_DATABASE_URL=

# For Tests (use staging)
TEST_DATABASE_URL=
TEST_SUPABASE_URL=
TEST_SUPABASE_ANON_KEY=
```

---

### 4. Local Environment Setup

Create `.env.local` (copy from `.env.local.example`):

```bash
cp .env.local.example .env.local
```

Fill in values:
```env
# Use staging or local Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-staging-service-key
DATABASE_URL=postgresql://postgres:password@db.your-staging-project.supabase.co:5432/postgres

# OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-key-here

# Upstash Redis (optional for now, add in Phase 4)
# Sign up at https://upstash.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Local config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

### 5. Sentry Setup (Optional - can do in Phase 6)

1. Go to [sentry.io](https://sentry.io)
2. Create account / login
3. Create new project:
   - Platform: Next.js
   - Alert frequency: Default
4. Copy DSN
5. Add to environment variables

---

### 6. Upstash Redis Setup (For Phase 4)

1. Go to [upstash.com](https://upstash.com)
2. Create account / login
3. Create database:
   - Name: `kanban-cache`
   - Type: Regional
   - Region: Same as Vercel (e.g., US East)
4. Go to database → REST API
5. Copy:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

---

## Verification Checklist

Run these commands to verify setup:

```bash
# Check files created
ls -la .eslintrc.json .prettierrc.json .env.local.example

# Check GitHub Actions
ls -la .github/workflows/

# Verify environment variables
cat .env.local | grep -v "^#" | grep "="

# Test Vercel CLI
vercel --version

# Test Supabase CLI (if using local)
supabase status
```

---

## Next Steps

Once all setup is complete:

1. Update progress:
   ```bash
   npm run check-progress
   npm run progress
   ```

2. Commit changes:
   ```bash
   git add .
   git commit -m "chore: complete Phase 0 DevOps setup

   - Configure ESLint and Prettier
   - Set up GitHub Actions CI/CD
   - Create environment variable templates
   - Add DevOps documentation

   🤖 Generated with Claude Code
   "
   git push
   ```

3. Verify GitHub Actions run successfully

4. Move to Phase 1:
   ```bash
   /start-phase 1
   ```

---

## Troubleshooting

**Vercel deployment fails**:
- Check environment variables are set
- Verify build command in settings
- Check build logs for errors

**Supabase connection fails**:
- Verify DATABASE_URL format
- Check project is not paused
- Verify password is correct

**GitHub Actions fail**:
- Check secrets are set correctly
- Verify Node version matches (20)
- Review action logs

---

**Phase 0 Progress**: Almost complete! Just need manual infrastructure setup.

Run `npm run progress` to see updated status.
