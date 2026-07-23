import { UIMessage, UIDataTypes } from 'ai';
import { Signal } from '@rbx/client-universe-analytics-insights/v1';

export enum ThinkingStepStatus {
  InProgress = 'in_progress',
  Completed = 'completed',
  Error = 'error',
}

// Remains consistent with BE type
// https://sourcegraph.rbx.com/github.rbx.com/Roblox/creator-analytics-assistant/-/blob/services/analytics-assistant-workflows/src/common/models/streaming_data.py?L35
export interface ThinkingStepData {
  title: string;
  status: ThinkingStepStatus;
  body?: string;
  parentStep?: string;
}

export interface ThinkingStep {
  id?: string;
  title: string;
  status: ThinkingStepStatus;
  body?: string;
  children?: ThinkingStep[];
}

export interface AnalyticsChatDataParts extends UIDataTypes {
  signal: Signal; // Raw API type, validated in extractSignalsFromMessage
  'thinking-step': ThinkingStepData;
}

// AnalyticsChatDataParts extends UIDataTypes (Record<string, unknown>), which adds
// an index signature that widens `keyof` to `string`. ExplicitKeysOf strips the
// index signature so AnalyticsChatDataPartType resolves to the narrow union
// 'data-signal' | 'data-thinking-step' instead of `data-${string}`.
type ExplicitKeysOf<T> = {
  [K in keyof T as string extends K ? never : K]: T[K];
};

export type AnalyticsChatDataPartType =
  `data-${keyof ExplicitKeysOf<AnalyticsChatDataParts> & string}`;

export type AnalyticsChatMessage = UIMessage<unknown, AnalyticsChatDataParts>;
