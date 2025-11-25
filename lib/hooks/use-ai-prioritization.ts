import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AIPrioritizationResponse, AIPrioritizeRequest } from '@/lib/validations/ai';

/**
 * Hook to run AI prioritization
 */
export function useAIPrioritization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: Omit<AIPrioritizeRequest, 'userId'>) => {
      const response = await fetch('/api/ai/prioritize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to run AI prioritization');
      }

      return response.json() as Promise<AIPrioritizationResponse>;
    },
    onSuccess: () => {
      // Invalidate the cached recommendation
      queryClient.invalidateQueries({ queryKey: ['ai-recommendation'] });
    },
  });
}

/**
 * Hook to get cached AI recommendation
 */
export function useAIRecommendation() {
  return useQuery({
    queryKey: ['ai-recommendation'],
    queryFn: async () => {
      const response = await fetch('/api/ai/prioritize');

      if (response.status === 404) {
        return null; // No recommendations yet
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch AI recommendation');
      }

      return response.json() as Promise<{
        recommendation: {
          topTasks: any[];
          suggestedMoves: any[];
          themes: any[];
          createdAt: string;
        };
        isFresh: boolean;
        metadata: {
          tokensUsed: number;
          durationMs: number;
          promptVersion: string;
        };
      }>;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: false,
  });
}
