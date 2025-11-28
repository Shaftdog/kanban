# Vercel Deployment Troubleshooting Guide

This document captures deployment issues encountered on 2025-11-28 and their solutions for quick resolution in the future.

---

## Issue 1: "Invalid API key" Error on Login Page

### Symptoms
- Login page displays "Invalid API key" error in red banner
- Browser console shows 404 errors to Supabase auth endpoints
- Error occurs immediately on page load, even before attempting to sign in

### Root Cause
**This error is NOT related to OpenAI API key.** It's a Supabase authentication error caused by:
1. Invalid or truncated `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel environment variables
2. Supabase project keys were regenerated or revoked

### Solution
1. Go to Supabase Dashboard: `https://supabase.com/dashboard/project/[project-ref]`
2. Navigate to **Settings** → **API**
3. Copy these values:
   - Project URL (e.g., `https://[project-ref].supabase.co`)
   - `anon` `public` key (long JWT token - copy the ENTIRE value)
   - `service_role` `secret` key

4. Update Vercel environment variables:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Update/verify these variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ensure full JWT copied, not truncated)
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Set for all environments (Production, Preview, Development)

5. Redeploy the application

### Verification
- Login page should load without errors
- Successful authentication redirects to `/board`

---

## Issue 2: OpenAI Client Build-Time Errors

### Symptoms
- Deployment fails during build
- Error message: "Missing OPENAI_API_KEY environment variable"
- Error occurs even when OpenAI key is set in Vercel

### Root Cause
The OpenAI client was being instantiated at module load time (`lib/ai/client.ts`), causing Next.js to fail during build when the environment variable wasn't available at build time.

### Solution (Already Implemented)
Changed from eager to lazy initialization:

**Before:**
```typescript
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

**After:**
```typescript
export function getOpenAIClient(): OpenAI {
  if (!_openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    _openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openaiClient;
}
```

**Commit:** `15f82ba - fix: use lazy initialization for OpenAI client`

---

## Issue 3: Database Connection Errors (500 errors on /api/columns)

### Symptoms
- User can log in successfully
- Board page displays "Error loading board: Failed to fetch columns"
- Browser console shows 500 errors from `/api/columns` endpoint
- Vercel function logs show: `error: Error validating datasource 'db': the URL must start with the protocol 'postgresql://' or 'postgres://'`

### Root Causes
Multiple DATABASE_URL configuration issues:

1. **Line breaks in URL** - Vercel's UI can insert line breaks when pasting long URLs
2. **Wrong port** - Using direct connection port (5432) instead of pooler port (6543) for some Supabase regions
3. **Missing protocol** - URL doesn't start with `postgresql://`
4. **Missing pgbouncer parameter** - Required for serverless environments

### Solution

#### Step 1: Get Correct Database URL from Supabase
1. Go to Supabase Dashboard → Settings → Database
2. Scroll to **Connection string** section
3. Select **Connection pooling** (Transaction mode)
4. Copy the connection pooling URL

#### Step 2: Format the URL Correctly
The URL must be in this exact format (ONE line, NO line breaks):

```
postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
```

**Critical Points:**
- Must start with `postgresql://` or `postgres://`
- Use `.pooler.supabase.com` hostname (not direct connection)
- Port can be 5432 or 6543 depending on your Supabase region (check the connection string from Supabase)
- Must end with `?pgbouncer=true&connection_limit=1`
- **NO line breaks anywhere in the URL**
- **NO spaces**
- **NO brackets around the password**

#### Step 3: Update in Vercel
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Find `DATABASE_URL`
3. Click **Edit**
4. **Delete** the existing value completely
5. Paste the correctly formatted URL on ONE continuous line
6. Verify no line breaks were inserted
7. Save
8. Set for all environments (Production, Preview, Development)
9. Redeploy

### Verification
Check Vercel function logs after deployment:
1. Go to Vercel → Deployments → Latest deployment
2. Click **Functions** tab
3. Look for errors related to Prisma or database connections
4. Successful connections will show no initialization errors

---

## Quick Diagnostic Checklist

When deployment issues occur, check in this order:

### 1. Authentication Issues ("Invalid API key" on login)
- [ ] Verify Supabase project is active
- [ ] Check `NEXT_PUBLIC_SUPABASE_URL` matches Supabase project URL
- [ ] Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is complete (not truncated)
- [ ] Confirm keys are set for all environments in Vercel

### 2. Build Failures
- [ ] Check if error mentions "Missing OPENAI_API_KEY"
- [ ] Verify OpenAI client uses lazy initialization (`getOpenAIClient()`)
- [ ] Ensure `OPENAI_API_KEY` is set in Vercel (starts with `sk-`)

### 3. Runtime 500 Errors
- [ ] Check Vercel function logs for exact error
- [ ] If "URL must start with protocol" error:
  - [ ] Verify `DATABASE_URL` starts with `postgresql://`
  - [ ] Check for line breaks in URL (view raw in Vercel)
  - [ ] Confirm URL uses connection pooling (`.pooler.supabase.com`)
  - [ ] Verify URL ends with `?pgbouncer=true&connection_limit=1`

### 4. Empty Board / No Columns
- [ ] User might need initialization - call `/api/init` as POST
- [ ] Check database has tables (verify migrations ran)
- [ ] Confirm user exists in database

---

## Accessing Vercel Logs

To view detailed error messages:

1. Go to Vercel Dashboard
2. Select your project
3. Click **Deployments** tab
4. Click on the deployment you want to inspect
5. Click **Functions** tab
6. Click on any function that shows errors
7. Review the full stack trace

**Tip:** Logs show the exact error message, which is crucial for diagnosing configuration issues.

---

## Environment Variables Checklist

Ensure these are set in Vercel (Settings → Environment Variables):

### Required Variables
- [x] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key (full JWT)
- [x] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [x] `DATABASE_URL` - PostgreSQL connection pooling URL with pgbouncer
- [x] `OPENAI_API_KEY` - OpenAI API key (starts with sk-)

### Optional Variables
- [ ] `UPSTASH_REDIS_REST_URL` - Redis for caching
- [ ] `UPSTASH_REDIS_REST_TOKEN` - Redis token
- [ ] `SENTRY_DSN` - Error monitoring
- [ ] `NEXT_PUBLIC_APP_URL` - Production URL

---

## Common Mistakes to Avoid

1. **Truncated Keys** - Always copy the entire key/URL, especially long JWT tokens
2. **Line Breaks** - Paste URLs on one line; Vercel's UI can wrap them visually
3. **Wrong Port** - Use pooler port from Supabase, not direct connection port
4. **Missing Parameters** - Always include `?pgbouncer=true` for DATABASE_URL
5. **Not Redeploying** - Environment variable changes require a redeploy
6. **Wrong Environment** - Set variables for all environments (Prod, Preview, Dev)

---

## Related Files

- `lib/ai/client.ts` - OpenAI client with lazy initialization
- `lib/ai/agents.ts` - AI agents using `getOpenAIClient()`
- `lib/prisma.ts` - Prisma client initialization
- `lib/supabase/client.ts` - Supabase browser client
- `lib/supabase/server.ts` - Supabase server client
- `app/api/init/route.ts` - User initialization endpoint
- `middleware.ts` - Auth middleware using Supabase

---

## Incident Timeline (2025-11-28)

1. **Issue Reported:** "Invalid API key" error on deployed app
2. **Initial Diagnosis:** Assumed OpenAI API key issue
3. **Root Cause 1:** Supabase anon key was invalid/truncated in Vercel
4. **Fix 1:** Updated Supabase environment variables
5. **Root Cause 2:** OpenAI client eager initialization caused confusion
6. **Fix 2:** Implemented lazy initialization (commit 15f82ba)
7. **Root Cause 3:** DATABASE_URL had line breaks and missing pgbouncer param
8. **Fix 3:** Corrected DATABASE_URL format, removed line breaks
9. **Resolution:** App deployed successfully and fully functional

**Total Resolution Time:** ~45 minutes
**Key Learning:** Always check Vercel function logs first for exact error messages

---

**Document Version:** 1.0
**Last Updated:** 2025-11-28
**Status:** Active
