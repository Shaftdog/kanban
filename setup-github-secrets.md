# GitHub Secrets Setup

## ✅ Already Added - Vercel Secrets

- VERCEL_TOKEN
- VERCEL_PROJECT_ID
- VERCEL_ORG_ID

---

## 🔄 Add Now - Supabase Staging Secrets

Go to: https://github.com/Shaftdog/kanban/settings/secrets/actions

Click **"New repository secret"** for each:

### Staging Secrets

**Name:** `STAGING_SUPABASE_URL`
**Value:** `https://lnkvnntmaputqntgnurf.supabase.co`

**Name:** `STAGING_SUPABASE_ANON_KEY`
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxua3ZubnRtYXB1dHFudGdudXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDc2ODUsImV4cCI6MjA3OTU4MzY4NX0.B7_kdqRjZ2KYzEKGCV3_0_78gPcYO-iJEloa-1fXVkg`

**Name:** `STAGING_DATABASE_URL`
**Value:** `postgresql://postgres:igZxwc39PX6JLJ8Q@db.lnkvnntmaputqntgnurf.supabase.co:5432/postgres`

### Testing Secrets (use staging values)

**Name:** `TEST_SUPABASE_URL`
**Value:** `https://lnkvnntmaputqntgnurf.supabase.co`

**Name:** `TEST_SUPABASE_ANON_KEY`
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxua3ZubnRtYXB1dHFudGdudXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDc2ODUsImV4cCI6MjA3OTU4MzY4NX0.B7_kdqRjZ2KYzEKGCV3_0_78gPcYO-iJEloa-1fXVkg`

**Name:** `TEST_DATABASE_URL`
**Value:** `postgresql://postgres:igZxwc39PX6JLJ8Q@db.lnkvnntmaputqntgnurf.supabase.co:5432/postgres`

---

## ⏭️ Add Later - Production Secrets (after creating production project)

**Name:** `PROD_SUPABASE_URL`
**Value:** `[will add after production Supabase setup]`

**Name:** `PROD_SUPABASE_ANON_KEY`
**Value:** `[will add after production Supabase setup]`

**Name:** `PROD_DATABASE_URL`
**Value:** `[will add after production Supabase setup]`
