import { openai, AI_MODEL, AI_TEMPERATURE } from './client';
import {
  TRIAGE_AGENT_PROMPT,
  PRIORITIZER_AGENT_PROMPT,
  INSIGHTS_AGENT_PROMPT,
  SYSTEM_CONTEXT,
} from './prompts';
import {
  fetchBoardItems,
  formatBoardItemsForAI,
  identifyBlockedItems,
  identifyBlockerItems,
  type BoardItem,
} from './tools';
import {
  TriageOutputSchema,
  PrioritizerOutputSchema,
  InsightsOutputSchema,
  type AIPrioritizationResponse,
  type TriageOutput,
  type PrioritizerOutput,
  type InsightsOutput,
} from '../validations/ai';

/**
 * Agent orchestrator implementing the handoff pattern
 * Follows OpenAI's agentic patterns: Triage → Prioritizer → Insights
 */

interface AgentContext {
  userId: string;
  boardItems: BoardItem[];
  includeCompleted: boolean;
  focusProjectId?: string;
}

interface AgentResult<T> {
  output: T;
  tokensUsed: number;
  executionTimeMs: number;
}

/**
 * Triage Agent: Analyzes tasks and calculates priority scores
 */
async function runTriageAgent(
  context: AgentContext
): Promise<AgentResult<TriageOutput>> {
  const startTime = Date.now();

  const boardData = formatBoardItemsForAI(context.boardItems);
  const blockedItems = identifyBlockedItems(context.boardItems);
  const blockerItems = identifyBlockerItems(context.boardItems);

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: AI_TEMPERATURE,
    messages: [
      {
        role: 'system',
        content: `${SYSTEM_CONTEXT}\n\n${TRIAGE_AGENT_PROMPT}`,
      },
      {
        role: 'user',
        content: `Analyze the following Kanban board data and provide triage analysis:\n\n${boardData}\n\nBlocked items: ${blockedItems.join(', ') || 'None'}\nBlocker items: ${blockerItems.join(', ') || 'None'}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('Triage agent returned no response');
  }

  const parsedOutput = JSON.parse(response);
  const validatedOutput = TriageOutputSchema.parse(parsedOutput);

  return {
    output: validatedOutput,
    tokensUsed: completion.usage?.total_tokens || 0,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Prioritizer Agent: Ranks tasks and suggests moves
 */
async function runPrioritizerAgent(
  context: AgentContext,
  triageOutput: TriageOutput
): Promise<AgentResult<PrioritizerOutput>> {
  const startTime = Date.now();

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: AI_TEMPERATURE * 0.8, // Slightly more deterministic
    messages: [
      {
        role: 'system',
        content: `${SYSTEM_CONTEXT}\n\n${PRIORITIZER_AGENT_PROMPT}`,
      },
      {
        role: 'user',
        content: `Based on the triage analysis, prioritize tasks and suggest optimal moves.\n\nTriage Output:\n${JSON.stringify(triageOutput, null, 2)}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('Prioritizer agent returned no response');
  }

  const parsedOutput = JSON.parse(response);
  const validatedOutput = PrioritizerOutputSchema.parse(parsedOutput);

  return {
    output: validatedOutput,
    tokensUsed: completion.usage?.total_tokens || 0,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Insights Agent: Identifies themes and provides strategic recommendations
 */
async function runInsightsAgent(
  context: AgentContext,
  triageOutput: TriageOutput,
  prioritizerOutput: PrioritizerOutput
): Promise<AgentResult<InsightsOutput>> {
  const startTime = Date.now();

  const completion = await openai.chat.completions.create({
    model: AI_MODEL,
    temperature: AI_TEMPERATURE * 1.1, // Slightly more creative
    messages: [
      {
        role: 'system',
        content: `${SYSTEM_CONTEXT}\n\n${INSIGHTS_AGENT_PROMPT}`,
      },
      {
        role: 'user',
        content: `Provide strategic insights and recommendations based on the analysis.\n\nTriage:\n${JSON.stringify(triageOutput, null, 2)}\n\nPrioritization:\n${JSON.stringify(prioritizerOutput, null, 2)}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('Insights agent returned no response');
  }

  const parsedOutput = JSON.parse(response);
  const validatedOutput = InsightsOutputSchema.parse(parsedOutput);

  return {
    output: validatedOutput,
    tokensUsed: completion.usage?.total_tokens || 0,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Main orchestrator: Runs all agents with handoffs
 * Implements the agent handoff pattern: Triage → Prioritizer → Insights
 */
export async function runAIPrioritization(
  userId: string,
  includeCompleted = false,
  focusProjectId?: string
): Promise<AIPrioritizationResponse> {
  const overallStartTime = Date.now();

  // Fetch board data
  const boardItems = await fetchBoardItems(userId, includeCompleted, focusProjectId);

  if (boardItems.length === 0) {
    throw new Error('No board items found for prioritization');
  }

  const context: AgentContext = {
    userId,
    boardItems,
    includeCompleted,
    focusProjectId,
  };

  // Run agent pipeline with handoffs
  console.log('[AI Orchestrator] Starting Triage Agent...');
  const triageResult = await runTriageAgent(context);

  console.log('[AI Orchestrator] Handoff to Prioritizer Agent...');
  const prioritizerResult = await runPrioritizerAgent(context, triageResult.output);

  console.log('[AI Orchestrator] Handoff to Insights Agent...');
  const insightsResult = await runInsightsAgent(
    context,
    triageResult.output,
    prioritizerResult.output
  );

  const totalTokens =
    triageResult.tokensUsed +
    prioritizerResult.tokensUsed +
    insightsResult.tokensUsed;

  const totalExecutionTime = Date.now() - overallStartTime;

  console.log(
    `[AI Orchestrator] Complete! Tokens: ${totalTokens}, Time: ${totalExecutionTime}ms`
  );

  return {
    triage: triageResult.output,
    prioritization: prioritizerResult.output,
    insights: insightsResult.output,
    metadata: {
      generatedAt: new Date().toISOString(),
      tokensUsed: totalTokens,
      executionTimeMs: totalExecutionTime,
      modelVersion: AI_MODEL,
    },
  };
}
