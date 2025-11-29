# Workspace Feature - Quick Start Guide

**Branch:** `feature/workspace-team-sharing`
**Full Documentation:** See `WORKSPACE_IMPLEMENTATION.md`

---

## TL;DR

✅ **Done:** Backend infrastructure for team workspaces (60% complete)
❌ **TODO:** Finish 9 API routes, add email service, build frontend UI (40%)

---

## To Complete This Feature

### 1. Update Remaining API Routes (~30 min)

Copy this pattern to 9 remaining routes:

```typescript
// Replace this:
const supabase = await createClient()
const { data: { session } } = await supabase.auth.getSession()
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const data = await prisma.model.findMany({
  where: { userId: session.user.id }
})

// With this:
import { getWorkspaceContext } from '@/lib/workspace'

const { workspaceId, userId } = await getWorkspaceContext()

const data = await prisma.model.findMany({
  where: { workspaceId }
})
```

**Files to update:**
- `app/api/milestones/route.ts`
- `app/api/milestones/[id]/route.ts`
- `app/api/milestones/[id]/dependencies/route.ts`
- `app/api/tasks/route.ts`
- `app/api/tasks/[id]/route.ts`
- `app/api/tasks/[id]/tags/route.ts`
- `app/api/columns/[id]/route.ts`
- `app/api/ai/prioritize/route.ts`
- `app/api/analytics/route.ts`

---

### 2. Add Email Service (~15 min)

```bash
npm install resend
echo "RESEND_API_KEY=your_key" >> .env.local
```

Create `lib/email.ts`:
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvitationEmail({ to, invitedBy, workspaceName, inviteUrl }) {
  await resend.emails.send({
    from: 'Kanban <noreply@yourdomain.com>',
    to,
    subject: `${invitedBy} invited you to ${workspaceName}`,
    html: `<h2>Join ${workspaceName}</h2>
           <p>${invitedBy} invited you to collaborate.</p>
           <p><a href="${inviteUrl}">Accept Invitation</a></p>`,
  })
}
```

Update `app/api/workspace/invite/route.ts` line 88:
```typescript
await sendInvitationEmail({ to: email, invitedBy, workspaceName, inviteUrl })
```

---

### 3. Build Frontend (~4 hours)

**A. Workspace Settings Page**
- Create `app/(dashboard)/settings/workspace/page.tsx`
- Show members, invite form, pending invitations
- API calls: GET `/api/workspace`, POST `/api/workspace/invite`, DELETE `/api/workspace/members/[id]`

**B. Invitation Page**
- Create `app/(auth)/invite/[token]/page.tsx`
- GET `/api/workspace/invite/[token]` → show details
- POST `/api/workspace/invite/[token]` → accept & redirect

**C. Board Updates (optional)**
- Add workspace name to header
- Add member avatars
- Link to workspace settings

---

### 4. Deploy

```bash
# Run migrations (when DB is available)
npm run db:migrate

# Deploy
vercel --prod
```

---

## What's Already Done

✅ Database schema with Workspace, WorkspaceMember, WorkspaceInvitation models
✅ Prisma migration script
✅ Data migration script (`scripts/migrate-to-workspace.ts`)
✅ Workspace utilities (`lib/workspace.ts`)
✅ 8 API routes updated (projects, columns, tags, init)
✅ Workspace management endpoints (invite, accept, remove)

---

## Key Files

```
prisma/schema.prisma                         # Updated schema
prisma/migrations/.../migration.sql          # DB migration
scripts/migrate-to-workspace.ts              # Data migration
lib/workspace.ts                             # Workspace utilities
app/api/workspace/                           # Workspace endpoints
WORKSPACE_IMPLEMENTATION.md                  # Full docs
```

---

## Commands

```bash
# Run all migrations
npm run db:migrate

# Run just data migration
npm run db:migrate-data

# Test workspace creation
curl -X POST http://localhost:3000/api/init

# Send invitation (requires auth)
curl -X POST http://localhost:3000/api/workspace/invite \
  -H "Content-Type: application/json" \
  -d '{"email":"teammate@example.com"}'
```

---

## Testing Checklist

- [ ] New user gets workspace created automatically
- [ ] Can send invitations
- [ ] Can accept invitations
- [ ] New member sees shared data
- [ ] Can create/edit/delete shared data
- [ ] Can remove members
- [ ] Cannot remove owner
- [ ] Expired invitations fail

---

**Total remaining work:** ~5-6 hours
**Priority:** Update API routes → Email → Frontend → Deploy

See `WORKSPACE_IMPLEMENTATION.md` for complete details.
