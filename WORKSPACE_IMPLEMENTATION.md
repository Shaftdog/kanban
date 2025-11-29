# Workspace/Team Sharing Implementation Guide

**Branch:** `feature/workspace-team-sharing`
**Status:** 🚧 Partial Implementation (Backend ~60% Complete)
**Last Updated:** 2025-11-28

---

## Overview

This document describes the implementation of multi-user workspace functionality, allowing team members to share and collaborate on the same Kanban board data.

### Architecture Decision

**Single Shared Workspace Model:**
- Each user belongs to ONE workspace
- All team members have EQUAL access to all data
- Workspace owner can invite new members via email
- Simple, flat permission structure (OWNER/MEMBER roles)

---

## What's Been Implemented ✅

### 1. Database Schema (100% Complete)

#### New Models

**Workspace** - Container for team collaboration
```prisma
model Workspace {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  members       WorkspaceMember[]
  invitations   WorkspaceInvitation[]
  projects      Project[]
  columns       Column[]
  tags          Tag[]
  aiRecommendations AIRecommendation[]
}
```

**WorkspaceMember** - Junction table for User ↔ Workspace
```prisma
model WorkspaceMember {
  id          String     @id @default(uuid())
  workspaceId String
  userId      String
  role        MemberRole @default(MEMBER)  // OWNER | MEMBER
  joinedAt    DateTime   @default(now())

  @@unique([workspaceId, userId])
}
```

**WorkspaceInvitation** - Email-based invitations
```prisma
model WorkspaceInvitation {
  id          String    @id @default(uuid())
  workspaceId String
  email       String
  invitedById String
  token       String    @unique
  expiresAt   DateTime  // 7 days from creation
  acceptedAt  DateTime?
  createdAt   DateTime  @default(now())
}
```

#### Updated Models

All data models now include `workspaceId`:
- `Project` - Projects scoped to workspace
- `Column` - Kanban columns shared across workspace
- `Tag` - Tags available to all workspace members
- `AIRecommendation` - AI analysis scoped to workspace

#### Migration Files

**Location:** `prisma/migrations/20251128185317_add_workspace_support/migration.sql`

**What it does:**
1. Creates new enum `MemberRole` (OWNER, MEMBER)
2. Creates `workspaces`, `workspace_members`, `workspace_invitations` tables
3. Adds nullable `workspaceId` columns to existing tables
4. Creates indexes for workspace-scoped queries
5. Adds foreign key constraints (partial - completed after data migration)

**Note:** The migration adds `workspaceId` as nullable initially to allow data migration.

---

### 2. Data Migration Script (100% Complete)

**Location:** `scripts/migrate-to-workspace.ts`

**Purpose:** Migrate existing single-user data to workspace model

**What it does:**
1. Finds the first user in the database
2. Creates a default workspace named "{User}'s Workspace"
3. Adds user as workspace OWNER
4. Migrates all existing data:
   - Projects → workspace
   - Columns → workspace
   - Tags → workspace
   - AI Recommendations → workspace
5. Updates schema constraints:
   - Makes `workspaceId` NOT NULL
   - Adds foreign key constraints
   - Updates indexes (workspace-scoped instead of user-scoped)

**Run command:**
```bash
npm run db:migrate
# or manually:
npm run db:migrate-data
```

**Package.json scripts added:**
```json
{
  "db:migrate": "prisma migrate deploy && npm run db:migrate-data",
  "db:migrate-data": "tsx scripts/migrate-to-workspace.ts"
}
```

---

### 3. Backend Utilities (100% Complete)

#### Workspace Context (`lib/workspace.ts`)

**`getWorkspaceContext()`**
- Retrieves user's workspace from session
- Returns `{ workspaceId, userId, role }`
- Throws "Unauthorized" if no session or no workspace membership
- Used by all API routes for authentication & workspace scoping

**`verifyWorkspaceAccess(userId, workspaceId)`**
- Checks if user has access to a specific workspace
- Returns boolean

**`getWorkspaceMembers(workspaceId)`**
- Returns all members of a workspace with user details
- Ordered by join date

#### User Initialization (`lib/utils/init-user-data.ts`)

**Updated functions:**
- `initializeUserColumns(userId, workspaceId)` - Creates default Kanban columns for workspace
- `initializeUserTags(userId, workspaceId)` - Creates default tags for workspace
- `createWelcomeProject(userId, workspaceId)` - Creates welcome project in workspace
- `initializeUserData(userId, workspaceId)` - Main initialization function

**Changes:** All functions now require `workspaceId` parameter and create workspace-scoped data.

---

### 4. API Routes Updated (8/17 Routes)

#### ✅ Completed Routes

| Route | Methods | Changes |
|-------|---------|---------|
| `/api/projects` | GET, POST | Filter by workspaceId instead of userId |
| `/api/projects/[id]` | GET, PATCH, DELETE | Verify workspace ownership |
| `/api/columns` | GET | Return workspace columns |
| `/api/tags` | GET, POST | Workspace-scoped tags |
| `/api/init` | GET, POST | Create workspace for new users |

**Pattern used:**
```typescript
import { getWorkspaceContext } from '@/lib/workspace'

export async function GET() {
  try {
    const { workspaceId } = await getWorkspaceContext()

    const data = await prisma.model.findMany({
      where: { workspaceId },
      // ...
    })

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // handle other errors
  }
}
```

#### ✅ New Workspace Management Routes

**GET `/api/workspace`**
- Returns workspace details, members, pending invitations, and stats
- Response includes member list with user details

**POST `/api/workspace/invite`**
- Creates email invitation with secure token
- Validates email, checks for existing members/invitations
- Token expires in 7 days
- Returns invitation details and invite URL (for now - should send email)

**GET `/api/workspace/invite/[token]`**
- Fetches invitation details by token
- Validates token hasn't been accepted or expired
- Returns workspace name, inviter info, expiration

**POST `/api/workspace/invite/[token]`**
- Accepts invitation and adds user to workspace
- Validates token, checks expiration
- Creates user record if needed
- Adds WorkspaceMember with MEMBER role
- Marks invitation as accepted

**DELETE `/api/workspace/members/[memberId]`**
- Removes member from workspace
- Prevents removing workspace owner
- Members can remove themselves; owners can remove anyone

---

## What Needs to Be Completed ❌

### 1. Remaining API Routes (9 routes)

All follow the same pattern - replace `userId` filtering with `workspaceId`:

**Milestones:**
- `/api/milestones` (GET, POST)
- `/api/milestones/[id]` (GET, PATCH, DELETE)
- `/api/milestones/[id]/dependencies` (GET)

**Tasks:**
- `/api/tasks` (GET, POST)
- `/api/tasks/[id]` (GET, PATCH, DELETE)
- `/api/tasks/[id]/tags` (POST, DELETE)

**Others:**
- `/api/columns/[id]` (PATCH, DELETE)
- `/api/ai/prioritize` (POST)
- `/api/analytics` (GET)

**Estimated time:** 20-30 minutes (straightforward pattern replication)

---

### 2. Email Integration

**Recommended:** Resend (modern, simple API, generous free tier)

**Steps:**
1. Install Resend SDK:
   ```bash
   npm install resend
   ```

2. Add environment variable:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

3. Create email service (`lib/email.ts`):
   ```typescript
   import { Resend } from 'resend'

   const resend = new Resend(process.env.RESEND_API_KEY)

   export async function sendInvitationEmail({
     to,
     invitedBy,
     workspaceName,
     inviteUrl,
   }: {
     to: string
     invitedBy: string
     workspaceName: string
     inviteUrl: string
   }) {
     await resend.emails.send({
       from: 'Kanban <noreply@yourdomain.com>',
       to,
       subject: `${invitedBy} invited you to ${workspaceName}`,
       html: `
         <h2>You've been invited to join ${workspaceName}</h2>
         <p>${invitedBy} has invited you to collaborate on their Kanban board.</p>
         <p><a href="${inviteUrl}">Accept Invitation</a></p>
         <p>This invitation expires in 7 days.</p>
       `,
     })
   }
   ```

4. Update `/api/workspace/invite/route.ts`:
   - Remove `inviteUrl` from response (security)
   - Call `sendInvitationEmail()` after creating invitation
   - Return success message only

**Estimated time:** 15 minutes

---

### 3. Frontend UI

#### A. Workspace Settings Page

**Location:** `app/(dashboard)/settings/workspace/page.tsx`

**Features:**
- Display workspace name
- List current members (avatar, name, email, role, joined date)
- Invite form (email input, send button)
- Pending invitations list (email, sent date, expires date)
- Remove member button (for owners)

**Components to create:**
- `components/workspace/MemberList.tsx`
- `components/workspace/InviteForm.tsx`
- `components/workspace/PendingInvitations.tsx`

**API calls:**
```typescript
// Fetch workspace data
const { data } = await fetch('/api/workspace').then(r => r.json())

// Send invitation
await fetch('/api/workspace/invite', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
})

// Remove member
await fetch(`/api/workspace/members/${memberId}`, { method: 'DELETE' })
```

**Estimated time:** 2-3 hours

---

#### B. Invitation Acceptance Page

**Location:** `app/(auth)/invite/[token]/page.tsx`

**Flow:**
1. Extract token from URL
2. Fetch invitation details: `GET /api/workspace/invite/[token]`
3. Display workspace name, inviter, expiration
4. If user is logged in:
   - Show "Accept Invitation" button
   - On click: `POST /api/workspace/invite/[token]`
   - Redirect to `/board` on success
5. If user is NOT logged in:
   - Show "Sign in to accept" button
   - Redirect to `/login?redirect=/invite/[token]`
   - After login, auto-redirect back to accept invitation

**Error states:**
- Invalid token → "Invitation not found"
- Expired → "Invitation has expired"
- Already accepted → "Invitation already used"
- Wrong email → "This invitation is for a different email"

**Estimated time:** 1-2 hours

---

#### C. Board UI Updates

**Location:** `app/(dashboard)/board/page.tsx`

**Changes:**
1. **Header:** Display workspace name
   ```tsx
   const { data: workspace } = useSWR('/api/workspace')

   <header>
     <h1>{workspace?.name}</h1>
   </header>
   ```

2. **Member Avatars:** Show team members (optional)
   ```tsx
   <div className="flex -space-x-2">
     {workspace?.members.map(member => (
       <Avatar key={member.id} user={member.user} />
     ))}
   </div>
   ```

3. **Settings Link:** Add link to workspace settings
   ```tsx
   <Link href="/settings/workspace">
     <Settings /> Team Settings
   </Link>
   ```

**Estimated time:** 30 minutes

---

### 4. Deployment & Testing

#### A. Database Migration

**Prerequisites:**
- Production database must be accessible
- Backup current database before migration

**Steps:**
1. Push schema changes:
   ```bash
   npx prisma migrate deploy
   ```

2. Run data migration:
   ```bash
   npm run db:migrate-data
   ```

3. Verify migration:
   ```bash
   npx prisma studio
   # Check: workspaces table exists, existing data has workspaceId
   ```

#### B. Testing Checklist

- [ ] New user registration creates workspace automatically
- [ ] Workspace owner can send invitations
- [ ] Email invitations are received
- [ ] Invitation link acceptance works
- [ ] New member can see shared data (projects, tasks, etc.)
- [ ] New member can create/edit/delete data
- [ ] Data is properly scoped to workspace (no cross-workspace leakage)
- [ ] Member removal works
- [ ] Cannot remove workspace owner
- [ ] Members can see each other in member list
- [ ] Expired invitations cannot be accepted

---

## Design Decisions & Rationale

### Why Single Workspace?

**Simplicity:**
- Easier to implement and maintain
- No context switching for users
- Clearer mental model

**User's Requirements:**
- User specified "single shared workspace"
- Equal access for all members
- No complex permission system needed

**Future:** Can extend to multiple workspaces later if needed (data model supports it).

---

### Why Email Invitations?

**Security:**
- More controlled than shareable links
- Invitations are tied to specific email addresses
- Can verify email matches during acceptance

**User's Choice:**
- User selected "Email invitations" over shareable links
- Better for professional team environments

---

### Why 7-Day Expiration?

**Balance:**
- Long enough for invitee to respond
- Short enough to maintain security
- Industry standard (GitHub, Slack use 7 days)

**Implementation:** Can be adjusted via `expiresAt` calculation in `/api/workspace/invite/route.ts:71`

---

## File Structure

```
kanban/
├── prisma/
│   ├── schema.prisma                                    # ✅ Updated with workspace models
│   └── migrations/
│       └── 20251128185317_add_workspace_support/
│           └── migration.sql                            # ✅ Database migration
│
├── lib/
│   ├── workspace.ts                                     # ✅ NEW: Workspace utilities
│   └── utils/
│       └── init-user-data.ts                            # ✅ Updated for workspace
│
├── scripts/
│   └── migrate-to-workspace.ts                          # ✅ NEW: Data migration script
│
├── app/
│   └── api/
│       ├── workspace/
│       │   ├── route.ts                                 # ✅ NEW: Get workspace details
│       │   ├── invite/
│       │   │   ├── route.ts                             # ✅ NEW: Send invitations
│       │   │   └── [token]/route.ts                     # ✅ NEW: View/accept invitation
│       │   └── members/
│       │       └── [memberId]/route.ts                  # ✅ NEW: Remove member
│       │
│       ├── projects/
│       │   ├── route.ts                                 # ✅ Updated: workspace-scoped
│       │   └── [id]/route.ts                            # ✅ Updated: workspace-scoped
│       │
│       ├── columns/
│       │   ├── route.ts                                 # ✅ Updated: workspace-scoped
│       │   └── [id]/route.ts                            # ❌ TODO: Update
│       │
│       ├── tags/
│       │   └── route.ts                                 # ✅ Updated: workspace-scoped
│       │
│       ├── milestones/
│       │   ├── route.ts                                 # ❌ TODO: Update
│       │   └── [id]/
│       │       ├── route.ts                             # ❌ TODO: Update
│       │       └── dependencies/route.ts                # ❌ TODO: Update
│       │
│       ├── tasks/
│       │   ├── route.ts                                 # ❌ TODO: Update
│       │   └── [id]/
│       │       ├── route.ts                             # ❌ TODO: Update
│       │       └── tags/route.ts                        # ❌ TODO: Update
│       │
│       ├── ai/prioritize/route.ts                       # ❌ TODO: Update
│       ├── analytics/route.ts                           # ❌ TODO: Update
│       └── init/route.ts                                # ✅ Updated: creates workspace
│
└── package.json                                         # ✅ Added migration scripts
```

---

## Quick Start (For Future Implementation)

### 1. Complete Remaining API Routes

Replace in each file:
```typescript
// OLD
const { data: { session } } = await supabase.auth.getSession()
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const data = await prisma.model.findMany({
  where: { userId: session.user.id }
})

// NEW
const { workspaceId, userId } = await getWorkspaceContext()

const data = await prisma.model.findMany({
  where: { workspaceId }
})
```

### 2. Set Up Email Service

```bash
npm install resend
echo "RESEND_API_KEY=your_key_here" >> .env.local
```

Create `lib/email.ts` (template above), integrate into `/api/workspace/invite/route.ts`

### 3. Build Frontend

Create pages in this order:
1. Workspace settings page (most important)
2. Invitation acceptance page
3. Board UI updates (cosmetic)

### 4. Deploy

```bash
# Run migrations
npm run db:migrate

# Deploy to Vercel
vercel --prod
```

---

## API Reference

### Workspace Endpoints

#### `GET /api/workspace`
Get current workspace details

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "My Workspace",
    "members": [
      {
        "id": "uuid",
        "role": "OWNER",
        "joinedAt": "2025-01-01T00:00:00Z",
        "user": {
          "id": "uuid",
          "email": "user@example.com",
          "name": "John Doe",
          "avatarUrl": "https://..."
        }
      }
    ],
    "invitations": [
      {
        "id": "uuid",
        "email": "invited@example.com",
        "expiresAt": "2025-01-08T00:00:00Z"
      }
    ],
    "_count": {
      "projects": 5,
      "columns": 8,
      "tags": 10
    }
  }
}
```

---

#### `POST /api/workspace/invite`
Send workspace invitation

**Request:**
```json
{
  "email": "newmember@example.com"
}
```

**Response:**
```json
{
  "data": {
    "invitation": {
      "id": "uuid",
      "email": "newmember@example.com",
      "expiresAt": "2025-01-08T00:00:00Z"
    },
    "inviteUrl": "http://localhost:3000/invite/abc123..."
  },
  "message": "Invitation sent successfully"
}
```

**Errors:**
- `400` - Email already a member
- `400` - Pending invitation exists
- `401` - Unauthorized

---

#### `GET /api/workspace/invite/[token]`
Get invitation details

**Response:**
```json
{
  "data": {
    "email": "invited@example.com",
    "workspaceName": "My Workspace",
    "invitedBy": "John Doe",
    "expiresAt": "2025-01-08T00:00:00Z"
  }
}
```

**Errors:**
- `404` - Invitation not found
- `400` - Already accepted
- `400` - Expired

---

#### `POST /api/workspace/invite/[token]`
Accept invitation

**Response:**
```json
{
  "data": {
    "workspaceId": "uuid",
    "workspaceName": "My Workspace"
  },
  "message": "Successfully joined workspace"
}
```

**Errors:**
- `401` - Not logged in
- `403` - Email mismatch
- `404` - Invitation not found
- `400` - Already accepted/expired/already member

---

#### `DELETE /api/workspace/members/[memberId]`
Remove workspace member

**Response:**
```json
{
  "message": "Member removed successfully"
}
```

**Errors:**
- `403` - Cannot remove owner
- `403` - Insufficient permissions
- `404` - Member not found

---

## Security Considerations

### Authentication
- All routes use `getWorkspaceContext()` which validates Supabase session
- Returns 401 if not authenticated

### Authorization
- Data automatically scoped to user's workspace via `workspaceId` filter
- Cannot access other workspaces' data

### Invitation Security
- Tokens are cryptographically secure (32 random bytes)
- Unique constraint prevents token collisions
- 7-day expiration limits exposure window
- One-time use (marked as accepted)
- Email validation (optional, can be removed)

### SQL Injection
- All queries use Prisma ORM (parameterized)
- No raw SQL with user input

### XSS Protection
- API returns JSON only (no HTML rendering)
- Frontend should sanitize before display

---

## Troubleshooting

### Migration Fails: "workspaceId cannot be null"

**Cause:** Data migration hasn't run yet

**Fix:**
```bash
npm run db:migrate-data
```

---

### "User is not a member of any workspace"

**Cause:** User exists but has no workspace membership

**Fix:**
```bash
# Option 1: Call init endpoint
POST /api/init

# Option 2: Manually create workspace membership in Prisma Studio
```

---

### Invitation email not sending

**Cause:** Email service not configured (current implementation just logs)

**Fix:** Implement email integration (see section 2 above)

---

### Cannot see other members' data

**Expected behavior:** This is correct! Data is workspace-scoped.

**If truly broken:** Check that both users have same `workspaceId` in database:
```sql
SELECT u.email, wm.workspaceId
FROM workspace_members wm
JOIN users u ON wm.userId = u.id;
```

---

## Performance Considerations

### Indexes Added

Workspace-scoped queries are indexed:
- `projects_workspaceId_status_idx`
- `projects_workspaceId_sortOrder_idx`
- `columns_workspaceId_key_key` (unique)
- `tags_workspaceId_name_key` (unique)
- `workspace_members_workspaceId_userId_key` (unique)

### Query Performance

With proper indexes, workspace filtering adds minimal overhead:
```sql
-- Before: WHERE userId = '...'
-- After:  WHERE workspaceId = '...'
```

Both are indexed primary lookups (O(log n)).

---

## Future Enhancements

### Multiple Workspaces per User
Data model already supports this - just need:
- Workspace switcher UI
- Update `getWorkspaceContext()` to accept workspace selection
- Session/cookie to remember active workspace

### Granular Permissions
Add permission levels beyond OWNER/MEMBER:
- Viewer (read-only)
- Editor (can edit)
- Admin (can manage members)

Implementation:
```prisma
enum MemberRole {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}
```

### Workspace Customization
- Custom workspace names (edit feature)
- Workspace avatars/logos
- Workspace settings (default columns, tags, etc.)

### Activity Log
Track workspace changes:
```prisma
model WorkspaceActivity {
  id          String
  workspaceId String
  userId      String
  action      String  // "created_project", "invited_member", etc.
  metadata    Json
  createdAt   DateTime
}
```

### Real-time Collaboration
- WebSocket for live updates
- "User X is editing..." indicators
- Conflict resolution for concurrent edits

---

## Support & Questions

**Branch:** `feature/workspace-team-sharing`

**Documentation:** This file (`WORKSPACE_IMPLEMENTATION.md`)

**Next Steps:** See "What Needs to Be Completed" section above

**Estimated Completion Time:**
- Backend routes: 30 min
- Email integration: 15 min
- Frontend UI: 3-4 hours
- Testing & deployment: 1-2 hours
- **Total: 5-6 hours**

---

**Generated with Claude Code**
**Last Updated:** 2025-11-28
