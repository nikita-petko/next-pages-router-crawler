import type { ReactNode, FC } from 'react';
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import type { FeedbackRating } from '@rbx/conv-ai-provider';
import { useAnalyticsChat } from '@modules/analytics-assistant/hooks/useAnalyticsChat';
import type { AnalyticsChatMessage } from '@modules/analytics-assistant/types/AnalyticsChatTypes';

export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

/** Type for sendMessage matching the Vercel AI SDK interface */
export type SendMessageFn = ReturnType<typeof useAnalyticsChat>['sendMessage'];

type ArtifactEntry = {
  messageId: string;
  element: ReactNode;
};

type ArtifactScrollHandler = (messageId: string) => void;

export interface AIChatContextValue {
  /** Active backend conversation id; omitted only before a new chat creates its conversation. */
  conversationId?: string;
  messages: AnalyticsChatMessage[];
  status: ChatStatus;
  error: Error | undefined;
  selectedMessageId: string | null;
  canvasElement: ReactNode | null;
  isCanvasOpen: boolean;
  selectedArtifactIndex: number;
  artifactCount: number;
  canSelectPreviousArtifact: boolean;
  canSelectNextArtifact: boolean;
  sendMessage: SendMessageFn;
  canSendMessage: boolean;
  stopGeneration: () => void;
  registerMessageArtifacts: (messageId: string, element: ReactNode) => void;
  unregisterMessageArtifacts: (messageId: string) => void;
  selectMessageArtifact: (messageId: string) => void;
  clearSelection: () => void;
  openCanvas: () => void;
  openLatestArtifact: () => void;
  closeCanvas: () => void;
  toggleCanvas: () => void;
  selectPreviousArtifact: () => void;
  selectNextArtifact: () => void;
  registerArtifactScrollHandler: (handler: ArtifactScrollHandler | null) => void;
  submittedFeedbackByMessageId: Record<string, FeedbackRating>;
  markMessageFeedbackSubmitted: (messageId: string, rating: FeedbackRating) => void;
}

export const AIChatContext = createContext<AIChatContextValue | undefined>(undefined);

interface AIChatProviderProps {
  universeId: number;
  conversationId?: string;
  initialMessages?: AnalyticsChatMessage[];
  onConversationCreated?: (conversationId: string) => void;
  inProgressMessageId?: string;
  shouldResume?: boolean;
  canSendMessage?: boolean;
}

const getNearestArtifactMessageId = (
  messages: AnalyticsChatMessage[],
  orderedArtifactEntries: ArtifactEntry[],
  selectedMessageId: string,
) => {
  const selectedMessageIndex = messages.findIndex((message) => message.id === selectedMessageId);

  if (selectedMessageIndex === -1) {
    return orderedArtifactEntries[orderedArtifactEntries.length - 1]?.messageId ?? null;
  }

  const messageIndexById = new Map(messages.map((message, index) => [message.id, index] as const));
  let previousEntry: ArtifactEntry | undefined;
  for (let index = orderedArtifactEntries.length - 1; index >= 0; index -= 1) {
    const entry = orderedArtifactEntries[index];
    if ((messageIndexById.get(entry.messageId) ?? -1) < selectedMessageIndex) {
      previousEntry = entry;
      break;
    }
  }

  if (previousEntry) {
    return previousEntry.messageId;
  }

  return (
    orderedArtifactEntries.find(
      (entry) => (messageIndexById.get(entry.messageId) ?? -1) > selectedMessageIndex,
    )?.messageId ?? null
  );
};

export const AIChatProvider: FC<React.PropsWithChildren<AIChatProviderProps>> = ({
  universeId,
  conversationId: initialConversationId,
  initialMessages,
  onConversationCreated,
  inProgressMessageId,
  shouldResume,
  canSendMessage = true,
  children,
}) => {
  const {
    messages,
    status,
    error,
    sendMessage,
    stop,
    conversationId: activeConversationId,
  } = useAnalyticsChat({
    universeId,
    conversationId: initialConversationId,
    messages: initialMessages,
    onConversationCreated,
    inProgressMessageId,
    shouldResume,
    canSendMessage,
  });
  const analyticsMessages = messages;
  const [artifactElementsByMessageId, setArtifactElementsByMessageId] = useState<
    Record<string, ReactNode>
  >({});
  const [selectedArtifactMessageId, setSelectedArtifactMessageId] = useState<string | null>(null);
  const [isCanvasOpen, setIsCanvasOpen] = useState<boolean>(true);
  const [isFollowingLatestArtifact, setIsFollowingLatestArtifact] = useState<boolean>(true);
  const [submittedFeedbackByMessageId, setSubmittedFeedbackByMessageId] = useState<
    Record<string, FeedbackRating>
  >({});
  const artifactScrollHandlerRef = useRef<ArtifactScrollHandler | null>(null);

  const orderedArtifactEntries = useMemo(
    () =>
      analyticsMessages
        .filter((message) => artifactElementsByMessageId[message.id] !== undefined)
        .map((message) => ({
          messageId: message.id,
          element: artifactElementsByMessageId[message.id],
        })),
    [analyticsMessages, artifactElementsByMessageId],
  );
  const selectedArtifactIndex = useMemo(
    () =>
      orderedArtifactEntries.findIndex((entry) => entry.messageId === selectedArtifactMessageId),
    [orderedArtifactEntries, selectedArtifactMessageId],
  );
  const latestArtifactMessageId =
    orderedArtifactEntries[orderedArtifactEntries.length - 1]?.messageId ?? null;
  const selectedArtifactEntry =
    selectedArtifactIndex >= 0 ? orderedArtifactEntries[selectedArtifactIndex] : null;
  const canvasElement = selectedArtifactEntry?.element ?? null;
  const selectedMessageId = selectedArtifactEntry?.messageId ?? null;
  const artifactCount = orderedArtifactEntries.length;
  const canSelectPreviousArtifact = selectedArtifactIndex > 0;
  const canSelectNextArtifact =
    selectedArtifactIndex >= 0 && selectedArtifactIndex < orderedArtifactEntries.length - 1;

  /* oxlint-disable react/react-compiler -- pre-existing artifact-selection sync effect; setState mirrors the derived artifact list into selection state */
  useEffect(() => {
    if (orderedArtifactEntries.length === 0) {
      setSelectedArtifactMessageId(null);
      return;
    }

    if (selectedArtifactMessageId === null) {
      setSelectedArtifactMessageId(latestArtifactMessageId);
      if (isFollowingLatestArtifact) {
        setIsCanvasOpen(true);
      }
      return;
    }

    if (isFollowingLatestArtifact) {
      setSelectedArtifactMessageId(latestArtifactMessageId);
      setIsCanvasOpen(true);
      return;
    }

    if (selectedArtifactIndex !== -1) {
      return;
    }

    setSelectedArtifactMessageId(
      getNearestArtifactMessageId(
        analyticsMessages,
        orderedArtifactEntries,
        selectedArtifactMessageId,
      ),
    );
  }, [
    analyticsMessages,
    isFollowingLatestArtifact,
    latestArtifactMessageId,
    orderedArtifactEntries,
    selectedArtifactIndex,
    selectedArtifactMessageId,
  ]);
  /* oxlint-enable react/react-compiler */

  const registerMessageArtifacts = useCallback((messageId: string, element: ReactNode) => {
    setArtifactElementsByMessageId((prev) => {
      if (prev[messageId] === element) {
        return prev;
      }

      return { ...prev, [messageId]: element };
    });
  }, []);

  const unregisterMessageArtifacts = useCallback((messageId: string) => {
    setArtifactElementsByMessageId((prev) => {
      if (prev[messageId] === undefined) {
        return prev;
      }

      const { [messageId]: _removedElement, ...rest } = prev;
      return rest;
    });
  }, []);

  const selectMessageArtifact = useCallback(
    (messageId: string) => {
      if (artifactElementsByMessageId[messageId] === undefined) {
        return;
      }

      setSelectedArtifactMessageId(messageId);
      setIsCanvasOpen(true);
      setIsFollowingLatestArtifact(false);
    },
    [artifactElementsByMessageId],
  );

  const openLatestArtifact = useCallback(() => {
    if (latestArtifactMessageId === null) {
      return;
    }

    setSelectedArtifactMessageId(latestArtifactMessageId);
    setIsCanvasOpen(true);
    setIsFollowingLatestArtifact(true);
  }, [latestArtifactMessageId]);

  const registerArtifactScrollHandler = useCallback((handler: ArtifactScrollHandler | null) => {
    artifactScrollHandlerRef.current = handler;
  }, []);

  const scrollToArtifactMessage = useCallback((messageId: string) => {
    artifactScrollHandlerRef.current?.(messageId);
  }, []);

  const selectPreviousArtifact = useCallback(() => {
    if (!canSelectPreviousArtifact) {
      return;
    }

    const messageId = orderedArtifactEntries[selectedArtifactIndex - 1].messageId;
    scrollToArtifactMessage(messageId);
    setSelectedArtifactMessageId(messageId);
    setIsCanvasOpen(true);
    setIsFollowingLatestArtifact(false);
  }, [
    canSelectPreviousArtifact,
    orderedArtifactEntries,
    scrollToArtifactMessage,
    selectedArtifactIndex,
  ]);

  const selectNextArtifact = useCallback(() => {
    if (!canSelectNextArtifact) {
      return;
    }

    const messageId = orderedArtifactEntries[selectedArtifactIndex + 1].messageId;
    scrollToArtifactMessage(messageId);
    setSelectedArtifactMessageId(messageId);
    setIsCanvasOpen(true);
    setIsFollowingLatestArtifact(false);
  }, [
    canSelectNextArtifact,
    orderedArtifactEntries,
    scrollToArtifactMessage,
    selectedArtifactIndex,
  ]);

  const closeCanvas = useCallback(() => {
    setIsCanvasOpen(false);
    setIsFollowingLatestArtifact(false);
  }, []);

  const openCanvas = useCallback(() => {
    if (selectedArtifactMessageId === null && latestArtifactMessageId !== null) {
      setSelectedArtifactMessageId(latestArtifactMessageId);
    }

    setIsCanvasOpen(true);
  }, [latestArtifactMessageId, selectedArtifactMessageId]);

  const toggleCanvas = useCallback(() => {
    if (isCanvasOpen) {
      closeCanvas();
      return;
    }

    openCanvas();
  }, [closeCanvas, isCanvasOpen, openCanvas]);

  const clearSelection = useCallback(() => {
    setSelectedArtifactMessageId(null);
    setArtifactElementsByMessageId({});
    setIsFollowingLatestArtifact(true);
  }, []);

  const markMessageFeedbackSubmitted = useCallback((messageId: string, rating: FeedbackRating) => {
    setSubmittedFeedbackByMessageId((prev) => {
      if (prev[messageId] !== undefined) {
        return prev;
      }

      return { ...prev, [messageId]: rating };
    });
  }, []);

  const value = useMemo(
    (): AIChatContextValue => ({
      conversationId: activeConversationId,
      messages: analyticsMessages,
      status: status as ChatStatus,
      error,
      sendMessage,
      canSendMessage,
      stopGeneration: stop,
      selectedMessageId,
      canvasElement,
      isCanvasOpen,
      selectedArtifactIndex,
      artifactCount,
      canSelectPreviousArtifact,
      canSelectNextArtifact,
      registerMessageArtifacts,
      unregisterMessageArtifacts,
      selectMessageArtifact,
      clearSelection,
      openCanvas,
      openLatestArtifact,
      closeCanvas,
      toggleCanvas,
      selectPreviousArtifact,
      selectNextArtifact,
      registerArtifactScrollHandler,
      submittedFeedbackByMessageId,
      markMessageFeedbackSubmitted,
    }),
    [
      activeConversationId,
      analyticsMessages,
      status,
      error,
      sendMessage,
      canSendMessage,
      stop,
      selectedMessageId,
      canvasElement,
      isCanvasOpen,
      selectedArtifactIndex,
      artifactCount,
      canSelectPreviousArtifact,
      canSelectNextArtifact,
      registerMessageArtifacts,
      unregisterMessageArtifacts,
      selectMessageArtifact,
      clearSelection,
      openCanvas,
      openLatestArtifact,
      closeCanvas,
      toggleCanvas,
      selectPreviousArtifact,
      selectNextArtifact,
      registerArtifactScrollHandler,
      submittedFeedbackByMessageId,
      markMessageFeedbackSubmitted,
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
