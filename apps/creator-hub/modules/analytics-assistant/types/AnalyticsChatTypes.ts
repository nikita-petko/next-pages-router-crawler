import type { UIMessage, UIDataTypes } from 'ai';
import type { MessageMetadata } from '@rbx/client-analytics-assistant-api/v2';
import type { Signal } from '@rbx/client-universe-analytics-insights/v1';
import type { VisualizationEnvelope } from './AssistantVisualizationArtifact';

export enum ThinkingStepStatus {
  InProgress = 'in_progress',
  Completed = 'completed',
  Error = 'error',
  Cancelled = 'cancelled',
}

export enum ThinkingStepKind {
  Planner = 'planner',
  Tool = 'tool',
}

// Remains consistent with BE type
// https://sourcegraph.rbx.com/github.rbx.com/Roblox/creator-analytics-assistant/-/blob/services/analytics-assistant-workflows/src/common/models/streaming_data.py?L35
export interface ThinkingStepData {
  title: string;
  status: ThinkingStepStatus;
  kind?: ThinkingStepKind;
  body?: string;
  parentStep?: string;
  durationMs?: number;
}

export interface ThinkingStep {
  id?: string;
  title: string;
  status: ThinkingStepStatus;
  kind?: ThinkingStepKind;
  body?: string;
  durationMs?: number;
  children?: ThinkingStep[];
}

// turnStartedAtMs is stream-only (not persisted in REST history).
export type AnalyticsChatMessageMetadata = MessageMetadata & { turnStartedAtMs?: number };

export const AnalyticsChatDataPartName = {
  Signal: 'signal',
  Visualization: 'visualization',
  ThinkingStep: 'thinking-step',
} as const;

type AnalyticsChatDataPartLabel = keyof typeof AnalyticsChatDataPartName;

export type AnalyticsChatDataPartName =
  (typeof AnalyticsChatDataPartName)[AnalyticsChatDataPartLabel];

export const AnalyticsChatDataPartType = {
  Signal: `data-${AnalyticsChatDataPartName.Signal}`,
  Visualization: `data-${AnalyticsChatDataPartName.Visualization}`,
  ThinkingStep: `data-${AnalyticsChatDataPartName.ThinkingStep}`,
} as const satisfies {
  [Label in AnalyticsChatDataPartLabel]: `data-${(typeof AnalyticsChatDataPartName)[Label]}`;
};

export type AnalyticsChatDataPartType =
  (typeof AnalyticsChatDataPartType)[AnalyticsChatDataPartLabel];

export interface AnalyticsChatDataParts extends UIDataTypes {
  [AnalyticsChatDataPartName.Signal]: Signal; // Raw API type, validated in adaptSignalDataPart
  [AnalyticsChatDataPartName.Visualization]: VisualizationEnvelope; // Raw artifact envelope, validated in adaptVisualizationDataPart
  [AnalyticsChatDataPartName.ThinkingStep]: ThinkingStepData;
}

type AnalyticsChatDataPartForLabel<Label extends AnalyticsChatDataPartLabel> = {
  type: (typeof AnalyticsChatDataPartType)[Label];
  id?: string;
  data: AnalyticsChatDataParts[(typeof AnalyticsChatDataPartName)[Label]];
};

export type SignalDataPart = AnalyticsChatDataPartForLabel<'Signal'>;

export type VisualizationDataPart = AnalyticsChatDataPartForLabel<'Visualization'>;

export type ThinkingStepDataPart = AnalyticsChatDataPartForLabel<'ThinkingStep'>;

export type AnalyticsChatDataPart = {
  [Label in AnalyticsChatDataPartLabel]: AnalyticsChatDataPartForLabel<Label>;
}[AnalyticsChatDataPartLabel];

export type AnalyticsChatMessage = UIMessage<AnalyticsChatMessageMetadata, AnalyticsChatDataParts>;
