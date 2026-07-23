import type { UIMessagePart, UITools } from 'ai';
import type { ContentPart, DataPart } from '@rbx/client-analytics-assistant-api/v2';
import logAnalyticsError from '@modules/charts-generic/utils/logAnalyticsError';
import type { ConversationItem } from '@modules/react-query/analyticsAssistant';
import {
  AnalyticsChatDataPartType,
  type AnalyticsChatDataParts,
  type AnalyticsChatMessage,
} from '../types/AnalyticsChatTypes';

export function isTextContentPart(
  part: ContentPart,
): part is ContentPart & { type: 'text'; text: string } {
  return part.type === 'text' && typeof part.text === 'string';
}

export function isDataContentPart(
  part: ContentPart,
): part is ContentPart & { type: 'data'; data: DataPart } {
  return (
    part.type === 'data' &&
    typeof part.data === 'object' &&
    part.data != null &&
    typeof part.data.type === 'string'
  );
}

/**
 * Transforms a backend ContentPart into an AI SDK UIMessagePart.
 *
 * - Text parts (type: 'text') map to { type: 'text', text: string }
 * - Data parts (type: 'data') with supported `data-*` types map to AI SDK data parts
 * - Unrecognized or invalid parts are logged and skipped (returns null).
 */
function transformContentPartToUIPart(
  part: ContentPart,
): UIMessagePart<AnalyticsChatDataParts, UITools> | null {
  if (isTextContentPart(part)) {
    return { type: 'text' as const, text: part.text };
  }
  if (isDataContentPart(part)) {
    const id = part.data.id ?? undefined;
    switch (part.data.type) {
      case AnalyticsChatDataPartType.Signal:
        return { type: AnalyticsChatDataPartType.Signal, id, data: part.data.data };
      case AnalyticsChatDataPartType.Visualization:
        return { type: AnalyticsChatDataPartType.Visualization, id, data: part.data.data };
      case AnalyticsChatDataPartType.ThinkingStep:
        return {
          type: AnalyticsChatDataPartType.ThinkingStep,
          id,
          data: part.data.data,
        };
      default: {
        logAnalyticsError(`Unsupported data part type: ${part.data.type}`);
        return null;
      }
    }
  }
  return null;
}

/**
 * Transforms backend ConversationItem array to AnalyticsChatMessage array for the AI SDK.
 *
 * Backend format:
 * { id: string, type: 'message', message: { role, content: ContentPart[] } }
 *
 * AnalyticsChatMessage format:
 * { id: string, role: 'user' | 'assistant', parts: Array<TextUIPart | DataUIPart<signal>> }
 */
export function transformConversationItemsToUIMessages(
  items: ConversationItem[],
): AnalyticsChatMessage[] {
  // Filter to only message items with valid message content
  const messageItems = items.filter(
    (item): item is ConversationItem & { message: NonNullable<ConversationItem['message']> } =>
      item.type === 'message' && item.message != null,
  );

  // Transform to AnalyticsChatMessage format with multi-part support
  return messageItems.map((item) => ({
    id: item.id,
    role: item.message.role,
    ...(item.message.metadata != null ? { metadata: item.message.metadata } : {}),
    parts: item.message.content
      .map(transformContentPartToUIPart)
      .filter(
        (part): part is NonNullable<UIMessagePart<AnalyticsChatDataParts, UITools>> => part != null,
      ),
  }));
}

export default transformConversationItemsToUIMessages;
