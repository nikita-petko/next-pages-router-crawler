import { logAnalyticsError } from '@modules/charts-generic';
import { Signal } from '@rbx/clients/universeAnalyticsInsights/v2';
import { isValidEnumValue } from '@modules/miscellaneous/common/utils';
import {
  ThinkingStepStatus,
  type AnalyticsChatMessage,
  type ThinkingStep,
  type ThinkingStepData,
} from '../types/AnalyticsChatTypes';
import type { SummaryReportUISignal } from '../types/AssistantUISignal';
import { adaptValidatedSignal } from './adaptSummaryReportInsight';
import { toValidatedSignal } from '../validation/makeValidatedInsightsV2API';

/**
 * Extracts text content from an AnalyticsChatMessage by joining all text parts.
 *
 * @param message - The chat message to extract text from
 * @returns The concatenated text content from all text parts
 */
export function extractTextFromMessage(message: AnalyticsChatMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/**
 * Extracts and adapts signals from an AnalyticsChatMessage's data-signal parts.
 * Only processes assistant messages; returns empty array for user messages.
 *
 * @param message - The chat message to extract signals from
 * @returns Array of SummaryReportUISignal objects
 */
export function extractSignalsFromMessage(message: AnalyticsChatMessage): SummaryReportUISignal[] {
  if (message.role !== 'assistant') {
    return [];
  }

  return message.parts
    .filter((part): part is { type: 'data-signal'; data: Signal } => part.type === 'data-signal')
    .map((part) => {
      try {
        const validatedSignal = toValidatedSignal(part.data);
        return adaptValidatedSignal(validatedSignal);
      } catch (err) {
        logAnalyticsError(`Error validating signal: ${err}`);
        return undefined;
      }
    })
    .filter((signal): signal is SummaryReportUISignal => signal !== undefined);
}

/**
 * Validates and narrows unknown data into a ThinkingStepData,
 * throwing if required fields are missing or invalid.
 */
export function toValidatedThinkingStep(data: unknown): ThinkingStepData {
  if (typeof data !== 'object' || data == null) {
    throw new Error('ThinkingStep data is not an object');
  }
  const record = data as Record<string, unknown>;
  if (typeof record.title !== 'string' || record.title.length === 0) {
    throw new Error('ThinkingStep missing required title');
  }
  if (typeof record.status !== 'string' || !isValidEnumValue(ThinkingStepStatus, record.status)) {
    throw new Error(`ThinkingStep has invalid status: ${String(record.status)}`);
  }
  return {
    title: record.title,
    status: record.status,
    body: typeof record.body === 'string' ? record.body : undefined,
    parentStep: typeof record.parentStep === 'string' ? record.parentStep : undefined,
  };
}

/**
 * Extracts thinking steps from a message and groups child steps under their parent
 * via the wire-level `parentStep` field. Invalid thinking step data is logged and skipped.
 */
export function extractThinkingStepsFromMessage(message: AnalyticsChatMessage): ThinkingStep[] {
  if (message.role !== 'assistant') {
    return [];
  }

  const parentById = new Map<string, ThinkingStep>();
  const topLevel: ThinkingStep[] = [];

  message.parts.forEach((part) => {
    if (part.type !== 'data-thinking-step') {
      return;
    }
    try {
      const wireData = toValidatedThinkingStep(part.data);
      const step: ThinkingStep = {
        id: (part as { id?: string }).id,
        title: wireData.title,
        status: wireData.status,
        body: wireData.body,
      };

      if (wireData.parentStep) {
        const parent = parentById.get(wireData.parentStep);
        if (parent) {
          parent.children = parent.children ?? [];
          parent.children.push(step);
        }
      } else {
        if (step.id) {
          parentById.set(step.id, step);
        }
        topLevel.push(step);
      }
    } catch (err) {
      logAnalyticsError(`Error validating thinking step: ${err}`);
    }
  });

  return topLevel;
}
