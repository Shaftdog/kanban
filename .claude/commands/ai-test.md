---
description: Test OpenAI integration with sample Kanban data
---

Test the AI integration for task prioritization with sample data.

## Steps

### 1. Check OpenAI Configuration
```bash
# Verify API key is set
echo $OPENAI_API_KEY
# Should show sk-... (first few chars)
```

### 2. Create Test Data Fixture
Create a test file with sample tasks:

```typescript
// scripts/test-ai.ts
const sampleTasks = {
  projects: [
    { id: '1', name: 'Sales Module', status: 'ACTIVE' }
  ],
  milestones: [
    {
      id: 'm1',
      projectId: '1',
      name: 'Quote Generator',
      value: 'HIGH',
      urgency: 'HIGH',
      effort: 'MEDIUM',
      statusColumn: 'BACKLOG'
    }
  ],
  tasks: [
    {
      id: 't1',
      milestoneId: 'm1',
      name: 'Design quote UI',
      value: 'HIGH',
      urgency: 'MEDIUM',
      effort: 'SMALL',
      statusColumn: 'BACKLOG',
      tags: ['#area:sales', '#type:ui']
    },
    {
      id: 't2',
      milestoneId: 'm1',
      name: 'Build quote calculation engine',
      value: 'HIGH',
      urgency: 'HIGH',
      effort: 'LARGE',
      statusColumn: 'BACKLOG',
      tags: ['#area:sales', '#type:backend']
    }
  ]
};
```

### 3. Test AI Endpoint
```bash
# Start dev server if not running
npm run dev

# Call AI endpoint
curl -X POST http://localhost:3000/api/ai/prioritize \
  -H "Content-Type: application/json" \
  -H "Cookie: [your-session-cookie]" \
  -d '{"maxResults": 10}'
```

### 4. Verify Response
Check that response includes:
- `topSubtasks`: Array of prioritized tasks with scores
- `themes`: Thematic groupings
- `moves`: Suggested column changes

### 5. Validate Response Structure
```typescript
// Should match Zod schema
{
  topSubtasks: [
    {
      taskId: "t2",
      priorityScore: 95,
      reason: "High value, unblocks other work"
    }
  ],
  themes: [
    {
      name: "Sales & Revenue",
      description: "Revenue-generating features",
      taskIds: ["t1", "t2"]
    }
  ],
  moves: [
    {
      itemId: "t2",
      itemType: "task",
      fromColumn: "BACKLOG",
      toColumn: "WORKING",
      reason: "Critical path item"
    }
  ]
}
```

### 6. Check Logs
Verify logging includes:
- Tokens used
- Duration (ms)
- Prompt version
- Success/failure
- Any errors

### 7. Test Error Handling
Test failure scenarios:
- Invalid API key
- Network timeout
- Malformed response
- Rate limit exceeded

### 8. Test Caching
- Make same request twice
- Second should be faster (cached)
- Check cache hit in logs

## Success Criteria

✅ AI endpoint returns valid JSON
✅ Response matches Zod schema
✅ Prioritization makes logical sense
✅ Token usage logged correctly
✅ Caching works properly
✅ Error handling graceful
✅ Rate limiting enforced

## Troubleshooting

**No response**:
- Check API key is valid
- Verify network connectivity
- Check OpenAI service status

**Invalid response**:
- Check prompt template
- Verify JSON mode enabled
- Review error logs

**Too slow (>15s)**:
- Reduce max_tokens
- Optimize prompt length
- Check network latency

**High costs**:
- Implement caching
- Reduce token limits
- Use gpt-4o-mini for simple tasks

AI integration test complete! 🤖
