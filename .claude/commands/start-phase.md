---
description: Start a specific phase of the Kanban project with setup instructions and checklist
---

Begin Phase $ARGUMENTS of the Kanban AI-Powered Project.

## Instructions

1. **Read the Build Plan**
   - Open `ai_kanban_next_v2_production_ready.md`
   - Read the complete section for Phase $ARGUMENTS
   - Understand all tasks, deliverables, and success criteria

2. **Check Progress**
   - Run `npm run progress` to see current status
   - Identify what's already complete
   - Focus on remaining tasks

3. **Review Prerequisites**
   - Verify all previous phases are complete (if applicable)
   - Check required tools and dependencies
   - Ensure environment is properly configured

4. **Create Todo List**
   - Use TodoWrite tool to create task list for this phase
   - Break down into daily/hourly chunks
   - Set realistic time estimates

5. **Execute Phase Tasks**
   Follow the phase plan in order:

   **Phase 0**: DevOps & Environment Setup (3 days)
   - Set up Vercel, Supabase, GitHub Actions
   - Configure code quality tools
   - Establish CI/CD pipeline

   **Phase 1**: Foundation & Auth (1 week)
   - Initialize Next.js 15 project
   - Set up Prisma + Supabase
   - Implement authentication
   - Create base layout

   **Phase 1.5**: Testing Infrastructure (3-4 days)
   - Configure Vitest and Playwright
   - Write initial test suite
   - Set up CI testing
   - Achieve 80% coverage

   **Phase 2**: Core Data CRUD (1 week)
   - Create Zod schemas
   - Build API routes
   - Implement TanStack Query hooks
   - Create UI for projects/tasks

   **Phase 3**: Kanban Board & Drag-Drop (1 week)
   - Build board components
   - Implement @dnd-kit drag-and-drop
   - Add filters and search
   - Optimize performance

   **Phase 4**: AI Integration (1.5 weeks)
   - Set up OpenAI API
   - Build prioritization endpoint
   - Create AI panel UI
   - Add caching and rate limiting

   **Phase 5**: Detail Views (4-5 days)
   - Task/Milestone modals
   - Dependencies and tags
   - Rich text editing
   - Keyboard shortcuts

   **Phase 6**: Polish & Production (1 week)
   - Analytics
   - Performance optimization
   - Accessibility
   - Onboarding flow
   - Final QA and launch

6. **Update Progress**
   - Mark tasks complete as you go
   - Run `npm run check-progress` regularly
   - Update PROGRESS.md

7. **Phase Completion**
   - Verify all deliverables met
   - Run `/production-ready` for quality check
   - Mark phase complete in PROGRESS.md
   - Celebrate! 🎉

## Tips

- Work in small increments
- Test frequently
- Commit often
- Use agents for specialized tasks
- Keep PROGRESS.md updated
- Ask questions if unclear

## Phase Success Criteria

Each phase has specific deliverables listed in the build plan. Don't move to the next phase until all current phase deliverables are complete and tested.

Ready to build! Let's make this Kanban app amazing! 🚀
