import type React from 'react';
import {
  AnalyticsChatDataPartType,
  type AnalyticsChatDataPart,
  type AnalyticsChatMessage,
} from '../../types/AnalyticsChatTypes';
import { adaptSignalDataPart } from './adaptSignalDataPart';
import { adaptVisualizationDataPart } from './adaptVisualizationDataPart';

type AnalyticsChatMessagePart = AnalyticsChatMessage['parts'][number];
const ANALYTICS_CHAT_DATA_PART_TYPES = new Set<string>(Object.values(AnalyticsChatDataPartType));

type AdaptCanvasDataPartsOptions = {
  universeId: number;
  /** Explicitly threaded so assistant-generated visualization cards can fall back to conversation ownership. */
  conversationId: string | undefined;
};

export function adaptCanvasDataParts(
  parts: AnalyticsChatMessagePart[],
  { universeId, conversationId }: AdaptCanvasDataPartsOptions,
): React.ReactNode[] {
  const signalDedupKeys = new Set<string>();
  const elements: React.ReactNode[] = [];

  parts.forEach((part, partIndex) => {
    if (!isAnalyticsChatDataPart(part)) {
      return;
    }

    switch (part.type) {
      case AnalyticsChatDataPartType.Signal:
        elements.push(...adaptSignalDataPart(part, { universeId, signalDedupKeys }));
        return;
      case AnalyticsChatDataPartType.Visualization:
        elements.push(...adaptVisualizationDataPart(part, partIndex, { conversationId }));
        return;
      case AnalyticsChatDataPartType.ThinkingStep:
        return;
      default:
        assertUnhandledAnalyticsChatDataPart(part);
    }
  });

  return elements;
}

function isAnalyticsChatDataPart(part: AnalyticsChatMessagePart): part is AnalyticsChatDataPart {
  return ANALYTICS_CHAT_DATA_PART_TYPES.has(part.type);
}

function assertUnhandledAnalyticsChatDataPart(part: never): never {
  void part;
  throw new Error('Unhandled analytics chat data part');
}
