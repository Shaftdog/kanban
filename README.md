# AI-Powered Kanban Application

A modern, intelligent task management system built with Next.js 15, featuring AI-powered prioritization, drag-and-drop Kanban boards, and real-time collaboration.

## ✨ Features

### Core Functionality
- **🎯 Kanban Board** - Intuitive drag-and-drop interface with customizable columns
- **📊 Project & Milestone Management** - Organize work into projects with trackable milestones
- **✅ Task Management** - Create, edit, and track tasks with subtask support
- **🏷️ Tag System** - Color-coded tags for easy categorization
- **🔍 Advanced Filtering** - Search and filter by project, tags, priority, and status
- **💾 Auto-Save** - Filters and preferences persisted to localStorage

### Priority System
- **Value** - Business value (HIGH/MEDIUM/LOW)
- **Urgency** - Time sensitivity (HIGH/MEDIUM/LOW)
- **Effort** - Work required (SMALL/MEDIUM/LARGE)
- **Auto-calculated Priority Scores** - Intelligent ranking based on multiple factors

### User Experience
- **🌓 Dark Mode** - Full dark mode support
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **⚡ Real-time Updates** - Optimistic UI updates with automatic rollback on errors
- **🎨 Modern UI** - Built with shadcn/ui and Tailwind CSS
- **♿ Accessible** - WCAG compliant with keyboard navigation support

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: TanStack Query (React Query)
- **Drag & Drop**: @dnd-kit
- **Authentication**: Supabase Auth
- **Notifications**: Sonner

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Supabase recommended)
- Supabase account (for authentication and database)

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd kanban
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="your-supabase-postgresql-connection-string"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

You can find these values in your Supabase project settings.

### 4. Set up the database

```bash
# Run Prisma migrations
npx prisma migrate dev

# (Optional) Seed the database with sample data
npx prisma db seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
kanban/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Main app pages
│   │   ├── board/          # Kanban board
│   │   ├── projects/       # Project management
│   │   └── settings/       # User settings
│   └── api/                # API routes
├── components/             # React components
│   ├── board/             # Board-specific components
│   ├── projects/          # Project components
│   ├── settings/          # Settings components
│   └── ui/                # Reusable UI components
├── lib/                    # Utility libraries
│   ├── hooks/             # Custom React hooks
│   ├── providers/         # Context providers
│   ├── supabase/          # Supabase client setup
│   ├── utils/             # Utility functions
│   └── validations/       # Zod validation schemas
├── prisma/                 # Database schema and migrations
│   ├── migrations/        # Migration files
│   ├── schema.prisma      # Prisma schema
│   └── seed.ts            # Database seeding script
└── public/                 # Static assets
```

## 🎮 Usage

### First-Time Setup

1. **Sign Up** - Create an account or sign in
2. **Automatic Initialization** - Your workspace will be automatically set up with:
   - Default Kanban columns (Projects, Backlog, Working, etc.)
   - Sample tags (Frontend, Backend, Bug, Feature, Urgent)
   - A welcome project to help you get started

### Creating Projects

1. Navigate to the **Projects** page
2. Click **"New Project"**
3. Fill in the name and description
4. Click **"Create"**

### Managing Milestones

1. Click on a project to view its details
2. Click **"New Milestone"** to add a milestone
3. Set the priority factors (Value, Urgency, Effort)
4. Assign a status column
5. Click **"Create"**

### Using the Kanban Board

1. Navigate to the **Board** page
2. **Drag and drop** milestones between columns to update status
3. Click **"Add card"** in any column for quick milestone creation
4. Use the search and filter bar to find specific items
5. Filters are automatically saved to localStorage

### Filtering

- **Search**: Type to search milestone names and descriptions
- **Project Filter**: Select one or more projects
- **Tag Filter**: Filter by tags
- **Value Filter**: Filter by priority level (HIGH/MEDIUM/LOW)
- **Item Type**: Toggle between All/Milestones/Tasks
- **Hide Completed**: Toggle to hide completed items

## 🔧 Configuration

### Customizing Columns

1. Go to **Settings** → **Column Management**
2. Click **"Rename"** next to any column
3. Enter a new name (column keys are preserved for system consistency)
4. Click **"Save"**

### Database Schema

The application uses the following main entities:

- **User** - Authentication and user data
- **Project** - Top-level project container
- **Milestone** - Major deliverables within projects
- **Task** - Atomic work units (subtasks)
- **Column** - Kanban board columns
- **Tag** - Categorization tags

## 🧪 Development

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (when configured)
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Building for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## 📊 Progress Tracking

Current project status: **33% Complete (84/257 tasks)**

See [PROGRESS.md](./PROGRESS.md) for detailed phase-by-phase progress tracking.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database powered by [Supabase](https://supabase.com/)
- Drag and drop by [@dnd-kit](https://dndkit.com/)

---

**Note**: This is an active development project. Some features may still be in progress. Check PROGRESS.md for the latest status.
