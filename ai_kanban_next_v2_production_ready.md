# AI-Powered Kanban Next.js Application — Production-Ready Build Plan v2

> **Updated for:** Single-user, production-ready deployment on Vercel + Supabase
> **Timeline:** 7-8 weeks to production-ready MVP

## Table of Contents
1. [Product Vision & Core Features](#1-product-vision--core-features)
2. [Tech Stack (Updated)](#2-tech-stack-updated)
3. [Data Model Design](#3-data-model-design)
4. [Next.js App Architecture](#4-nextjs-app-architecture)
5. [Kanban Board UI Design](#5-kanban-board-ui-design)
6. [Task & Project Detail Views](#6-task--project-detail-views)
7. [AI Features — Flows & Prompts](#7-ai-features--flows--prompts)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Testing Strategy](#9-testing-strategy)
10. [Security & Performance](#10-security--performance)
11. [Implementation Phases](#11-implementation-phases)
12. [DevOps & Deployment](#12-devops--deployment)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Future Enhancements](#14-future-enhancements)

---

## 1. Product Vision & Core Features

### 1.1 Vision
Build a production-ready web application (Next.js 15) that:
- Manages **Projects (P)** → **Milestones (M)** → **Subtasks (sb)** hierarchically
- Presents everything on a **Kanban board** with drag-and-drop and collapsible cards
- Uses **AI** (OpenAI) to:
  - Chunk/cluster tasks into thematic streams
  - Prioritize work across all projects intelligently
  - Suggest column moves based on dependencies and readiness
  - Generate subtasks and clarify descriptions

### 1.2 Core User Stories

1. **Project Structure**
   - As a user, I can create Projects (P), each containing Milestones (M) and Subtasks (sb)
   - As a user, I can view my work in both hierarchical and Kanban views

2. **Kanban Board**
   - As a user, I see cards organized in columns: `Projects`, `Backlog`, `Working`, `Ready to Test`, `Agent Testing`, `Deployed/Manual Testing`, `Completed`
   - As a user, I can drag-and-drop cards between columns with smooth animations
   - As a user, I can expand/collapse Milestone cards to see subtasks inline
   - As a user, I can filter by project, tag, value, or status

3. **AI Assistance**
   - As a user, I can click **"AI Prioritize"** to get:
     - Top N recommended subtasks to work on next
     - Suggested column moves with reasoning
     - Thematic groupings (Sales, UX, Finance, etc.)
   - As a user, I can ask AI to generate subtasks for a milestone
   - As a user, I can get AI help to clarify or expand task descriptions

4. **Task Metadata**
   - Each Milestone/Subtask stores: value, urgency, effort, dependencies, tags, description
   - AI can read/write a `priorityScore` field for ranking

5. **Single-User Focus**
   - Secure, personal workspace
   - Fast, responsive experience
   - Data privacy with row-level security

---

## 2. Tech Stack (Updated)

### 2.1 Frontend & Framework
- **Next.js 15** (App Router) with React 19
- **TypeScript** for type safety (strict mode enabled)
- **Tailwind CSS** for styling
- **shadcn/ui** for pre-built accessible components
- **State Management**:
  - TanStack Query (React Query) v5 for server state
  - React hooks & context for local UI state

### 2.2 Backend & Persistence
- **Supabase** as all-in-one backend:
  - PostgreSQL database (hosted)
  - Authentication (email/password + OAuth)
  - Row Level Security (RLS) policies
  - Real-time subscriptions (for future collaboration)
  - Auto-generated TypeScript types
- **Prisma** as ORM for type-safe queries and migrations
- Next.js API routes in `app/api/**` for server logic

### 2.3 AI Integration
- **OpenAI API** (GPT-4 or later) for:
  - Task prioritization and clustering
  - Subtask generation
  - Description enhancement
- **Streaming responses** for better UX
- **Vercel KV** (Redis) for caching AI results
- Server-side only (never expose API keys to client)

### 2.4 Authentication & Authorization
- **Supabase Auth** with `@supabase/auth-helpers-nextjs`
- Providers: Email/password (+ Google OAuth optional)
- Row Level Security (RLS) policies for automatic data isolation
- Server-side session validation via middleware

### 2.5 Drag-and-Drop
- **@dnd-kit/core** - Modern, accessible, performant
- Built-in keyboard navigation support
- Smooth animations with `@dnd-kit/sortable`

### 2.6 Validation & Type Safety
- **Zod** for runtime validation
- Shared schemas between client and server
- **react-hook-form** with Zod resolver for forms

### 2.7 Monitoring & Observability
- **Sentry** for error tracking and performance monitoring
- **Vercel Analytics** for web vitals
- Structured logging with custom logger utility

### 2.8 Testing
- **Vitest** for unit and integration tests
- **Playwright** for E2E testing
- **Testing Library** for component tests
- **axe-core** for accessibility testing

---

## 3. Data Model Design

### 3.1 Simplified Schema (Single User)

> **Key Change:** Removed `Workspace` entity. All data belongs directly to `userId`.

#### Core Entities

**1. User** (managed by Supabase Auth)
```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String?
  avatarUrl     String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  projects      Project[]
  columns       Column[]
  tags          Tag[]
  aiRecommendations AIRecommendation[]
}
```

**2. Project (P)**
```prisma
model Project {
  id            String    @id @default(uuid())
  userId        String
  name          String
  description   String?
  status        ProjectStatus @default(ACTIVE) // ACTIVE, ARCHIVED
  sortOrder     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  archivedAt    DateTime?

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  milestones    Milestone[]

  @@index([userId, status])
  @@index([userId, sortOrder])
}

enum ProjectStatus {
  ACTIVE
  ARCHIVED
}
```

**3. Milestone (M)**
```prisma
model Milestone {
  id                    String    @id @default(uuid())
  projectId             String
  name                  String
  description           String?
  value                 Priority  @default(MEDIUM)
  urgency               Priority  @default(MEDIUM)
  effort                Effort    @default(MEDIUM)
  statusColumnId        String
  priorityScore         Float?    // Set by AI
  dependsOnMilestoneId  String?
  sortOrder             Int       @default(0)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  project               Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  statusColumn          Column    @relation("MilestoneColumn", fields: [statusColumnId], references: [id])
  dependsOnMilestone    Milestone? @relation("MilestoneDependency", fields: [dependsOnMilestoneId], references: [id])
  blockedMilestones     Milestone[] @relation("MilestoneDependency")
  tasks                 Task[]

  @@index([projectId, statusColumnId])
  @@index([statusColumnId, sortOrder])
  @@index([priorityScore])
}
```

**4. Task (Subtask, sb)**
```prisma
model Task {
  id                String    @id @default(uuid())
  milestoneId       String
  name              String
  description       String?
  value             Priority  @default(MEDIUM)
  urgency           Priority  @default(MEDIUM)
  effort            Effort    @default(SMALL)
  statusColumnId    String
  priorityScore     Float?
  dependsOnTaskId   String?
  completedAt       DateTime?
  sortOrder         Int       @default(0)
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  milestone         Milestone @relation(fields: [milestoneId], references: [id], onDelete: Cascade)
  statusColumn      Column    @relation("TaskColumn", fields: [statusColumnId], references: [id])
  dependsOnTask     Task?     @relation("TaskDependency", fields: [dependsOnTaskId], references: [id])
  blockedTasks      Task[]    @relation("TaskDependency")
  tags              TaskTag[]

  @@index([milestoneId, statusColumnId])
  @@index([statusColumnId, sortOrder])
  @@index([priorityScore])
  @@index([completedAt])
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum Effort {
  SMALL   // S
  MEDIUM  // M
  LARGE   // L
}
```

**5. Column (Kanban Column)**
```prisma
model Column {
  id          String    @id @default(uuid())
  userId      String
  name        String    // Display name
  key         ColumnKey @unique // System key
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  milestones  Milestone[] @relation("MilestoneColumn")
  tasks       Task[]    @relation("TaskColumn")

  @@index([userId, sortOrder])
}

enum ColumnKey {
  PROJECTS
  BACKLOG
  WORKING
  READY_TEST
  AGENT_TESTING
  DEPLOYED_TESTING
  COMPLETED
}
```

**6. Tag**
```prisma
model Tag {
  id          String    @id @default(uuid())
  userId      String
  name        String    // e.g., "#area:sales", "#type:module"
  color       String    @default("#3b82f6")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  taskTags    TaskTag[]

  @@unique([userId, name])
  @@index([userId])
}
```

**7. TaskTag (Many-to-Many)**
```prisma
model TaskTag {
  taskId      String
  tagId       String
  createdAt   DateTime  @default(now())

  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag         Tag       @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([taskId, tagId])
  @@index([tagId])
}
```

**8. AIRecommendation (Audit Log)**
```prisma
model AIRecommendation {
  id              String    @id @default(uuid())
  userId          String
  inputSnapshot   Json      // Tasks at time of analysis
  topTasks        Json      // [{taskId, score, reason}]
  suggestedMoves  Json      // [{itemId, fromColumn, toColumn, reason}]
  themes          Json      // [{name, description, taskIds}]
  promptVersion   String    // For A/B testing prompts
  tokensUsed      Int
  durationMs      Int
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

### 3.2 Row Level Security (RLS) Policies

> **Critical:** Enable RLS on all tables in Supabase dashboard

**Policy Examples:**
```sql
-- Projects: Users can only see their own
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Similar policies for Milestone, Task, Column, Tag, etc.
```

---

## 4. Next.js App Architecture

### 4.1 Directory Structure

```
kanban/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing/dashboard
│   ├── error.tsx                  # Global error boundary
│   ├── loading.tsx                # Global loading state
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx             # Auth-specific layout
│   ├── (dashboard)/               # Protected routes group
│   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   ├── board/
│   │   │   ├── page.tsx           # Main Kanban board
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx           # Projects list
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx       # Project detail
│   │   │       └── loading.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── api/
│       ├── projects/
│       │   ├── route.ts           # POST, GET
│       │   └── [id]/
│       │       └── route.ts       # GET, PATCH, DELETE
│       ├── milestones/
│       │   ├── route.ts
│       │   └── [id]/
│       │       └── route.ts
│       ├── tasks/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── tags/
│       │           └── route.ts
│       ├── columns/
│       │   └── route.ts
│       ├── tags/
│       │   └── route.ts
│       └── ai/
│           ├── prioritize/
│           │   └── route.ts       # Main AI prioritization
│           ├── generate-subtasks/
│           │   └── route.ts
│           └── enhance-description/
│               └── route.ts
│
├── components/
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── board/
│   │   ├── kanban-board.tsx
│   │   ├── kanban-column.tsx
│   │   ├── kanban-card.tsx
│   │   ├── card-milestone.tsx
│   │   ├── card-task.tsx
│   │   └── board-filters.tsx
│   ├── projects/
│   │   ├── project-list.tsx
│   │   ├── project-card.tsx
│   │   └── project-form.tsx
│   ├── tasks/
│   │   ├── task-detail-modal.tsx
│   │   ├── task-form.tsx
│   │   └── task-dependencies.tsx
│   ├── ai/
│   │   ├── ai-panel.tsx
│   │   ├── ai-recommendations.tsx
│   │   ├── ai-themes.tsx
│   │   └── ai-loading.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── top-bar.tsx
│   │   └── user-menu.tsx
│   └── shared/
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       └── error-message.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Client-side Supabase
│   │   ├── server.ts              # Server-side Supabase
│   │   └── middleware.ts          # Auth middleware
│   ├── prisma/
│   │   ├── client.ts              # Prisma client singleton
│   │   └── seed.ts                # Database seeding
│   ├── ai/
│   │   ├── openai.ts              # OpenAI client wrapper
│   │   ├── prompts.ts             # Versioned prompts
│   │   ├── parsers.ts             # Response parsers with Zod
│   │   └── cache.ts               # AI result caching
│   ├── validations/
│   │   ├── project.ts             # Zod schemas
│   │   ├── milestone.ts
│   │   ├── task.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── format.ts              # Date, number formatting
│   │   ├── priority.ts            # Priority calculations
│   │   └── logger.ts              # Structured logging
│   └── constants.ts               # App-wide constants
│
├── hooks/
│   ├── use-board-data.ts          # TanStack Query hooks
│   ├── use-projects.ts
│   ├── use-tasks.ts
│   ├── use-drag-drop.ts
│   ├── use-keyboard-shortcuts.ts
│   └── use-ai-recommendations.ts
│
├── types/
│   ├── database.ts                # Generated from Supabase
│   ├── api.ts                     # API request/response types
│   └── index.ts
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│       └── playwright.config.ts
│
├── middleware.ts                  # Next.js middleware for auth
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example
└── package.json
```

### 4.2 Key Architectural Patterns

**Server Components by Default**
- Use React Server Components for data fetching
- Client components only when needed (interactivity, hooks, browser APIs)

**API Route Organization**
- RESTful conventions
- Consistent error responses
- Input validation with Zod
- Rate limiting on AI endpoints

**Data Fetching Strategy**
- Server components: Direct Prisma queries
- Client components: TanStack Query hooks
- Optimistic updates for drag-and-drop

---

## 5. Kanban Board UI Design

### 5.1 Board Layout

```tsx
<KanbanBoard>
  <BoardHeader>
    <Filters />
    <SearchBar />
    <AIButton />
  </BoardHeader>

  <BoardColumns>
    {columns.map(column => (
      <KanbanColumn key={column.id} column={column}>
        {/* Droppable area with cards */}
      </KanbanColumn>
    ))}
  </BoardColumns>

  <AISidebar isOpen={aiPanelOpen}>
    <AIRecommendations />
  </AISidebar>
</KanbanBoard>
```

### 5.2 Column Component

**Features:**
- Header with column name and card count
- Droppable area (using @dnd-kit)
- Scroll container for many cards
- Add card button

**Performance:**
- Virtual scrolling if >50 cards per column
- Memoized card components

### 5.3 Card Component

**Two variants:**

**MilestoneCard:**
- Title with (M) indicator
- Project name badge
- Tags
- Value/Urgency/Effort indicators
- Priority score (if set by AI)
- Subtask count (e.g., "3/7 complete")
- Expand/collapse button for subtasks
- Click → open detail modal
- Drag handle

**TaskCard:**
- Title with (sb) indicator
- Parent milestone (small text)
- Tags
- Value/Urgency/Effort indicators
- Priority score
- Completion checkbox
- Click → open detail modal
- Drag handle

### 5.4 Drag-and-Drop Implementation

```tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';

function Board() {
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    // Optimistic update
    updateLocalState(...);

    try {
      // API call to update statusColumnId and sortOrder
      await updateTaskColumn(active.id, over.id);
    } catch (error) {
      // Rollback on error
      revertLocalState();
      toast.error('Failed to move card');
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* Columns with SortableContext */}
    </DndContext>
  );
}
```

### 5.5 Filters & Views

**Filter controls:**
- Project selector (multi-select)
- Tag selector (multi-select)
- Value filter (HIGH/MEDIUM/LOW)
- Item type toggle (Show Milestones / Subtasks / Both)
- Completion filter (Hide completed)

**Saved views:**
- Ability to save filter combinations
- Quick switcher between views

### 5.6 Keyboard Shortcuts

- `N` - New task/milestone
- `P` - New project
- `A` - Toggle AI panel
- `F` - Focus filters
- `/` - Focus search
- `Esc` - Close modals/panels
- Arrow keys - Navigate cards (when focused)
- Enter - Open card detail
- Space - Grab/drop card (keyboard drag-and-drop)

---

## 6. Task & Project Detail Views

### 6.1 Task Detail Modal

**Layout:** Full-screen on mobile, large centered modal on desktop

**Sections:**
1. **Header**
   - Title (editable inline)
   - Type badge (Subtask)
   - Close button
   - Delete button (with confirmation)

2. **Metadata**
   - Parent milestone (link)
   - Current column (with quick-change dropdown)
   - Created/updated timestamps

3. **Priority Fields**
   - Value dropdown (HIGH/MEDIUM/LOW)
   - Urgency dropdown
   - Effort dropdown (S/M/L)
   - Priority score (read-only, set by AI)

4. **Description**
   - Rich text editor (markdown-based)
   - AI assist button: "Enhance this description"

5. **Dependencies**
   - "Depends on" task selector
   - "Blocks" list (auto-populated)

6. **Tags**
   - Tag selector with color coding
   - Create new tag inline

7. **AI Actions**
   - "Ask AI: Is this task ready to start?"
   - "Ask AI: Break this into smaller tasks"

8. **Activity Log** (future)
   - History of changes

### 6.2 Milestone Detail Modal

Similar to Task detail, plus:

**Additional sections:**
1. **Subtasks List**
   - Inline list with checkboxes
   - Add new subtask button
   - Reorder subtasks (drag handles)
   - Click subtask → opens its detail modal

2. **Progress Indicator**
   - Progress bar (completed/total)
   - Metrics: % complete, days active

3. **AI Actions**
   - "Generate subtasks for this milestone"
   - "Suggest priority order for subtasks"

### 6.3 Project Detail Page

**Full page view with tabs:**

**Overview Tab:**
- Project description (editable)
- Status (Active/Archived toggle)
- Creation date
- AI-generated summary: "This project is X% complete with Y pending tasks. Key blocker: Z."

**Milestones Tab:**
- List of all milestones
- Progress for each
- Quick status change
- Add milestone button

**Metrics Tab:**
- Total tasks: count by status
- Completion rate over time (chart)
- Average time in each column
- Value distribution

**AI Insights Tab:**
- "What should we prioritize next in this project?"
- AI-generated risk assessment
- Suggested next 3 tasks

---

## 7. AI Features — Flows & Prompts

### 7.1 AI Prioritization Flow

**Trigger:** User clicks "AI Prioritize" button on board

**Steps:**

1. **Client → Server Request**
   ```typescript
   POST /api/ai/prioritize
   Body: {
     maxResults: 10,
     includeReasons: true
   }
   ```

2. **Server-Side Processing**
   ```typescript
   // Fetch all active tasks/milestones for user
   const snapshot = await fetchBoardSnapshot(userId);

   // Build prompt with versioned template
   const prompt = buildPrioritizationPrompt(snapshot, PROMPT_V2);

   // Call OpenAI with streaming
   const stream = await openai.chat.completions.create({
     model: 'gpt-4-turbo',
     messages: [
       { role: 'system', content: SYSTEM_PROMPT },
       { role: 'user', content: prompt }
     ],
     response_format: { type: 'json_object' },
     stream: true
   });

   // Parse and validate response with Zod
   const result = aiResponseSchema.parse(parsedResponse);

   // Cache result in Vercel KV (1 hour TTL)
   await cache.set(`ai:prioritize:${userId}`, result, 3600);

   // Save to database for audit
   await prisma.aiRecommendation.create({
     data: {
       userId,
       inputSnapshot: snapshot,
       topTasks: result.topSubtasks,
       suggestedMoves: result.moves,
       themes: result.themes,
       promptVersion: 'v2',
       tokensUsed: usage.total_tokens,
       durationMs: Date.now() - startTime
     }
   });

   return result;
   ```

3. **Client Displays Results**
   - AI panel slides in from right
   - Three sections:
     - Top Tasks (ordered list with reasons)
     - Suggested Moves (with Apply/Dismiss buttons)
     - Thematic Streams (collapsible groups)

### 7.2 AI Prompt Structure

**System Prompt:**
```
You are an AI project management assistant for a kanban board system.

The user manages Projects (P) containing Milestones (M) containing Subtasks (sb).

Your role is to:
1. Analyze all tasks and group them into 5-8 thematic streams
2. Prioritize subtasks for maximum business impact
3. Suggest optimal column placement based on dependencies and readiness

Prioritization Rules:
1. Revenue-generating tasks first (value=HIGH, area=sales)
2. Unblocking tasks (tasks that other high-value tasks depend on)
3. Quick wins (value=HIGH, effort=SMALL)
4. Tasks with external deadlines or urgency=HIGH
5. Everything else by value/effort ratio

Always provide clear, actionable reasoning for each recommendation.

Output must be valid JSON matching this schema:
{
  "themes": [
    {
      "name": string,
      "description": string,
      "taskIds": string[],
      "totalValue": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "topSubtasks": [
    {
      "taskId": string,
      "priorityScore": number (0-100),
      "reason": string (max 100 chars)
    }
  ],
  "moves": [
    {
      "itemId": string,
      "itemType": "milestone" | "task",
      "fromColumn": string,
      "toColumn": string,
      "reason": string
    }
  ]
}
```

**User Prompt Template:**
```
Current board state:

Projects: {{projects.length}}
{{#each projects}}
- [P] {{name}}: {{milestones.length}} milestones, {{status}}
{{/each}}

Milestones: {{milestones.length}}
{{#each milestones}}
- [M] {{name}}
  Project: {{project.name}}
  Column: {{statusColumn.name}}
  Value: {{value}}, Urgency: {{urgency}}, Effort: {{effort}}
  Subtasks: {{tasks.length}} ({{completedCount}} done)
  {{#if dependsOnMilestoneId}}Depends on: {{dependsOnMilestone.name}}{{/if}}
{{/each}}

Subtasks: {{tasks.length}}
{{#each tasks}}
- [sb] {{name}}
  Milestone: {{milestone.name}}
  Column: {{statusColumn.name}}
  Value: {{value}}, Urgency: {{urgency}}, Effort: {{effort}}
  Tags: {{tags}}
  {{#if dependsOnTaskId}}Depends on: {{dependsOnTask.name}}{{/if}}
  {{#if completedAt}}Completed: {{completedAt}}{{/if}}
{{/each}}

Analyze this board and provide:
1. Thematic groupings (5-8 themes)
2. Top {{maxResults}} subtasks to work on next
3. Suggested column moves for better workflow

Consider dependencies, business value, and effort when prioritizing.
```

### 7.3 AI Response Validation

```typescript
import { z } from 'zod';

const aiResponseSchema = z.object({
  themes: z.array(z.object({
    name: z.string(),
    description: z.string(),
    taskIds: z.array(z.string()),
    totalValue: z.enum(['HIGH', 'MEDIUM', 'LOW'])
  })).min(3).max(8),

  topSubtasks: z.array(z.object({
    taskId: z.string().uuid(),
    priorityScore: z.number().min(0).max(100),
    reason: z.string().max(100)
  })).max(20),

  moves: z.array(z.object({
    itemId: z.string().uuid(),
    itemType: z.enum(['milestone', 'task']),
    fromColumn: z.string(),
    toColumn: z.enum(['BACKLOG', 'WORKING', 'READY_TEST', 'AGENT_TESTING', 'DEPLOYED_TESTING', 'COMPLETED']),
    reason: z.string()
  }))
});

// Validate and sanitize before using
const validated = aiResponseSchema.parse(aiResponse);

// Verify all taskIds exist in user's data
const validTaskIds = new Set(userTasks.map(t => t.id));
validated.topSubtasks = validated.topSubtasks.filter(
  t => validTaskIds.has(t.taskId)
);
```

### 7.4 Other AI Endpoints

**Generate Subtasks:**
```typescript
POST /api/ai/generate-subtasks
Body: {
  milestoneId: string,
  milestoneContext: {
    name: string,
    description: string,
    project: string
  }
}

Response: {
  suggestedSubtasks: [
    { name: string, description: string, effort: Effort },
    ...
  ]
}
```

**Enhance Description:**
```typescript
POST /api/ai/enhance-description
Body: {
  taskId: string,
  currentDescription: string,
  context: string  // milestone + project info
}

Response: {
  enhancedDescription: string,
  suggestions: string[]
}
```

### 7.5 AI Cost Management

**Strategies:**
- Cache results for 1 hour per user
- Rate limit: 10 AI calls per hour per user (Vercel Edge Config)
- Token budget: Truncate input if >4000 tokens
- Model selection: Use `gpt-4o-mini` for simple tasks, `gpt-4-turbo` for prioritization
- Monitoring: Log token usage per request, alert if daily spend >$X

---

## 8. Authentication & Authorization

### 8.1 Supabase Auth Setup

**Installation:**
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...  # Server-side only
```

**Client Setup:**
```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () => createClientComponentClient();
```

**Server Setup:**
```typescript
// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createClient = () => {
  return createServerComponentClient({ cookies });
};
```

### 8.2 Authentication Flow

**Sign Up:**
```typescript
// app/(auth)/register/page.tsx
const handleSignUp = async (email: string, password: string, name: string) => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }  // Stored in user_metadata
    }
  });

  if (error) throw error;

  // Send email verification
  // Redirect to email confirmation page
};
```

**Sign In:**
```typescript
const handleSignIn = async (email: string, password: string) => {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  router.push('/board');
};
```

**OAuth (Optional):**
```typescript
const handleGoogleSignIn = async () => {
  const supabase = createClient();

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${location.origin}/auth/callback`
    }
  });
};
```

### 8.3 Middleware for Protected Routes

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated
  if (!session && req.nextUrl.pathname.startsWith('/board')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect to board if already authenticated and trying to access login
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/board', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/board/:path*', '/projects/:path*', '/settings/:path*', '/login', '/register']
};
```

### 8.4 Row Level Security (RLS) Policies

**Enable RLS in Supabase Dashboard for all tables**

**Example Policy (Projects table):**
```sql
-- Allow users to view only their own projects
CREATE POLICY "Users can view own projects"
ON projects FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert projects for themselves
CREATE POLICY "Users can create own projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own projects
CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own projects
CREATE POLICY "Users can delete own projects"
ON projects FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**Apply similar policies to:**
- milestones
- tasks
- columns
- tags
- task_tags
- ai_recommendations

### 8.5 API Route Authorization

```typescript
// Example: app/api/tasks/[id]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  // Get authenticated user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Validate input
  const body = await req.json();
  const validated = updateTaskSchema.parse(body);

  // Update task (RLS automatically filters by userId)
  const { data, error } = await supabase
    .from('tasks')
    .update(validated)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests (Vitest)

**Test Coverage Goals:**
- Utilities: 100%
- Validation schemas: 100%
- React hooks: >90%
- Components: >80%

**Example Test:**
```typescript
// lib/utils/priority.test.ts
import { describe, it, expect } from 'vitest';
import { calculatePriorityScore } from './priority';

describe('calculatePriorityScore', () => {
  it('should return high score for HIGH value, HIGH urgency, SMALL effort', () => {
    const score = calculatePriorityScore({
      value: 'HIGH',
      urgency: 'HIGH',
      effort: 'SMALL'
    });
    expect(score).toBeGreaterThan(80);
  });

  it('should return low score for LOW value, LOW urgency, LARGE effort', () => {
    const score = calculatePriorityScore({
      value: 'LOW',
      urgency: 'LOW',
      effort: 'LARGE'
    });
    expect(score).toBeLessThan(30);
  });
});
```

**Component Test:**
```typescript
// components/board/kanban-card.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KanbanCard } from './kanban-card';

describe('KanbanCard', () => {
  it('should render task title and metadata', () => {
    const task = {
      id: '1',
      name: 'Test Task',
      value: 'HIGH',
      urgency: 'MEDIUM',
      effort: 'SMALL'
    };

    render(<KanbanCard task={task} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });
});
```

### 9.2 Integration Tests (Playwright for API Routes)

**Test API endpoints:**
```typescript
// tests/integration/api/tasks.test.ts
import { test, expect } from '@playwright/test';

test.describe('Tasks API', () => {
  test('should create a new task', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: {
        name: 'New Task',
        milestoneId: 'milestone-123',
        value: 'HIGH',
        urgency: 'MEDIUM',
        effort: 'SMALL'
      },
      headers: {
        'Authorization': `Bearer ${process.env.TEST_USER_TOKEN}`
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.name).toBe('New Task');
  });

  test('should return 401 without auth', async ({ request }) => {
    const response = await request.post('/api/tasks', {
      data: { name: 'Test' }
    });

    expect(response.status()).toBe(401);
  });
});
```

### 9.3 E2E Tests (Playwright)

**Critical user flows:**
1. Sign up and onboarding
2. Create project → milestone → task
3. Drag-and-drop task between columns
4. Use AI prioritization
5. Edit task details
6. Filter and search

**Example E2E Test:**
```typescript
// tests/e2e/board.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/board');
  });

  test('should drag task between columns', async ({ page }) => {
    const taskCard = page.locator('[data-testid="task-card-1"]');
    const targetColumn = page.locator('[data-testid="column-WORKING"]');

    // Drag and drop
    await taskCard.dragTo(targetColumn);

    // Verify task moved
    await expect(targetColumn.locator('[data-testid="task-card-1"]')).toBeVisible();
  });

  test('should open AI panel and display recommendations', async ({ page }) => {
    await page.click('button[data-testid="ai-prioritize-btn"]');

    await expect(page.locator('[data-testid="ai-panel"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-tasks-list"]')).toBeVisible();
  });
});
```

### 9.4 Accessibility Tests

```typescript
// tests/a11y/board.test.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('board page should not have accessibility violations', async ({ page }) => {
    await page.goto('/board');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### 9.5 Test Database Setup

**Separate Supabase project for tests:**
- Create `kanban-test` project in Supabase
- Run migrations
- Seed with test data

**Seed Script:**
```typescript
// lib/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  const user = await prisma.user.create({
    data: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    }
  });

  const columns = await prisma.column.createMany({
    data: [
      { userId: user.id, name: 'Projects', key: 'PROJECTS', sortOrder: 0 },
      { userId: user.id, name: 'Backlog', key: 'BACKLOG', sortOrder: 1 },
      { userId: user.id, name: 'Working', key: 'WORKING', sortOrder: 2 },
      // ... etc
    ]
  });

  // Create test projects, milestones, tasks
}

seed()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
```

---

## 10. Security & Performance

### 10.1 Security Measures

**Input Validation:**
- Zod schemas for all API inputs
- Sanitize user-generated content before rendering
- Prevent XSS with proper escaping

**Rate Limiting:**
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimitAI = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),  // 10 requests per hour
  analytics: true,
});

export const rateLimitAPI = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),  // 100 requests per minute
});

// Usage in API route
export async function POST(req: Request) {
  const userId = await getUserId(req);
  const { success } = await rateLimitAI.limit(userId);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429 }
    );
  }

  // ... continue
}
```

**CSRF Protection:**
- Built into Next.js for POST/PUT/DELETE
- Verify via `next.config.js` if needed

**Content Security Policy:**
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co https://api.openai.com;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

**Secret Management:**
- Store all secrets in Vercel environment variables
- Never commit `.env.local` to git
- Use different API keys per environment

**Dependency Security:**
```bash
# Regular audits
npm audit
npm audit fix

# Automated updates with Dependabot (GitHub)
```

### 10.2 Performance Optimizations

**Database Indexing:**
```prisma
// In schema.prisma
model Task {
  // ... fields

  @@index([milestoneId, statusColumnId])
  @@index([statusColumnId, sortOrder])
  @@index([priorityScore])
  @@index([completedAt])
}
```

**Query Optimization:**
```typescript
// Only select needed fields
const tasks = await prisma.task.findMany({
  where: { userId },
  select: {
    id: true,
    name: true,
    statusColumnId: true,
    sortOrder: true,
    // Exclude large text fields like description
  },
  orderBy: { sortOrder: 'asc' }
});
```

**Pagination:**
```typescript
// API route with cursor-based pagination
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor');
  const limit = 50;

  const tasks = await prisma.task.findMany({
    take: limit + 1,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
    orderBy: { createdAt: 'desc' }
  });

  const hasMore = tasks.length > limit;
  if (hasMore) tasks.pop();

  return NextResponse.json({
    tasks,
    nextCursor: hasMore ? tasks[tasks.length - 1].id : null
  });
}
```

**Optimistic Updates:**
```typescript
// Using TanStack Query
const { mutate } = useMutation({
  mutationFn: updateTaskColumn,
  onMutate: async (newTask) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['tasks'] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['tasks']);

    // Optimistically update
    queryClient.setQueryData(['tasks'], (old) => {
      return old.map(t => t.id === newTask.id ? newTask : t);
    });

    return { previous };
  },
  onError: (err, newTask, context) => {
    // Rollback on error
    queryClient.setQueryData(['tasks'], context.previous);
  },
  onSettled: () => {
    // Refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }
});
```

**Image Optimization:**
```tsx
import Image from 'next/image';

<Image
  src={user.avatarUrl}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
/>
```

**Code Splitting:**
```tsx
// Lazy load heavy components
import dynamic from 'next/dynamic';

const AIPanel = dynamic(() => import('@/components/ai/ai-panel'), {
  loading: () => <AIPanelSkeleton />,
  ssr: false  // Client-only if needed
});
```

**Caching Strategy:**
```typescript
// API route with cache headers
export async function GET(req: Request) {
  const data = await fetchData();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=600'
    }
  });
}
```

**Bundle Analysis:**
```bash
# Install analyzer
npm install @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

---

## 11. Implementation Phases

### Phase 0 — DevOps & Environment Setup (3 days)

**Goals:**
- Set up development workflow
- Configure deployment pipeline
- Prepare infrastructure

**Tasks:**
1. Create GitHub repository
2. Set up Vercel project (link to GitHub repo)
3. Create 3 Supabase projects:
   - `kanban-local` (for local dev with Docker)
   - `kanban-staging` (for preview deployments)
   - `kanban-production` (for prod)
4. Configure Vercel environment variables for each environment
5. Set up GitHub Actions for CI/CD:
   - Workflow for tests on PR
   - Auto-deploy to staging on merge to `main`
6. Install and configure:
   - ESLint with Next.js config
   - Prettier
   - Husky for pre-commit hooks
   - lint-staged
7. Set up Sentry project for error monitoring
8. Create `.env.local.example` template
9. Write initial `README.md` with setup instructions

**Deliverables:**
- Working CI/CD pipeline
- All environments configured
- Code quality tools in place

---

### Phase 1 — Project Foundation & Authentication (1 week)

**Goals:**
- Bootstrap Next.js application
- Implement authentication
- Set up database schema
- Create basic layout

**Tasks:**

**Day 1-2: Project Initialization**
1. Initialize Next.js 15 project with TypeScript
   ```bash
   npx create-next-app@latest kanban --typescript --tailwind --app
   ```
2. Install core dependencies:
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install @prisma/client prisma
   npm install @tanstack/react-query
   npm install zod react-hook-form @hookform/resolvers
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   npm install lucide-react  # Icons
   npm install date-fns  # Date utilities
   ```
3. Install dev dependencies:
   ```bash
   npm install -D @types/node @types/react @types/react-dom
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
   npm install -D playwright @playwright/test
   npm install -D @axe-core/playwright
   npm install -D eslint-config-prettier
   ```
4. Configure Tailwind with custom theme (colors, spacing)
5. Set up shadcn/ui:
   ```bash
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card dialog input label select textarea
   ```

**Day 3-4: Database Schema**
1. Initialize Prisma:
   ```bash
   npx prisma init
   ```
2. Write complete `schema.prisma` (from Section 3)
3. Connect to Supabase PostgreSQL
4. Run initial migration:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```
6. Write seed script for development data
7. Enable RLS policies in Supabase dashboard

**Day 5-6: Authentication**
1. Create Supabase client utilities (`lib/supabase/client.ts`, `lib/supabase/server.ts`)
2. Implement middleware for route protection
3. Create auth pages:
   - `/app/(auth)/login/page.tsx`
   - `/app/(auth)/register/page.tsx`
   - `/app/(auth)/forgot-password/page.tsx`
4. Build auth forms with validation (Zod schemas)
5. Implement sign up, sign in, sign out flows
6. Add OAuth with Google (optional)
7. Test auth flow end-to-end

**Day 7: Layout & Navigation**
1. Create root layout with providers (TanStack Query, Supabase)
2. Build dashboard layout:
   - Sidebar with navigation
   - Top bar with user menu
3. Create placeholder pages:
   - `/app/(dashboard)/board/page.tsx`
   - `/app/(dashboard)/projects/page.tsx`
   - `/app/(dashboard)/settings/page.tsx`
4. Add loading and error boundaries
5. Implement responsive design (mobile-first)

**Deliverables:**
- Working authentication system
- Database schema deployed
- Basic app layout and navigation

**Tests to Write:**
- Auth flow E2E tests
- Middleware unit tests

---

### Phase 1.5 — Testing Infrastructure (3-4 days)

**Goals:**
- Set up comprehensive testing framework
- Write initial test suite
- Achieve baseline coverage

**Tasks:**

**Day 1: Test Configuration**
1. Configure Vitest:
   ```typescript
   // vitest.config.ts
   export default defineConfig({
     test: {
       environment: 'jsdom',
       setupFiles: ['./tests/setup.ts'],
       coverage: {
         provider: 'v8',
         reporter: ['text', 'html'],
         exclude: ['node_modules/', 'tests/']
       }
     }
   });
   ```
2. Configure Playwright:
   ```bash
   npx playwright install
   ```
3. Set up test database (Supabase test project)
4. Create test utilities and fixtures

**Day 2-3: Write Tests**
1. Unit tests for:
   - Validation schemas (Zod)
   - Utility functions
   - Custom hooks
2. Integration tests for:
   - API routes (mock Supabase)
3. E2E tests for:
   - Authentication flow
   - Navigation
4. Component tests for:
   - Auth forms
   - Layout components

**Day 4: CI Integration**
1. Add test step to GitHub Actions
2. Configure test coverage reporting
3. Set up Playwright in CI (with caching)
4. Add status badges to README

**Deliverables:**
- 80%+ test coverage on critical paths
- Automated tests in CI pipeline
- Test documentation

---

### Phase 2 — Core Data CRUD (1 week)

**Goals:**
- Implement API routes for all entities
- Build forms for creating/editing
- Display data in UI

**Tasks:**

**Day 1-2: Validation Schemas**
1. Write Zod schemas for all entities:
   - `lib/validations/project.ts`
   - `lib/validations/milestone.ts`
   - `lib/validations/task.ts`
   - `lib/validations/tag.ts`
2. Export TypeScript types from schemas
3. Write unit tests for schemas

**Day 3-4: API Routes**
1. Implement Project API:
   - `POST /api/projects` - Create
   - `GET /api/projects` - List
   - `GET /api/projects/[id]` - Get one
   - `PATCH /api/projects/[id]` - Update
   - `DELETE /api/projects/[id]` - Delete
2. Implement Milestone API (same CRUD)
3. Implement Task API (same CRUD + subtask operations)
4. Implement Column API (list, reorder)
5. Implement Tag API (CRUD)
6. Add error handling and logging to all routes
7. Add input validation with Zod
8. Test all endpoints with Playwright

**Day 5-6: UI for Projects**
1. Build Projects page:
   - List view with cards
   - Empty state
   - Create button
2. Build Project form modal:
   - Name, description fields
   - Submit handler with TanStack Query mutation
3. Build Project detail page:
   - Display milestones
   - Add milestone button
4. Implement TanStack Query hooks:
   - `useProjects()`
   - `useProject(id)`
   - `useCreateProject()`
   - `useUpdateProject()`
   - `useDeleteProject()`

**Day 7: Column Initialization**
1. Create migration to seed default columns for users
2. Build Column management UI (settings page)
3. Allow renaming columns (but not keys)

**Deliverables:**
- Full CRUD for Projects, Milestones, Tasks, Tags
- Working forms and validation
- Tests for all API routes

---

### Phase 3 — Kanban Board & Drag-and-Drop (1 week)

**Goals:**
- Build functional Kanban board
- Implement drag-and-drop
- Add filters and search

**Tasks:**

**Day 1-2: Board Layout**
1. Create `KanbanBoard` component:
   - Fetch all columns, milestones, tasks
   - Horizontal scroll container
2. Create `KanbanColumn` component:
   - Column header (name, count)
   - Droppable area with @dnd-kit
   - Add card button
3. Create `KanbanCard` component:
   - Two variants: MilestoneCard, TaskCard
   - Display metadata (value, urgency, effort)
   - Drag handle
   - Click to open detail modal
4. Style with Tailwind (professional, clean design)
5. Add loading skeletons

**Day 3-4: Drag-and-Drop**
1. Set up DndContext in `KanbanBoard`
2. Make columns Droppable with `useDroppable`
3. Make cards Draggable with `useDraggable`
4. Implement `onDragEnd` handler:
   - Update local state optimistically
   - Call API to update `statusColumnId` and `sortOrder`
   - Handle errors with rollback
5. Add drag overlay (card preview while dragging)
6. Add smooth animations
7. Implement keyboard drag-and-drop (Space to grab/drop)
8. Test accessibility with screen reader

**Day 5: Collapsible Subtasks**
1. Add expand/collapse button to MilestoneCard
2. When expanded, fetch and render subtasks inline
3. Subtasks are also draggable
4. Update sortOrder within milestone

**Day 6-7: Filters & Search**
1. Build `BoardFilters` component:
   - Project multi-select
   - Tag multi-select
   - Value filter
   - Item type toggle
   - Hide completed checkbox
2. Implement filter logic (client-side for MVP)
3. Add search bar (fuzzy search by task/milestone name)
4. Add "Clear filters" button
5. Persist filters to localStorage

**Deliverables:**
- Fully functional Kanban board
- Smooth drag-and-drop experience
- Working filters and search
- E2E test for drag-and-drop

---

### Phase 4 — AI Integration (1.5 weeks)

**Goals:**
- Implement AI prioritization endpoint
- Build AI panel UI
- Add AI-powered features

**Tasks:**

**Day 1-2: OpenAI Setup**
1. Install OpenAI SDK:
   ```bash
   npm install openai
   ```
2. Create OpenAI client wrapper (`lib/ai/openai.ts`)
3. Write prompt templates (`lib/ai/prompts.ts`):
   - System prompt (from Section 7.2)
   - User prompt template with Handlebars or template literals
4. Create prompt versioning system
5. Add environment variable `OPENAI_API_KEY`

**Day 3-5: AI Prioritization Endpoint**
1. Implement `POST /api/ai/prioritize`:
   - Fetch user's entire board state (projects, milestones, tasks)
   - Build prompt from template
   - Call OpenAI API with streaming
   - Parse JSON response
   - Validate with Zod schema (from Section 7.3)
   - Verify task IDs exist and belong to user
   - Save result to `AIRecommendation` table
   - Cache result in Vercel KV (1 hour TTL)
   - Return sanitized response
2. Add error handling:
   - OpenAI API errors
   - Invalid JSON responses
   - Rate limits
3. Add rate limiting (10 calls/hour per user)
4. Log token usage and duration to Sentry
5. Write integration tests (mock OpenAI)

**Day 6-7: AI Panel UI**
1. Create `AIPanel` component:
   - Slide-in drawer from right
   - Three sections: Top Tasks, Suggested Moves, Themes
2. Create `AIRecommendations` component:
   - Display top tasks as ordered list
   - Show priority score and reason
   - Click task → scroll to and highlight on board
3. Create `AISuggestedMoves` component:
   - Display suggested moves as cards
   - "Apply" button → makes API call to move task
   - "Dismiss" button → remove suggestion
4. Create `AIThemes` component:
   - Collapsible sections by theme
   - List of tasks in each theme
   - Color coding by value
5. Add loading state during AI call (skeleton + progress indicator)
6. Add error state with retry button

**Day 8-9: AI Button & Workflow**
1. Add "AI Prioritize" button to board header
2. Implement click handler:
   - Show loading state
   - Call `/api/ai/prioritize`
   - Open AI panel with results
   - Handle errors gracefully
3. Add keyboard shortcut (A)
4. Cache result for 1 hour (show "Refresh" button after expiry)
5. Add user feedback mechanism:
   - Thumbs up/down on suggestions
   - Store feedback in database for future prompt improvements
6. Write E2E test for AI flow

**Day 10: Additional AI Endpoints**
1. Implement `POST /api/ai/generate-subtasks`:
   - Takes milestone context
   - Returns suggested subtasks
2. Implement `POST /api/ai/enhance-description`:
   - Takes task description
   - Returns enhanced version
3. Add UI buttons in detail modals
4. Test both endpoints

**Deliverables:**
- Working AI prioritization feature
- Polished AI panel UI
- AI-powered subtask generation
- Comprehensive error handling
- Tests for AI endpoints

---

### Phase 5 — Detail Views & Task Management (4-5 days)

**Goals:**
- Build task/milestone detail modals
- Implement rich editing features
- Add dependencies and tags

**Tasks:**

**Day 1-2: Task Detail Modal**
1. Create `TaskDetailModal` component:
   - Full-screen on mobile, modal on desktop
   - Sections: header, metadata, description, dependencies, tags
2. Implement inline editing:
   - Title (editable on click)
   - Value/urgency/effort dropdowns
   - Status column dropdown (quick move)
3. Add rich text editor for description:
   - Use markdown (library: `react-markdown` + `@uiw/react-md-editor`)
   - Preview mode toggle
4. Add "AI Enhance Description" button
5. Add delete button with confirmation dialog
6. Add activity log (future: show edit history)

**Day 3: Dependencies & Tags**
1. Create `DependencySelector` component:
   - Combobox to search/select tasks
   - Display "Depends on" and "Blocks" lists
   - Visualize dependency chain (optional)
2. Create `TagSelector` component:
   - Multi-select with color indicators
   - Create new tag inline
   - Autocomplete from existing tags
3. Implement API for managing dependencies and tags
4. Add validation (prevent circular dependencies)

**Day 4: Milestone Detail Modal**
1. Extend task modal for milestones
2. Add subtasks section:
   - List with checkboxes
   - Add new subtask inline
   - Reorder with drag handles
   - Click → open task modal
3. Add progress indicator (% complete)
4. Add "AI Generate Subtasks" button

**Day 5: Polish & UX**
1. Add keyboard shortcuts within modals (Esc to close, Cmd+Enter to save)
2. Add autosave for description edits (debounced)
3. Add undo/redo for quick changes (Cmd+Z)
4. Add toast notifications for all actions
5. Add empty states (no dependencies, no tags, etc.)
6. Write E2E tests for modal workflows

**Deliverables:**
- Full-featured task/milestone editing
- Dependencies and tags working
- Polished UX with keyboard shortcuts
- Tests for detail views

---

### Phase 6 — Polish, Analytics & Production Prep (1 week)

**Goals:**
- Add analytics and insights
- Improve performance
- Prepare for production launch

**Tasks:**

**Day 1-2: Project Analytics**
1. Create metrics functions:
   - Tasks by column (count)
   - Completion rate over time
   - Average time in each column
   - Value distribution
2. Build analytics page/tab:
   - Charts with Recharts or Chart.js
   - Filterable by project and date range
3. Add AI insights:
   - "Ask AI: What should we focus on?"
   - Risk assessment (blocked tasks, overdue items)

**Day 3: Performance Optimization**
1. Run Lighthouse audit
2. Optimize images (ensure all use Next.js Image)
3. Add virtual scrolling to board columns (if needed)
4. Analyze bundle size:
   ```bash
   ANALYZE=true npm run build
   ```
5. Code-split heavy components (e.g., rich text editor)
6. Add service worker for offline support (optional)
7. Optimize database queries (add missing indexes)
8. Set up Redis caching for frequently accessed data

**Day 4: Keyboard Shortcuts & Accessibility**
1. Create keyboard shortcuts help modal (?)
2. Ensure all shortcuts work consistently
3. Run full accessibility audit with axe-core
4. Fix any WCAG violations
5. Test with screen reader (VoiceOver or NVDA)
6. Add skip links and focus indicators

**Day 5: Onboarding & Empty States**
1. Create first-time user onboarding flow:
   - Welcome modal
   - Product tour (react-joyride)
   - Sample project with tasks
2. Design beautiful empty states for:
   - No projects
   - Empty board
   - No AI recommendations yet
3. Add tooltips for complex features

**Day 6: Documentation & Settings**
1. Write user documentation (in-app help center)
2. Build settings page:
   - Profile (name, email, avatar)
   - Preferences (theme, notifications)
   - Danger zone (delete account)
3. Add export/import functionality:
   - Export board as JSON
   - Import from CSV
4. Add data backup feature (scheduled exports)

**Day 7: Final QA & Launch Prep**
1. Run full E2E test suite
2. Test on multiple browsers (Chrome, Firefox, Safari)
3. Test on mobile devices
4. Load test with realistic data (100+ tasks)
5. Review error monitoring (Sentry)
6. Set up Vercel Analytics
7. Write deployment checklist
8. Deploy to production!

**Deliverables:**
- Analytics and insights
- Optimized performance
- Accessible and polished UI
- Complete documentation
- Production-ready application

---

## 12. DevOps & Deployment

### 12.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npm run type-check

      - name: Run unit tests
        run: npm run test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Run E2E tests
        run: npx playwright test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}

      - name: Upload test coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  deploy-staging:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to Vercel Staging
        run: vercel deploy --token=${{ secrets.VERCEL_TOKEN }}
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### 12.2 Environment Variables

**Development (.env.local):**
```env
# Supabase (local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# OpenAI
OPENAI_API_KEY=sk-...

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Sentry
SENTRY_DSN=https://...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Staging (Vercel):**
- Same structure, but pointing to Supabase staging project
- Different API keys

**Production (Vercel):**
- Same structure, but pointing to Supabase production project
- Production API keys
- Add monitoring keys (Vercel Analytics, Sentry production)

### 12.3 Database Migrations

**Development workflow:**
```bash
# Make schema changes in prisma/schema.prisma

# Create migration
npx prisma migrate dev --name add_new_field

# This will:
# 1. Create migration SQL file
# 2. Apply to local DB
# 3. Regenerate Prisma client
```

**Production deployment:**
```bash
# In CI/CD or manually before deploy
npx prisma migrate deploy
```

**Supabase migration sync:**
```bash
# Pull Supabase schema to Prisma
npx prisma db pull

# Push Prisma schema to Supabase (careful!)
npx prisma db push
```

### 12.4 Vercel Configuration

```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],  // US East (closest to Supabase)
  "env": {
    "DATABASE_URL": "@database-url",
    "OPENAI_API_KEY": "@openai-api-key"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key"
    }
  }
}
```

### 12.5 Monitoring & Alerting

**Sentry Configuration:**
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**Alerts to configure:**
- Error rate >5% in 5 minutes → Slack notification
- AI API latency >10s → Slack notification
- Daily spend on OpenAI >$X → Email notification

---

## 13. Non-Functional Requirements

### 13.1 Performance Targets

- **Board load time:** <2 seconds (with 200 tasks)
- **AI prioritization:** <10 seconds (end-to-end)
- **Drag-and-drop latency:** <100ms (perceived)
- **API response time:** <500ms (p95)
- **First Contentful Paint:** <1.5s
- **Lighthouse Score:** >90 (all categories)

### 13.2 Accessibility Standards

- **WCAG 2.1 AA compliance**
- All features usable via keyboard
- Screen reader compatible
- Color contrast ratio ≥4.5:1
- Focus indicators on all interactive elements
- ARIA labels where appropriate

### 13.3 Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile Safari (iOS 15+)
- Chrome Mobile (Android 10+)

### 13.4 Scalability

- Support up to 1000 tasks per user without performance degradation
- Handle 100 concurrent users (single-user app, but for future)
- Database queries optimized with proper indexes

### 13.5 Security Standards

- HTTPS only (enforced by Vercel)
- Row Level Security enforced on all tables
- Rate limiting on all public endpoints
- Input validation with Zod
- No sensitive data in client-side code
- Regular dependency audits (`npm audit`)
- OWASP Top 10 vulnerabilities addressed

### 13.6 Data Integrity

- Foreign key constraints enforced
- Cascade deletes configured properly (delete project → deletes milestones → deletes tasks)
- No orphaned records
- Database backups daily (Supabase automatic)
- Point-in-time recovery available

### 13.7 Observability

- Error tracking with Sentry
- Performance monitoring with Vercel Analytics
- AI usage tracking (tokens, costs, latency)
- Structured logging for debugging
- Uptime monitoring (Vercel)

---

## 14. Future Enhancements

### Phase 7+ (Post-MVP)

**Multi-user Collaboration:**
- Add `Workspace` entity back
- Invite team members
- Real-time updates with Supabase Realtime
- Comments on tasks
- @mentions

**Advanced AI:**
- Different AI agents per workflow (Sales Agent, Ops Agent)
- Natural language task creation ("Add a task to fix the login bug")
- AI-powered time estimates
- Predictive analytics (estimated completion dates)

**Integrations:**
- Webhook support for external tools
- N8n/Zapier integration
- Import from Asana, Trello, Jira
- Export to Google Sheets
- Slack notifications

**Mobile App:**
- React Native app (iOS/Android)
- Share codebase with web (React Native Web)
- Offline support with local storage

**Advanced Features:**
- Gantt chart view
- Calendar view
- Recurring tasks
- Templates (project templates, task templates)
- Custom fields per project
- Time tracking
- File attachments

**Customization:**
- Custom columns per project
- Custom workflows
- Custom AI prompts per user
- Theming (light/dark mode, custom colors)

**Analytics:**
- Velocity tracking (tasks completed per week)
- Burndown charts
- Team performance metrics (if multi-user)
- AI recommendation acceptance rate

---

## Appendix

### Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15+ |
| Language | TypeScript | 5+ |
| UI Library | React | 19 |
| Styling | Tailwind CSS | 3+ |
| Component Library | shadcn/ui | Latest |
| Database | PostgreSQL (Supabase) | 15+ |
| ORM | Prisma | 5+ |
| Auth | Supabase Auth | Latest |
| State Management | TanStack Query | 5+ |
| Drag-and-Drop | @dnd-kit | Latest |
| Validation | Zod | 3+ |
| Forms | react-hook-form | 7+ |
| AI | OpenAI API | Latest |
| Caching | Vercel KV (Redis) | Latest |
| Rate Limiting | Upstash | Latest |
| Monitoring | Sentry | Latest |
| Testing (Unit) | Vitest | Latest |
| Testing (E2E) | Playwright | Latest |
| Deployment | Vercel | Latest |

### Estimated Costs (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| OpenAI API | Pay-as-you-go | $10-50 (depending on usage) |
| Upstash Redis | Free tier | $0 |
| Sentry | Developer | $0 (Free tier sufficient for single user) |
| **Total** | | **$55-95/month** |

### Key Files Checklist

- [ ] `prisma/schema.prisma` - Database schema
- [ ] `lib/validations/*.ts` - Zod schemas
- [ ] `lib/supabase/client.ts` - Supabase client
- [ ] `lib/ai/prompts.ts` - AI prompt templates
- [ ] `middleware.ts` - Auth middleware
- [ ] `app/(dashboard)/board/page.tsx` - Main board
- [ ] `components/board/kanban-board.tsx` - Board component
- [ ] `app/api/ai/prioritize/route.ts` - AI endpoint
- [ ] `.env.local.example` - Environment template
- [ ] `README.md` - Setup instructions

---

## Conclusion

This production-ready build plan provides a complete roadmap for building an AI-powered Kanban application using modern web technologies. The plan emphasizes:

✅ **Security** - Row-level security, input validation, rate limiting
✅ **Performance** - Optimistic updates, caching, indexing
✅ **Quality** - Comprehensive testing, error monitoring, accessibility
✅ **Scalability** - Clean architecture, efficient queries, modular design
✅ **Developer Experience** - TypeScript, automated workflows, excellent tooling

**Timeline:** 7-8 weeks from start to production-ready MVP

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 0 (DevOps setup)
3. Follow phases sequentially
4. Ship to production!

Good luck building! 🚀
