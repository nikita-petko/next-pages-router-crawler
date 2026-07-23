/* eslint-disable no-console -- Structured thinking-step adapter diagnostics */

export function logOrphanChildDropped({
  parentStepId,
  childId,
  childTitle,
}: {
  parentStepId: string;
  childId?: string;
  childTitle: string;
}): void {
  console.info('[AnalyticsThinkingSteps:diag]', {
    event: 'orphan_child_dropped',
    parentStepId,
    childId,
    childTitle,
  });
}
