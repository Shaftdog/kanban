import { z } from 'zod';

/**
 * Zod validation schemas for AI responses
 * Ensures type safety and validates AI-generated content
 */

// Task priority score from triage
export const TaskScoreSchema = z.object({
  taskId: z.string().uuid(),
  taskTitle: z.string(),
  priorityScore: z.number().min(0).max(20),
  isUrgent: z.boolean(),
  reasoning: z.string().optional(),
});

export type TaskScore = z.infer<typeof TaskScoreSchema>;

// Triage Agent output
export const TriageOutputSchema = z.object({
  analyzedCount: z.number(),
  urgentTasks: z.array(z.string().uuid()),
  taskScores: z.array(TaskScoreSchema),
  flags: z.array(z.object({
    taskId: z.string().uuid(),
    type: z.enum(['BLOCKED', 'BLOCKER', 'OVERDUE', 'HIGH_EFFORT']),
    message: z.string(),
  })).optional(),
});

export type TriageOutput = z.infer<typeof TriageOutputSchema>;

// Suggested task move
export const SuggestedMoveSchema = z.object({
  taskId: z.string().uuid(),
  taskTitle: z.string(),
  currentColumn: z.string(),
  suggestedColumn: z.string(),
  reasoning: z.string(),
  impact: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export type SuggestedMove = z.infer<typeof SuggestedMoveSchema>;

// Prioritizer Agent output
export const PrioritizerOutputSchema = z.object({
  topTasks: z.array(z.object({
    taskId: z.string().uuid(),
    taskTitle: z.string(),
    rank: z.number().min(1).max(10),
    priorityScore: z.number(),
    rationale: z.string(),
  })).max(10),
  suggestedMoves: z.array(SuggestedMoveSchema).max(5),
  flowAnalysis: z.object({
    todoCount: z.number(),
    inProgressCount: z.number(),
    reviewCount: z.number(),
    recommendation: z.string(),
  }).optional(),
});

export type PrioritizerOutput = z.infer<typeof PrioritizerOutputSchema>;

// Theme identified by Insights Agent
export const ThemeSchema = z.object({
  title: z.string(),
  description: z.string(),
  relatedTaskIds: z.array(z.string().uuid()),
  category: z.enum(['OPPORTUNITY', 'RISK', 'GOAL']),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
});

export type Theme = z.infer<typeof ThemeSchema>;

// Insights Agent output
export const InsightsOutputSchema = z.object({
  summary: z.string().max(500),
  themes: z.array(ThemeSchema).max(5),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    actionItems: z.array(z.string()).max(3),
    expectedImpact: z.string(),
  })).min(3).max(5),
  riskAssessment: z.object({
    level: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    factors: z.array(z.string()),
  }).optional(),
});

export type InsightsOutput = z.infer<typeof InsightsOutputSchema>;

// Complete AI Prioritization Response
export const AIPrioritizationResponseSchema = z.object({
  triage: TriageOutputSchema,
  prioritization: PrioritizerOutputSchema,
  insights: InsightsOutputSchema,
  metadata: z.object({
    generatedAt: z.string().datetime(),
    tokensUsed: z.number().optional(),
    executionTimeMs: z.number().optional(),
    modelVersion: z.string(),
  }),
});

export type AIPrioritizationResponse = z.infer<typeof AIPrioritizationResponseSchema>;

// Request schema
export const AIPrioritizeRequestSchema = z.object({
  userId: z.string().uuid(),
  includeCompleted: z.boolean().default(false),
  focusProjectId: z.string().uuid().optional(),
});

export type AIPrioritizeRequest = z.infer<typeof AIPrioritizeRequestSchema>;
