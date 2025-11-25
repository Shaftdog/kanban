'use client';

import { useState } from 'react';
import { X, Sparkles, TrendingUp, AlertTriangle, Target, Loader2 } from 'lucide-react';
import { useAIPrioritization, useAIRecommendation } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AIPrioritizationResponse } from '@/lib/validations/ai';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  focusProjectId?: string;
}

export function AIPanel({ isOpen, onClose, focusProjectId }: AIPanelProps) {
  const [activeData, setActiveData] = useState<AIPrioritizationResponse | null>(null);
  const aiPrioritization = useAIPrioritization();
  const { data: cachedRecommendation } = useAIRecommendation();

  const handleRunAI = async () => {
    try {
      const result = await aiPrioritization.mutateAsync({
        includeCompleted: false,
        focusProjectId,
      });
      setActiveData(result);
    } catch (error) {
      console.error('AI prioritization failed:', error);
    }
  };

  // Use activeData if available, otherwise use cached recommendation
  const displayData = activeData || (cachedRecommendation ? {
    prioritization: {
      topTasks: cachedRecommendation.recommendation.topTasks,
      suggestedMoves: cachedRecommendation.recommendation.suggestedMoves,
    },
    insights: {
      summary: '',
      themes: cachedRecommendation.recommendation.themes,
      recommendations: [],
    },
  } : null);
  const isStale = cachedRecommendation && !cachedRecommendation.isFresh;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/50 transition-opacity z-40',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full sm:w-[480px] bg-white dark:bg-gray-900 shadow-2xl transition-transform z-50',
          'flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold">AI Prioritization</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleRunAI}
              disabled={aiPrioritization.isPending}
              className="flex-1"
            >
              {aiPrioritization.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isStale ? 'Refresh Analysis' : 'Run AI Analysis'}
                </>
              )}
            </Button>
          </div>

          {/* Error State */}
          {aiPrioritization.isError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                Failed to run AI analysis. Please try again.
              </p>
            </div>
          )}

          {/* Loading State */}
          {aiPrioritization.isPending && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>AI agents are analyzing your board...</span>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
          )}

          {/* Results */}
          {displayData && !aiPrioritization.isPending && (
            <>
              {/* Staleness Warning */}
              {isStale && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                  This analysis is over 1 hour old. Run a fresh analysis for up-to-date insights.
                </div>
              )}

              {/* Executive Summary */}
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Executive Summary
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {displayData.insights?.summary ||
                    'AI analysis provides strategic prioritization and insights for your tasks.'}
                </p>
              </div>

              {/* Top Tasks */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Top Priority Tasks
                </h3>
                <div className="space-y-2">
                  {displayData.prioritization?.topTasks?.slice(0, 5).map((task: any) => (
                    <div
                      key={task.taskId}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">
                              {task.rank}
                            </span>
                            <p className="font-medium text-sm truncate">{task.taskTitle}</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {task.rationale}
                          </p>
                        </div>
                        <span className="flex-shrink-0 text-xs font-medium text-purple-600 dark:text-purple-400">
                          {task.priorityScore?.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Moves */}
              {displayData.prioritization?.suggestedMoves &&
                displayData.prioritization.suggestedMoves.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Suggested Moves
                    </h3>
                    <div className="space-y-2">
                      {displayData.prioritization.suggestedMoves.map((move: any) => (
                        <div
                          key={move.taskId}
                          className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                        >
                          <p className="font-medium text-sm">{move.taskTitle}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {move.currentColumn} → {move.suggestedColumn}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {move.reasoning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Themes */}
              {displayData.insights?.themes && displayData.insights.themes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Key Themes</h3>
                  <div className="space-y-2">
                    {displayData.insights.themes.map((theme: any, idx: number) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-3 rounded-lg border',
                          theme.category === 'OPPORTUNITY' &&
                            'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                          theme.category === 'RISK' &&
                            'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                          theme.category === 'GOAL' &&
                            'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        )}
                      >
                        <p className="font-medium text-sm">{theme.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {theme.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {displayData.insights?.recommendations && (
                <div className="space-y-3">
                  <h3 className="font-semibold">Recommendations</h3>
                  <div className="space-y-3">
                    {displayData.insights.recommendations.map((rec: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="font-medium text-sm">{rec.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {rec.description}
                        </p>
                        {rec.actionItems && rec.actionItems.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {rec.actionItems.map((action: string, i: number) => (
                              <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                                <span>•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!displayData && !aiPrioritization.isPending && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Click &quot;Run AI Analysis&quot; to get intelligent prioritization insights
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
