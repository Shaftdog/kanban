import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAIPrioritization } from '@/lib/ai/agents';
import { AIPrioritizeRequestSchema } from '@/lib/validations/ai';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/ai/prioritize
 * AI-powered task prioritization using multi-agent workflow
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await req.json();
    const validatedRequest = AIPrioritizeRequestSchema.parse({
      userId: user.id,
      ...body,
    });

    console.log(
      `[AI Prioritize] Request from user ${user.id}, project: ${validatedRequest.focusProjectId || 'all'}`
    );

    // Run AI prioritization with multi-agent workflow
    const result = await runAIPrioritization(
      validatedRequest.userId,
      validatedRequest.includeCompleted,
      validatedRequest.focusProjectId
    );

    // Save to audit log (AIRecommendation table)
    await prisma.aIRecommendation.create({
      data: {
        userId: user.id,
        inputSnapshot: {
          includeCompleted: validatedRequest.includeCompleted,
          focusProjectId: validatedRequest.focusProjectId,
        },
        topTasks: result.prioritization.topTasks,
        suggestedMoves: result.prioritization.suggestedMoves,
        themes: result.insights.themes,
        promptVersion: '1.0.0',
        tokensUsed: result.metadata.tokensUsed || 0,
        durationMs: result.metadata.executionTimeMs || 0,
      },
    });

    console.log(
      `[AI Prioritize] Success! Tokens: ${result.metadata.tokensUsed}, Time: ${result.metadata.executionTimeMs}ms`
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('[AI Prioritize] Error:', error);

    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          error: 'Invalid request or AI response format',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle OpenAI API errors
    if (error.status === 429) {
      return NextResponse.json(
        {
          error: 'OpenAI rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: 'Failed to generate AI prioritization',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/prioritize
 * Get the most recent AI recommendation for the user
 */
export async function GET(_req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get most recent recommendation
    const recommendation = await prisma.aIRecommendation.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'No recommendations found' }, { status: 404 });
    }

    // Check if recommendation is still fresh (within 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const isFresh = recommendation.createdAt > oneHourAgo;

    return NextResponse.json(
      {
        recommendation: {
          topTasks: recommendation.topTasks,
          suggestedMoves: recommendation.suggestedMoves,
          themes: recommendation.themes,
          createdAt: recommendation.createdAt,
        },
        isFresh,
        metadata: {
          tokensUsed: recommendation.tokensUsed,
          durationMs: recommendation.durationMs,
          promptVersion: recommendation.promptVersion,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[AI Prioritize GET] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch AI recommendation',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
