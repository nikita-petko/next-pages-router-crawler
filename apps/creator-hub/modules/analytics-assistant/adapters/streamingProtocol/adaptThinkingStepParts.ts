import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import {
  AnalyticsChatDataPartType,
  ThinkingStepKind,
  ThinkingStepStatus,
  type AnalyticsChatMessage,
  type ThinkingStep,
  type ThinkingStepData,
  type ThinkingStepDataPart,
} from '../../types/AnalyticsChatTypes';
import { formatUnknownError, formatUnknownValue } from './formatUnknownValue';
import { logOrphanChildDropped } from './thinkingStepDiagnostics';

type AnalyticsChatMessagePart = AnalyticsChatMessage['parts'][number];

export interface AdaptThinkingStepPartsOptions {
  finalizeInProgress?: boolean;
}

interface ChildRegistry {
  order: string[];
  byId: Map<string, ThinkingStep>;
  withoutId: ThinkingStep[];
}

let orphanedChildDropCount = 0;
const loggedOrphanChildKeys = new Set<string>();

export function getOrphanedChildDropCount(): number {
  return orphanedChildDropCount;
}

export function resetOrphanedChildDropCount(): void {
  orphanedChildDropCount = 0;
  loggedOrphanChildKeys.clear();
}

export function adaptThinkingStepParts(
  parts: AnalyticsChatMessagePart[],
  options?: AdaptThinkingStepPartsOptions,
): ThinkingStep[] {
  const finalizeInProgress = options?.finalizeInProgress ?? false;
  const parentById = new Map<string, ThinkingStep>();
  const topLevelOrder: string[] = [];
  const topLevelWithoutId: ThinkingStep[] = [];
  const childRegistries = new Map<string, ChildRegistry>();

  parts.forEach((part) => {
    if (!isThinkingStepDataPart(part)) {
      return;
    }
    try {
      const wireData = toValidatedThinkingStep(part.data);
      const step = finalizeStepStatus(
        {
          id: part.id,
          title: wireData.title,
          status: wireData.status,
          kind: wireData.kind,
          body: wireData.body,
          durationMs: wireData.durationMs,
        },
        finalizeInProgress,
      );

      if (wireData.parentStep) {
        attachChildStep({
          parentStepId: wireData.parentStep,
          step,
          parentById,
          childRegistries,
        });
        return;
      }

      upsertTopLevelStep({
        step,
        parentById,
        topLevelOrder,
        topLevelWithoutId,
      });
    } catch (err) {
      logAnalyticsError(`Error validating thinking step: ${formatUnknownError(err)}`);
    }
  });

  return [
    ...topLevelOrder.map((id) => materializeStep(parentById.get(id), childRegistries)),
    ...topLevelWithoutId.map((step) => materializeStep(step, childRegistries)),
  ].filter((step): step is ThinkingStep => step != null);
}

function finalizeStepStatus(step: ThinkingStep, finalizeInProgress: boolean): ThinkingStep {
  if (!finalizeInProgress || step.status !== ThinkingStepStatus.InProgress) {
    return step;
  }
  return {
    ...step,
    status: ThinkingStepStatus.Completed,
  };
}

function upsertTopLevelStep({
  step,
  parentById,
  topLevelOrder,
  topLevelWithoutId,
}: {
  step: ThinkingStep;
  parentById: Map<string, ThinkingStep>;
  topLevelOrder: string[];
  topLevelWithoutId: ThinkingStep[];
}): void {
  if (!step.id) {
    topLevelWithoutId.push(step);
    return;
  }

  const existing = parentById.get(step.id);
  const merged: ThinkingStep = {
    ...step,
    children: existing?.children,
  };
  if (!parentById.has(step.id)) {
    topLevelOrder.push(step.id);
  }
  parentById.set(step.id, merged);
}

function attachChildStep({
  parentStepId,
  step,
  parentById,
  childRegistries,
}: {
  parentStepId: string;
  step: ThinkingStep;
  parentById: Map<string, ThinkingStep>;
  childRegistries: Map<string, ChildRegistry>;
}): void {
  if (!parentById.has(parentStepId)) {
    recordOrphanChildDrop(parentStepId, step);
    return;
  }

  const registry = childRegistries.get(parentStepId) ?? {
    order: [],
    byId: new Map<string, ThinkingStep>(),
    withoutId: [],
  };
  childRegistries.set(parentStepId, registry);

  if (!step.id) {
    registry.withoutId.push(step);
    return;
  }

  if (!registry.byId.has(step.id)) {
    registry.order.push(step.id);
  }
  registry.byId.set(step.id, step);
}

function materializeStep(
  step: ThinkingStep | undefined,
  childRegistries: Map<string, ChildRegistry>,
): ThinkingStep | undefined {
  if (!step) {
    return undefined;
  }

  if (!step.id) {
    return step;
  }

  const registry = childRegistries.get(step.id);
  if (!registry) {
    return step;
  }

  const children = [
    ...registry.order.map((id) => registry.byId.get(id)).filter((child) => child != null),
    ...registry.withoutId,
  ];

  if (children.length === 0) {
    return step;
  }

  return {
    ...step,
    children,
  };
}

export function toValidatedThinkingStep(data: unknown): ThinkingStepData {
  if (!isRecord(data)) {
    throw new Error('ThinkingStep data is not an object');
  }
  if (typeof data.title !== 'string' || data.title.length === 0) {
    throw new Error('ThinkingStep missing required title');
  }
  if (typeof data.status !== 'string' || !isValidEnumValue(ThinkingStepStatus, data.status)) {
    throw new Error(`ThinkingStep has invalid status: ${formatUnknownValue(data.status)}`);
  }
  return {
    title: data.title,
    status: data.status,
    kind: parseThinkingStepKind(data.kind),
    body: typeof data.body === 'string' ? data.body : undefined,
    parentStep: typeof data.parentStep === 'string' ? data.parentStep : undefined,
    durationMs: parseDurationMs(data.durationMs),
  };
}

function parseThinkingStepKind(value: unknown): ThinkingStepKind {
  if (value === ThinkingStepKind.Planner) {
    return ThinkingStepKind.Planner;
  }
  return ThinkingStepKind.Tool;
}

function parseDurationMs(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value;
  }
  return undefined;
}

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === 'object' && data != null && !Array.isArray(data);
}

function isThinkingStepDataPart(part: AnalyticsChatMessagePart): part is ThinkingStepDataPart {
  return part.type === AnalyticsChatDataPartType.ThinkingStep;
}

function orphanChildKey(parentStepId: string, step: ThinkingStep): string {
  return `${parentStepId}|${step.id ?? step.title}`;
}

function recordOrphanChildDrop(parentStepId: string, step: ThinkingStep): void {
  const key = orphanChildKey(parentStepId, step);
  if (loggedOrphanChildKeys.has(key)) {
    return;
  }
  loggedOrphanChildKeys.add(key);
  orphanedChildDropCount += 1;
  logOrphanChildDropped({
    parentStepId,
    childId: step.id,
    childTitle: step.title,
  });
}
