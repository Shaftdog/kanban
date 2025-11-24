---
description: Run full production readiness workflow - code review, security audit, testing, and deployment prep
---

Orchestrate a complete production readiness workflow for the Kanban application.

## Workflow Steps

Execute the following in order, using specialized agents:

### 1. Code Review (code-reviewer agent)
Review all code changes for:
- Code quality and TypeScript best practices
- Security vulnerabilities (OWASP top 10, RLS issues)
- Performance issues (N+1 queries, missing indexes)
- Error handling completeness
- AI cost optimization (token limits, caching)
- Provide specific file:line references for issues

### 2. Security Audit (security-auditor agent)
Verify:
- Supabase RLS policies on all tables
- Input validation with Zod on all API routes
- Rate limiting on AI endpoints (10/hour)
- No exposed secrets or API keys
- CSRF protection
- XSS prevention in AI-generated content

### 3. Fix Critical Issues
- Address all critical and high-priority issues
- Make surgical fixes
- Update review status

### 4. Database Review (database-architect agent)
Check:
- Pending Prisma schema changes
- Migration files ready to run
- Indexes for performance
- RLS policies correctness
- Data integrity constraints

### 5. Run Migrations
```bash
npm run db:migrate
# or
npx prisma migrate deploy
```

### 6. Automated Testing (testing-specialist + playwright-tester)
Run full test suite:
```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:coverage # Check coverage
```

Verify:
- All tests passing
- Coverage >80%
- No console errors
- Accessibility checks pass

### 7. Performance Check
- Run Lighthouse audit
- Check bundle size
- Verify API response times
- Test with realistic data (100+ tasks)

### 8. AI Integration Test
- Test AI prioritization with sample data
- Verify response validation
- Check token usage logging
- Test rate limiting
- Verify caching works

### 9. Debug Failures (if needed)
If tests fail:
- Use debugger-specialist agent
- Get detailed reproduction steps
- Apply surgical fixes
- Re-run tests
- Iterate until passing

### 10. Deployment Prep (deployment-specialist)
- Verify environment variables
- Check Vercel configuration
- Review deployment checklist
- Plan rollback strategy

### 11. Git Operations
Once all checks pass:
```bash
git add .
git commit -m "feat: [description]

🤖 Generated with Claude Code
"
git push origin main
```

## Success Criteria

Only report production ready when:
- ✅ Zero critical/high code review issues
- ✅ All security checks pass
- ✅ All migrations ready and tested
- ✅ All tests passing (unit + E2E)
- ✅ Test coverage >80%
- ✅ Lighthouse score >90
- ✅ No console errors
- ✅ AI integration tested
- ✅ Changes committed and pushed
- ✅ Deployment plan documented

## Output

Provide final summary with:
- 📝 Code review status
- 🔒 Security audit results
- 🗄️ Database migrations run
- ✅ Test results (pass/fail, coverage %)
- 🎯 Performance metrics
- 🤖 AI integration status
- 📦 Git commit hash
- 🚀 Ready for deployment: YES/NO

If NO, provide clear action items to resolve.
