import { useMemo } from 'react';
import type { AnalyticsChatMessage, ThinkingStep } from '../types/AnalyticsChatTypes';
import {
  extractTextFromMessage,
  extractSignalsFromMessage,
  extractThinkingStepsFromMessage,
} from '../adapters/adaptChatMessageParts';
import { useGetSignalCharts } from './useGetSignalCharts';

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
 * 2. Extracts signals from data-signal parts
 * 3. Converts signals to chart elements using useGetSignalCharts
 * 4. Extracts thinking steps with grouped reasoning parts
 *
 * @param message - The chat message to process
 * @param universeId - The universe ID for chart context
 * @returns Object containing textContent, chartElements, and thinkingSteps
 */
export function useGetAnalyticsChatMessageContent(
  message: AnalyticsChatMessage,
  universeId: number,
): AnalyticsChatMessageContent {
  const textContent = useMemo(() => extractTextFromMessage(message), [message]);

  const signals = useMemo(() => extractSignalsFromMessage(message), [message]);

  const chartElements = useGetSignalCharts(signals, universeId);

  const thinkingSteps = useMemo(() => extractThinkingStepsFromMessage(message), [message]);

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
