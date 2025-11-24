# AI-Powered Kanban Next.js Application — Comprehensive Build Plan

## 1. Product Vision & Core Features

### 1.1 Vision
Build a web application (Next.js) that:
- Manages **Projects (P)** → **Milestones (M)** → **Subtasks (sb)**.
- Presents everything on a **Kanban board** with drag-and-drop and collapsible cards.
- Uses **AI** to:
  - Chunk/cluster tasks into themes.
  - Prioritize work across all projects.
  - Suggest column moves (e.g., what should be in Working vs Backlog).

### 1.2 Core User Stories

1. **Project Structure**
   - As a user, I can create Projects (P), each with Milestones (M) and Subtasks (sb).
   - As a user, I can see a hierarchical view (P → M → sb) and a Kanban view.

2. **Kanban Board**
   - As a user, I can see cards in columns like: `Projects`, `Backlog`, `Working`, `Ready to Test`, `Agent Testing`, `Deployed / Manual Testing`, `Completed`.
   - Milestones and Subtasks appear as cards; cards can be **dragged & dropped** between columns.
   - Cards support **collapsible subtasks** (e.g., expand Quote Generator to see its subtasks).

3. **AI Assistance**
   - As a user, I can click **"AI Prioritize"** to get:
     - A `Top N – Work Next` list of subtasks.
     - Suggested column moves based on readiness/dependencies.
     - Grouping of items into thematic streams (e.g., Sales & Revenue, Agent UX, etc.).
   - As a user, I can view per-project summaries and AI-generated progress notes.

4. **Task Metadata**
   - Each Milestone/Subtask can store: value, urgency, effort, dependencies, tags, description.
   - AI can read/update a `priority_score` field.

5. **Authentication & Multi-user**
   - Users can sign up/sign in (email/password or OAuth) and see only their workspace.
   - Later: invite collaborators to a workspace.


## 2. Tech Stack

### 2.1 Frontend & Framework
- **Next.js 14+ (App Router)**
- **React** with functional components and hooks.
- **TypeScript** for type safety.
- **Styling**: Tailwind CSS (and optionally shadcn/ui components).
- **State Management**:
  - React Query / TanStack Query for server state (tasks, projects).
  - Local UI state via React hooks & context.

### 2.2 Backend & Persistence
- Next.js API routes (in `app/api/**`) for REST-style endpoints.
- **Database**: PostgreSQL (hosted on Supabase, Neon, or RDS).
- **ORM**: Prisma for schema & queries.

### 2.3 AI Integration
- OpenAI (or compatible) API for:
  - Task chunking, theming, and summarization.
  - Priority scoring and column move suggestions.
- Calls via server-side route: e.g., `POST /api/ai/prioritize`.

### 2.4 Authentication & Authorization
- **Auth**: NextAuth (Auth.js) or similar.
- Providers: Email/password + optional Google.
- Use `session` for per-request user context.

### 2.5 Drag-and-Drop
- Library: `@hello-pangea/dnd` or `react-beautiful-dnd` (if compatibility is okay) for Kanban drag/drop.

---

## 3. Data Model Design (Prisma Schema – Conceptual)

### 3.1 Entities

1. **User**
   - `id`
   - `name`
   - `email`
   - `image`
   - timestamps

2. **Workspace** (optional, to support teams)
   - `id`
   - `name`
   - `ownerId` → User
   - timestamps

3. **Project** (P)
   - `id`
   - `workspaceId`
   - `name`
   - `description`
   - `status` (active/archived)
   - `sortOrder` (for ordering projects)
   - timestamps

4. **Milestone** (M)
   - `id`
   - `projectId`
   - `name`
   - `description`
   - `value` (enum: HIGH, MEDIUM, LOW)
   - `urgency` (enum: HIGH, MEDIUM, LOW)
   - `effort` (enum: S, M, L)
   - `statusColumnId` (current Kanban column)
   - `priorityScore` (number; settable by AI)
   - `dependsOnMilestoneId` (nullable)
   - `sortOrder`
   - timestamps

5. **Task** (Subtask, sb)
   - `id`
   - `milestoneId`
   - `name`
   - `description`
   - `value` / `urgency` / `effort`
   - `statusColumnId`
   - `priorityScore`
   - `dependsOnTaskId`
   - `completedAt`
   - `sortOrder`
   - timestamps

6. **Column** (Kanban Column)
   - `id`
   - `workspaceId`
   - `name` (e.g., Backlog, Working, Ready to Test, etc.)
   - `key` (BACKLOG, WORKING, READY_TEST, AGENT_TESTING, DEPLOYED_TESTING, COMPLETED, PROJECTS)
   - `sortOrder`

7. **Tag**
   - `id`
   - `workspaceId`
   - `name` (e.g., `#area:sales`, `#type:module`)
   - `color`

8. **TaskTag** (many-to-many join)
   - `taskId`
   - `tagId`

9. **AIRecommendation** (optional, to store AI runs)
   - `id`
   - `workspaceId`
   - `userId`
   - `inputSnapshot` (JSON of the tasks at time of analysis)
   - `topTasks` (JSON list of task IDs with scores & reasons)
   - `suggestedMoves` (JSON)
   - `themes` (JSON – groups of tasks by theme)
   - timestamps

> Note: Milestones and Tasks both sit in Kanban columns, but only **Tasks** are actual atomic “work units” the user does.

---

## 4. Next.js App Architecture

### 4.1 Directory Structure (App Router)

```text
/app
  /layout.tsx         // Global layout, navigation shell
  /page.tsx           // Landing or dashboard
  /login
    /page.tsx
  /register
    /page.tsx
  /board
    /page.tsx         // Main Kanban board
  /projects
    /page.tsx         // List of Projects (P)
    /[projectId]
      /page.tsx       // Project detail with milestones & timeline
  /api
    /auth/[...nextauth]/route.ts
    /projects
      /route.ts       // POST, GET
      /[id]
        /route.ts     // GET, PATCH, DELETE
    /milestones
      /route.ts
      /[id]
        /route.ts
    /tasks
      /route.ts
      /[id]
        /route.ts
    /columns
      /route.ts
    /ai
      /prioritize
        /route.ts     // AI chunking/prioritization endpoint
```

### 4.2 Layout & Navigation

- **Global layout** includes:
  - Left sidebar: navigation (Board, Projects, Analytics, Settings).
  - Top bar: workspace selector, user profile, AI actions button (`Ask AI`, `AI Prioritize`).

- **/board page**:
  - Fetches `Columns`, `Milestones`, and `Tasks` for current workspace.
  - Renders Kanban with drag-and-drop.
  - Has a right-side **AI panel** that can show recommended tasks & themes.

- **/projects page**:
  - Grid or list of projects (P) with basic progress indicators.

- **Project detail page**:
  - Hierarchy view: P → M → sb.
  - Gantt/timeline (future feature).

---

## 5. Kanban Board UI Design

### 5.1 Column Component

`<KanbanColumn />`
- Props:
  - `column`: Column
  - `milestones`: Milestones in this column
  - `tasks`: Tasks in this column that are directly visible (e.g., maybe only subtasks are draggable, or both M/sb).
- Displays:
  - Column header with name and count.
  - List of **cards** (Milestones and Tasks) rendered inside a drag-and-drop context.

### 5.2 Card Component

`<KanbanCard />`
- Handles both Milestones and Tasks, with type discriminated by prop.
- Shows:
  - Title (e.g., `Quote Generator (M)` or `Create a Plan for Quote Generator (sb)`).
  - Tags (e.g., `#project:SalesModule`, `#area:sales`).
  - Value/Urgency/Effort icons.
  - Priority score (optional).
- Supports:
  - Click → open detail modal.
  - Expand/Collapse subtasks (for a Milestone card):
    - `SubtaskCount`, Completed vs total.
    - Toggle to show nested subtasks inline.

### 5.3 Drag-and-Drop Behavior

- Use `Droppable` for each Column.
- Use `Draggable` for each Card.
- On drag end:
  - If column changed, call `PATCH /api/tasks/[id]` or `/milestones/[id]` to update `statusColumnId` and `sortOrder`.

### 5.4 Filters & Views

- Filter controls on board:
  - Filter by Project, Tag, Value, Status.
  - Toggle `Show Milestones` / `Show subtasks only` / `Both`.

---

## 6. Task & Project Detail Views

### 6.1 Task Detail Modal

Fields:
- Title, type (sb), owner, status column.
- Value, Urgency, Effort (dropdowns).
- Dependencies (select another Task/Milestone).
- Tags.
- Description (rich text/markdown).
- AI Assist button: *"Help me clarify this task"* or *"Break into subtasks"*.

### 6.2 Milestone Detail Modal

Similar to Task detail, plus:
- List of subtasks (with ability to add/edit/reorder).
- Progress bar: completed subtasks / total.
- AI button: *"Generate suggested subtasks"*.

### 6.3 Project Detail Page

Shows:
- Project summary (description, AI summary, progress).
- Milestones list with metrics.
- Button: *"Ask AI: What should we do next for this project?"*.

---

## 7. AI Features — Flows & Prompts

### 7.1 AI Prioritization Flow

1. User clicks **"AI Prioritize Board"** on the board page.
2. Frontend sends a POST to `/api/ai/prioritize` with:
   - Workspace ID & user ID.
   - Current tasks snapshot:
     - Columns + tasks + metadata (value, urgency, effort, dependencies, tags, type (M/sb), project association).
   - Optional settings: max results (Top 5/10), custom rules.

3. Server-side route:
   - Formats tasks into a prompt-friendly structure.
   - Defines explicit instructions:
     - treat `(P)`, `(M)`, `(sb)` appropriately.
     - value/urgency/effort interpretation.
     - priority rules (revenue & unblockers first, quick wins next).
   - Calls OpenAI API (e.g., `gpt-4.1` or more recent model).

4. Response from AI:
   - List of top subtasks with `reasoning` and `priorityScore`.
   - Suggested column moves (taskId → newColumnKey).
   - Themes/groups: name and list of task IDs.

5. Server writes results to `AIRecommendation` and optionally updates `priorityScore` fields for tasks.

6. Frontend shows:
   - Side panel with sections:
     - **Top N – Work Next** (click to focus on task).
     - **Suggested Column Moves** (with buttons *Apply*/**Ignore**).
     - **Thematic Streams**.

### 7.2 Chunking & Theme Extraction

- Part of the same `/prioritize` endpoint, but logically separate in prompt:
  - Ask the model to:
    - Group tasks into 5–8 themes (Sales & Revenue, Order Flow, Agent UX, Finance, Marketing, etc.).
    - Produce a short name + description for each theme.
    - Provide a list of task IDs per theme.

### 7.3 Example Prompt Skeleton (Server-side)

```text
You are an AI Kanban coach for a real-estate services company.

You receive:
- A list of Projects (P), Milestones (M), and Subtasks (sb).
- Each item has: id, title, type, project, column, value, urgency, effort, tags, dependencies.

Goals:
1. Group tasks into 5–8 themes.
2. Prioritize subtasks (sb) across the entire board.
3. Suggest which items should move to Working, Ready to Test, or Backlog.

Priority rules:
1) Favor tasks that directly help us accept and fulfill more profitable client orders now.
2) Next, tasks that unblock other high-value tasks.
3) Quick wins (high value, low effort).
4) Then everything else.

Output JSON:
{
  "themes": [
    {"name": string, "description": string, "taskIds": string[]}, ...
  ],
  "topSubtasks": [
    {"taskId": string, "priorityScore": number, "reason": string}, ...
  ],
  "moves": [
    {"itemId": string, "fromColumn": string, "toColumn": string, "reason": string}, ...
  ]
}
```


### 7.4 Per-Project AI Summary

- Endpoint `/api/ai/project-summary`:
  - Input: projectId.
  - Server fetches milestones & tasks; AI produces:
    - Brief status summary.
    - Risks & blockers.
    - Suggested next 3 subtasks.

---

## 8. Authentication & Authorization Details

1. Configure NextAuth in `/app/api/auth/[...nextauth]/route.ts`.
2. Use Prisma adapter for DB persistence.
3. Models for `Account`, `Session`, etc., per NextAuth docs.
4. Middleware:
   - Add `middleware.ts` to protect `/board`, `/projects`, etc.
5. Access control by `workspaceId`:
   - Each user is associated with one or more workspaces (start with single workspace per user).
   - All Project/Milestone/Task queries are filtered by `workspaceId`.

---

## 9. Implementation Phases (Step-by-Step)

### Phase 1 — Project Setup & Auth

1. Initialize Next.js App Router project with TypeScript.
2. Install dependencies:
   - `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `@prisma/client`, `prisma`, `next-auth`, `@tanstack/react-query`, `@hello-pangea/dnd`.
3. Configure Tailwind.
4. Set up PostgreSQL & Prisma schema (User, Workspace, Project, Column, Milestone, Task, Tag, TaskTag).
5. Migrate DB.
6. Implement NextAuth with email/password and Google.
7. Basic layout & protected routes.

### Phase 2 — Core Data CRUD (No AI Yet)

1. API routes for Projects, Columns, Milestones, Tasks.
2. `/projects` page to list/create projects.
3. `/board` page with static columns from DB.
4. Basic card rendering for Milestones/Tasks.
5. Create/edit forms for Milestone & Task (modals or side panels).

### Phase 3 — Kanban Drag-and-Drop & Hierarchy

1. Implement drag-and-drop with `@hello-pangea/dnd`.
2. On drag end, update `statusColumnId` + `sortOrder`.
3. Implement collapsible subtasks on Milestone cards.
4. Add filters for project and tags.

### Phase 4 — AI Integration (Board-Level Prioritization)

1. Implement `/api/ai/prioritize` endpoint.
2. Create helper that converts DB records → AI prompt input.
3. Call OpenAI API; parse JSON response.
4. Store AI results in `AIRecommendation` and update `priorityScore` fields.
5. UI: AI sidebar on `/board` showing top subtasks, themes, moves.

### Phase 5 — AI Helpers in Detail Views

1. AI to **break a Milestone into subtasks**:
   - Button on Milestone detail: sends milestone context to an AI endpoint.
   - AI returns suggested subtasks; user can accept/edit.

2. AI to clarify/expand Task descriptions.

### Phase 6 — Polish, Analytics, and Quality-of-Life

1. Add per-project analytics: number of tasks per column, completion rate.
2. Add keyboard shortcuts (create task, open AI panel, etc.).
3. Add saved AI configurations (e.g., different prioritization strategies).
4. Improve performance (batching updates, optimistic UI for drag-and-drop).

---

## 10. Non-Functional Requirements

- **Performance**: Board should handle at least several hundred tasks without lag.
- **Security**: All AI endpoints must validate user/session and workspace access.
- **Reliability**: AI failures should fail gracefully (show an error, keep board usable).
- **Observability**:
  - Basic logging of AI calls (duration, success/failure) for debugging.

---

## 11. Future Enhancements

- Real-time collaboration (WebSockets / Pusher / Supabase Realtime).
- Mobile-friendly board view.
- Webhook/N8n integration to sync tasks with external tools (Asana, HubSpot).
- Import/export from CSV or WorkFlowy outlines.
- Custom AI agents per workflow (e.g., separate “Sales Agent”, “Ops Agent” views).

---

This plan outlines the architecture, data model, screens, and step-by-step implementation path to build the AI-powered Kanban system in Next.js, supporting Projects → Milestones → Subtasks and intelligent prioritization across your work.

