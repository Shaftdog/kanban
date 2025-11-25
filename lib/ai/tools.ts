import { Priority, Effort } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Tool functions for AI agents to interact with the Kanban board data
 */

// Priority and effort value mappings
const PRIORITY_VALUES: Record<Priority, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const EFFORT_VALUES: Record<Effort, number> = {
  SMALL: 1,
  MEDIUM: 3,
  LARGE: 5,
};

export interface BoardItem {
  id: string;
  type: 'MILESTONE' | 'TASK';
  name: string;
  description: string | null;
  value: Priority;
  urgency: Priority;
  effort: Effort;
  statusColumnKey: string;
  statusColumnName: string;
  projectId?: string;
  projectName?: string;
  milestoneId?: string;
  milestoneName?: string;
  dependsOnId: string | null;
  dependsOnName: string | null;
  blockedCount: number;
  priorityScore: number;
  tags?: string[];
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fetch all board items (milestones and tasks) for a user
 */
export async function fetchBoardItems(
  userId: string,
  includeCompleted = false,
  focusProjectId?: string
): Promise<BoardItem[]> {
  // Fetch all necessary data
  const projects = await prisma.project.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      ...(focusProjectId ? { id: focusProjectId } : {}),
    },
  });

  const projectIds = projects.map(p => p.id);

  const columns = await prisma.column.findMany({
    where: { userId },
  });

  const milestones = await prisma.milestone.findMany({
    where: {
      projectId: { in: projectIds },
    },
  });

  const tasks = await prisma.task.findMany({
    where: {
      milestone: {
        projectId: { in: projectIds },
      },
    },
  });

  // Create lookup maps
  const projectMap = new Map(projects.map(p => [p.id, p]));
  const columnMap = new Map(columns.map(c => [c.id, c]));
  const milestoneMap = new Map(milestones.map(m => [m.id, m]));

  // Count blocked items for each milestone/task
  const blockedCountMap = new Map<string, number>();
  milestones.forEach(m => {
    if (m.dependsOnMilestoneId) {
      blockedCountMap.set(m.dependsOnMilestoneId, (blockedCountMap.get(m.dependsOnMilestoneId) || 0) + 1);
    }
  });
  tasks.forEach(t => {
    if (t.dependsOnTaskId) {
      blockedCountMap.set(t.dependsOnTaskId, (blockedCountMap.get(t.dependsOnTaskId) || 0) + 1);
    }
  });

  // Transform milestones
  const milestoneItems: BoardItem[] = milestones
    .filter(m => {
      const column = columnMap.get(m.statusColumnId);
      if (!column) return false;
      if (!includeCompleted && column.key === 'COMPLETED') return false;
      return true;
    })
    .map((m) => {
      const project = projectMap.get(m.projectId)!;
      const column = columnMap.get(m.statusColumnId)!;
      const dependsOn = m.dependsOnMilestoneId ? milestoneMap.get(m.dependsOnMilestoneId) : null;

      return {
        id: m.id,
        type: 'MILESTONE' as const,
        name: m.name,
        description: m.description,
        value: m.value,
        urgency: m.urgency,
        effort: m.effort,
        statusColumnKey: column.key,
        statusColumnName: column.name,
        projectId: project.id,
        projectName: project.name,
        dependsOnId: m.dependsOnMilestoneId,
        dependsOnName: dependsOn?.name || null,
        blockedCount: blockedCountMap.get(m.id) || 0,
        priorityScore: calculatePriorityScore(m.value, m.urgency, m.effort),
        isCompleted: column.key === 'COMPLETED',
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      };
    });

  // Create task map
  const taskMap = new Map(tasks.map(t => [t.id, t]));

  // Transform tasks
  const taskItems: BoardItem[] = tasks
    .filter(t => {
      const column = columnMap.get(t.statusColumnId);
      if (!column) return false;
      if (!includeCompleted && (column.key === 'COMPLETED' || t.completedAt)) return false;
      return true;
    })
    .map((t) => {
      const milestone = milestoneMap.get(t.milestoneId)!;
      const project = projectMap.get(milestone.projectId)!;
      const column = columnMap.get(t.statusColumnId)!;
      const dependsOn = t.dependsOnTaskId ? taskMap.get(t.dependsOnTaskId) : null;

      return {
        id: t.id,
        type: 'TASK' as const,
        name: t.name,
        description: t.description,
        value: t.value,
        urgency: t.urgency,
        effort: t.effort,
        statusColumnKey: column.key,
        statusColumnName: column.name,
        projectId: project.id,
        projectName: project.name,
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        dependsOnId: t.dependsOnTaskId,
        dependsOnName: dependsOn?.name || null,
        blockedCount: blockedCountMap.get(t.id) || 0,
        priorityScore: calculatePriorityScore(t.value, t.urgency, t.effort),
        tags: [], // Tags would require another query
        isCompleted: !!t.completedAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      };
    });

  return [...milestoneItems, ...taskItems];
}

/**
 * Calculate priority score using the formula:
 * Priority = (Value × 2) + (Urgency × 1.5) + (5 - Effort)
 */
export function calculatePriorityScore(
  value: Priority,
  urgency: Priority,
  effort: Effort
): number {
  const valueScore = PRIORITY_VALUES[value] * 2;
  const urgencyScore = PRIORITY_VALUES[urgency] * 1.5;
  const effortScore = 5 - EFFORT_VALUES[effort];

  return Math.round((valueScore + urgencyScore + effortScore) * 100) / 100;
}

/**
 * Get column distribution statistics
 */
export function analyzeColumnDistribution(items: BoardItem[]) {
  const distribution: Record<string, number> = {};

  items.forEach((item) => {
    distribution[item.statusColumnKey] = (distribution[item.statusColumnKey] || 0) + 1;
  });

  return {
    PROJECTS: distribution.PROJECTS || 0,
    BACKLOG: distribution.BACKLOG || 0,
    WORKING: distribution.WORKING || 0,
    READY_TEST: distribution.READY_TEST || 0,
    AGENT_TESTING: distribution.AGENT_TESTING || 0,
    DEPLOYED_TESTING: distribution.DEPLOYED_TESTING || 0,
    COMPLETED: distribution.COMPLETED || 0,
  };
}

/**
 * Identify blocked items (have dependencies that aren't completed)
 */
export function identifyBlockedItems(items: BoardItem[]): string[] {
  const blocked: string[] = [];
  const completedIds = new Set(items.filter((i) => i.isCompleted).map((i) => i.id));

  items.forEach((item) => {
    if (item.dependsOnId && !completedIds.has(item.dependsOnId)) {
      blocked.push(item.id);
    }
  });

  return blocked;
}

/**
 * Identify blocker items (have other items depending on them)
 */
export function identifyBlockerItems(items: BoardItem[]): string[] {
  return items.filter((item) => item.blockedCount > 0).map((item) => item.id);
}

/**
 * Format board items for AI consumption
 */
export function formatBoardItemsForAI(items: BoardItem[]): string {
  const summary = {
    totalItems: items.length,
    milestones: items.filter((i) => i.type === 'MILESTONE').length,
    tasks: items.filter((i) => i.type === 'TASK').length,
    distribution: analyzeColumnDistribution(items),
    blockedItems: identifyBlockedItems(items),
    blockerItems: identifyBlockerItems(items),
  };

  const itemsFormatted = items.map((item) => ({
    id: item.id,
    type: item.type,
    name: item.name,
    description: item.description?.substring(0, 100) || null,
    value: item.value,
    urgency: item.urgency,
    effort: item.effort,
    column: item.statusColumnKey,
    priorityScore: item.priorityScore,
    project: item.projectName,
    milestone: item.milestoneName,
    dependsOn: item.dependsOnName,
    blocks: item.blockedCount,
    tags: item.tags,
  }));

  return JSON.stringify({ summary, items: itemsFormatted }, null, 2);
}

/**
 * Validate that task IDs exist and belong to the user
 */
export async function validateTaskIds(
  userId: string,
  taskIds: string[]
): Promise<{ valid: string[]; invalid: string[] }> {
  const validTasks = await prisma.task.findMany({
    where: {
      id: { in: taskIds },
      milestone: {
        project: {
          userId,
        },
      },
    },
    select: { id: true },
  });

  const validMilestones = await prisma.milestone.findMany({
    where: {
      id: { in: taskIds },
      project: {
        userId,
      },
    },
    select: { id: true },
  });

  const valid = [
    ...validTasks.map((t) => t.id),
    ...validMilestones.map((m) => m.id),
  ];
  const invalid = taskIds.filter((id) => !valid.includes(id));

  return { valid, invalid };
}
