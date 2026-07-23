// eslint-disable-next-line eslint-comments/disable-enable-pair -- Avoid breaking test environments by importing directly
/* eslint-disable no-restricted-imports -- Avoid breaking test environments by importing directly */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
  FC,
} from 'react';
import type { UIMessage } from '@ai-sdk/react';
import type { AnalyticsChatMessage } from '@modules/analytics-assistant/types/AnalyticsChatTypes';
import useAnalyticsChat from '@modules/analytics-assistant/hooks/useAnalyticsChat';

export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

/** Type for sendMessage matching the Vercel AI SDK interface */
export type SendMessageFn = ReturnType<typeof useAnalyticsChat>['sendMessage'];

export interface AIChatContextValue {
  messages: AnalyticsChatMessage[];
  status: ChatStatus;
  error: Error | undefined;
  selectedMessageId: string | null;
  canvasElement: ReactNode | null;
  sendMessage: SendMessageFn;
  setSelectedMessage: (id: string, element: ReactNode) => void;
  clearSelection: () => void;
}

export const AIChatContext = createContext<AIChatContextValue | undefined>(undefined);

interface AIChatProviderProps {
  universeId: number;
  conversationId?: string;
  initialMessages?: UIMessage[];
  onConversationCreated?: (conversationId: string) => void;
}

export const AIChatProvider: FC<React.PropsWithChildren<AIChatProviderProps>> = ({
  universeId,
  conversationId,
  initialMessages,
  onConversationCreated,
  children,
}) => {
  const { messages, status, error, sendMessage } = useAnalyticsChat({
    universeId,
    conversationId,
    messages: initialMessages,
    onConversationCreated,
  });
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [canvasElement, setCanvasElement] = useState<ReactNode | null>(null);

  const setSelectedMessage = useCallback((id: string, element: ReactNode) => {
    setSelectedMessageId(id);
    setCanvasElement(element);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedMessageId(null);
    setCanvasElement(null);
  }, []);

  const value = useMemo(
    (): AIChatContextValue => ({
      messages: messages as AnalyticsChatMessage[],
      status: status as ChatStatus,
      error,
      sendMessage,
      selectedMessageId,
      canvasElement,
      setSelectedMessage,
      clearSelection,
    }),
    [
      messages,
      status,
      error,
      sendMessage,
      selectedMessageId,
      canvasElement,
      setSelectedMessage,
      clearSelection,
    ],
  );

  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>;
};

export const useAIChatContext = (): AIChatContextValue => {
  const context = useContext(AIChatContext);
  if (!context) {
    throw new Error('useAIChatContext must be used within an AIChatProvider');
  }
  return context;
};

export default AIChatProvider;
