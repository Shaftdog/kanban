# Kanban Board

A modern kanban board application for project and task management.

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
kanban/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── context/        # React context providers
│   ├── types/          # TypeScript types/interfaces
│   └── styles/         # Global styles
├── public/             # Static assets
└── assets/             # Images, fonts, etc.
```

## Features

- AI-powered task prioritization and clustering
- Drag and drop functionality
- Project → Milestone → Subtask hierarchy
- Create, edit, and delete tasks
- Dependencies and tags
- Real-time progress tracking
- Production-ready with comprehensive testing

## 📊 Progress Tracking

This project includes an automated progress tracking system:

```bash
# View detailed progress report
npm run progress

# Update progress (runs automatically on commit)
npm run check-progress
```

**View full roadmap:** [PROGRESS.md](PROGRESS.md)

**Setup guide:** [SETUP_PROGRESS_TRACKING.md](SETUP_PROGRESS_TRACKING.md)
