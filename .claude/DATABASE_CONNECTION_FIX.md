# Database Connection Fix - Supabase Connection Format Change

## Problem Summary
**Date Discovered:** November 27, 2025

The Kanban application stopped connecting to the Supabase database with the error:
```
Can't reach database server at `db.lnkvnntmaputqntgnurf.supabase.co:6543`
```

## Symptoms
- Board won't load - shows "Error loading board: Failed to fetch columns"
- All API routes return 500 errors
- Prisma cannot connect to database
- DNS lookup fails for `db.lnkvnntmaputqntgnurf.supabase.co`

## Root Cause
Supabase changed their database connection pooling format. The old `db.` hostname prefix and port 6543 (transaction pooler) are no longer valid. The new format uses:
- Session pooler on port 5432
- Hostname format: `aws-1-us-east-2.pooler.supabase.com`
- Username format: `postgres.{project-ref}` (includes project reference)

## Diagnostic Steps

1. **Test DNS resolution:**
   ```bash
   nslookup db.lnkvnntmaputqntgnurf.supabase.co
   # Returns: "No answer" - hostname doesn't resolve
   ```

2. **Test database connection:**
   ```bash
   node test-db-connection.js
   # Shows connection failure with old hostname
   ```

3. **Check Supabase dashboard:**
   - Navigate to: Project Settings → Database → Connection String
   - Look for "Session pooler" connection string
   - New format will be visible there

## Solution

### Old DATABASE_URL (BROKEN):
```
DATABASE_URL=postgresql://postgres:x7Jk8Mh1PzKan0cw@db.lnkvnntmaputqntgnurf.supabase.co:6543/postgres?pgbouncer=true
```

### New DATABASE_URL (WORKING):
```
DATABASE_URL=postgresql://postgres.lnkvnntmaputqntgnurf:x7Jk8Mh1PzKan0cw@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

### Key Changes:
1. **Hostname:** `db.lnkvnntmaputqntgnurf.supabase.co` → `aws-1-us-east-2.pooler.supabase.com`
2. **Port:** `6543` → `5432`
3. **Username:** `postgres` → `postgres.lnkvnntmaputqntgnurf` (add project ref)
4. **Remove:** `?pgbouncer=true` parameter

## How to Fix in Future

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/lnkvnntmaputqntgnurf/settings/database
2. Find "Session pooler" connection string (recommended for Prisma)
3. Copy the URI connection string
4. Update `.env.local` with new `DATABASE_URL`
5. Restart dev server
6. Test connection with: `node test-db-connection.js`

## Prevention

Always use the connection string from Supabase dashboard rather than manually constructing it. Supabase may change formats/endpoints over time.

## Files Affected
- `.env.local` - DATABASE_URL updated
- All Prisma database connections automatically use updated URL

## Verification
After applying fix:
```bash
node test-db-connection.js
# Should output: ✅ Database connection successful!
```

Then restart dev server and refresh browser - board should load normally.
