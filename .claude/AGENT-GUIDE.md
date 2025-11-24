# Claude Code Agent Library - Kanban Project

## Your Agent Team for AI-Powered Kanban Development

### 1. **backend-architect**
   - Next.js 15 API routes
   - Supabase integration
   - Prisma schema design
   - Scalability planning

### 2. **frontend-specialist**
   - React 19 components
   - Kanban board UI
   - Drag-and-drop with @dnd-kit
   - TailwindCSS + shadcn/ui

### 3. **ai-integration-specialist**
   - OpenAI API integration
   - Prompt engineering
   - AI response handling
   - Token optimization

### 4. **testing-specialist**
   - Vitest unit tests
   - Playwright E2E tests
   - Test coverage optimization
   - Quality assurance

### 5. **code-reviewer**
   - Code quality reviews
   - Security checks (OWASP, RLS)
   - Performance optimization
   - Best practices enforcement

### 6. **database-architect**
   - PostgreSQL schema (Supabase)
   - Prisma ORM optimization
   - RLS policies
   - Query optimization

### 7. **security-auditor**
   - Supabase RLS policy review
   - Input validation (Zod)
   - Rate limiting verification
   - Authentication security

### 8. **documentation-writer**
   - Technical documentation
   - API documentation
   - User guides
   - Progress tracking updates

### 9. **playwright-tester**
   - E2E test automation
   - Visual regression testing
   - Accessibility testing
   - Cross-browser testing

### 10. **debugger-specialist**
   - Issue investigation
   - Bug reproduction
   - Surgical fixes
   - Root cause analysis

### 11. **deployment-specialist**
   - Vercel deployment
   - Environment configuration
   - CI/CD pipeline
   - Production monitoring

## How to Use Agents

### Natural Language (Claude Auto-Selects)

```bash
# Review AI integration
"Review the OpenAI integration for security and cost optimization"
# → Uses ai-integration-specialist + security-auditor

# Design board feature
"Design the drag-and-drop board with optimistic updates"
# → Uses frontend-specialist + backend-architect

# Full production check
"Make this production-ready"
# → Uses multiple agents in sequence
```

## Agent Memory System

### `.claude/memory/preferences.json`
```json
{
  "ai": {
    "model": "gpt-4-turbo",
    "max_tokens": 4000,
    "temperature": 0.7,
    "cache_ttl_seconds": 3600
  },
  "board": {
    "default_columns": ["PROJECTS", "BACKLOG", "WORKING", "READY_TEST", "AGENT_TESTING", "DEPLOYED_TESTING", "COMPLETED"],
    "auto_prioritize_threshold": 20
  },
  "development": {
    "auto_format": true,
    "strict_types": true,
    "test_coverage_min": 80
  }
}
```

### `.claude/memory/lessons-learned.json`
Agents store insights here for future reference.

### `.claude/memory/tech-decisions.json`
Track architectural decisions and rationale.

## Example Workflows

### 1. New Feature Development
```
You: "Add AI-powered task clustering to the board"

Claude uses:
1. ai-integration-specialist → Design AI prompt
2. backend-architect → API endpoint
3. database-architect → Store recommendations
4. frontend-specialist → Build UI
5. testing-specialist → Write tests
6. code-reviewer → Final review
```

### 2. Production Deployment
```
You: "Deploy Phase 1 to production"

Claude uses:
1. code-reviewer → Security audit
2. testing-specialist → Run full test suite
3. deployment-specialist → Vercel deployment
4. documentation-writer → Update docs
```

### 3. Bug Fix
```
You: "Tasks aren't saving to database"

Claude uses:
1. debugger-specialist → Investigate issue
2. database-architect → Check schema/RLS
3. backend-architect → Fix API route
4. playwright-tester → Verify fix
```

## Custom Commands

### `/production-ready`
Full production readiness workflow:
- Code review
- Security audit
- Run migrations
- Execute tests
- Fix issues
- Commit & push

### `/start-phase [N]`
Begin a specific phase with checklist and setup.

### `/ai-test`
Test OpenAI integration with sample data.

### `/deploy-check`
Pre-deployment verification checklist.

## Tips

1. **Natural Language**: Just describe your task naturally
2. **Multi-Agent**: Claude uses multiple agents automatically
3. **Context**: Keep memory files updated
4. **Iterate**: Agents learn from your feedback
5. **Progress**: Use `/start-phase` to track implementation

## Project Structure

```
kanban/
├── .claude/
│   ├── agents/              # Specialized agents
│   │   └── *.md
│   ├── commands/            # Custom commands
│   │   └── *.md
│   ├── memory/              # Agent memory
│   │   ├── preferences.json
│   │   ├── lessons-learned.json
│   │   └── tech-decisions.json
│   └── AGENT-GUIDE.md       # This file
```

## Next Steps

1. Start Phase 0: `/start-phase 0`
2. Watch agents work together
3. Update preferences based on your needs
4. Track progress with `npm run progress`

Your agent team is ready to build! 🚀
