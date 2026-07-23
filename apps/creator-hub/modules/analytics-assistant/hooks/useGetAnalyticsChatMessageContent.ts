import type React from 'react';
import { useMemo } from 'react';
import { adaptCanvasDataParts } from '../adapters/streamingProtocol/adaptCanvasDataParts';
import { adaptTextParts } from '../adapters/streamingProtocol/adaptTextParts';
import { adaptThinkingStepParts } from '../adapters/streamingProtocol/adaptThinkingStepParts';
import type { AnalyticsChatMessage, ThinkingStep } from '../types/AnalyticsChatTypes';

export interface AnalyticsChatMessageContent {
  /** The concatenated text content from all text parts */
  textContent: string;
  /** React elements representing the charts for this message's signals */
  chartElements: React.ReactNode[];
  /** Thinking steps extracted from the message */
  thinkingSteps: ThinkingStep[];
}

/**
 * Hook that extracts and processes content from an AnalyticsChatMessage.
 *
 * This hook:
 * 1. Extracts text content from text parts
 * 2. Extracts chart data parts in message order
 * 3. Converts signals and visualization artifacts to canvas elements
 * 4. Extracts thinking steps with grouped reasoning parts
 *
 * @param message - The chat message to process
 * @param universeId - The universe ID for chart context
 * @param conversationId - Active conversation ID used as the fallback watermark subject for assistant visualizations.
 * @returns Object containing textContent, chartElements, and thinkingSteps
 */
export function useGetAnalyticsChatMessageContent(
  message: AnalyticsChatMessage,
  universeId: number,
  conversationId: string | undefined,
  options?: { finalizeInProgress?: boolean },
): AnalyticsChatMessageContent {
  const textContent = useMemo(() => adaptTextParts(message.parts), [message.parts]);

  const chartElements = useMemo(() => {
    return message.role === 'assistant'
      ? adaptCanvasDataParts(message.parts, { universeId, conversationId })
      : [];
  }, [conversationId, message.parts, message.role, universeId]);

  const thinkingSteps = useMemo(
    () =>
      message.role === 'assistant'
        ? adaptThinkingStepParts(message.parts, {
            finalizeInProgress: options?.finalizeInProgress,
          })
        : [],
    [message.parts, message.role, options?.finalizeInProgress],
  );

  return useMemo(
    () => ({
      textContent,
      chartElements,
      thinkingSteps,
    }),
    [textContent, chartElements, thinkingSteps],
  );
}

export default useGetAnalyticsChatMessageContent;
