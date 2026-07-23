import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { LogLevel } from '@microsoft/signalr';
import type { AbstractChat } from 'ai';
import { useNavigationConfigs } from '@rbx/creator-hub-navigation';
import {
  getRealTimeNotificationsBasePath,
  useSignalR,
  type TSignalRCallback,
  type SignalRConnectionState,
  type SignalRConnectionStateMeta,
} from '@rbx/signalr-userhub-client';
import {
  cancelMessage,
  type ConversationItem,
  ConversationOrder,
  createConversation,
  listConversationItems,
  MessageStatus,
} from '@modules/react-query/analyticsAssistant';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { ANALYTICS_ASSISTANT_NAMESPACE } from '../constants/signalr';
import AnalyticsSignalRTransport from '../transport/AnalyticsSignalRTransport';
import {
  AnalyticsChatDataPartType,
  ThinkingStepStatus,
  type AnalyticsChatMessage,
  type ThinkingStepDataPart,
} from '../types/AnalyticsChatTypes';
import { transformConversationItemsToUIMessages } from '../utils/transformConversationItems';

/**
 * Number of definitive connection-death signals tolerated for a single turn
 * before giving up on auto-recovery and falling back to the persisted-history
 * backstop. Each give-up of the SignalR retry/reconnect cycle emits one
 * definitive death, so this bounds recovery by connection signals (never a
 * timer, which would false-fire on legitimately-silent long tools).
 */
const MAX_DEFINITIVE_REOPEN_ATTEMPTS = 3;

/**
 * Coalesce AI SDK message-store notifications during backlog replay (mid-stream
 * refresh / reconnect) so React's nested-update guard is not tripped.
 */
const CHAT_MESSAGES_THROTTLE_MS = 50;

const isTurnInProgress = (status: string): boolean =>
  status === 'streaming' || status === 'submitted';

export interface UseAnalyticsChatOptions {
  universeId: number;
  conversationId?: string;
  messages?: AnalyticsChatMessage[];
  onConversationCreated?: (conversationId: string) => void;
  inProgressMessageId?: string;
  shouldResume?: boolean;
  canSendMessage?: boolean;
}

const isThinkingStepDataPart = (
  part: AnalyticsChatMessage['parts'][number],
): part is ThinkingStepDataPart => part.type === AnalyticsChatDataPartType.ThinkingStep;

const markLastAssistantInProgressThinkingSteps = (
  messages: AnalyticsChatMessage[],
  status: ThinkingStepStatus.Cancelled | ThinkingStepStatus.Error,
): AnalyticsChatMessage[] => {
  const lastAssistantIndex = messages.findLastIndex((message) => message.role === 'assistant');
  if (lastAssistantIndex === -1) {
    return messages;
  }

  let didChange = false;
  const updatedMessages = [...messages];
  const message = updatedMessages[lastAssistantIndex];
  const updatedParts = message.parts.map((part) => {
    if (!isThinkingStepDataPart(part)) {
      return part;
    }

    if (part.data.status !== ThinkingStepStatus.InProgress) {
      return part;
    }

    didChange = true;
    return {
      ...part,
      data: {
        ...part.data,
        status,
      },
    };
  });

  if (!didChange) {
    return messages;
  }

  updatedMessages[lastAssistantIndex] = {
    ...message,
    parts: updatedParts,
  };

  return updatedMessages;
};

export const markLastAssistantThinkingStepsCancelled = (
  messages: AnalyticsChatMessage[],
): AnalyticsChatMessage[] =>
  markLastAssistantInProgressThinkingSteps(messages, ThinkingStepStatus.Cancelled);

export const markLastAssistantThinkingStepsErrored = (
  messages: AnalyticsChatMessage[],
): AnalyticsChatMessage[] =>
  markLastAssistantInProgressThinkingSteps(messages, ThinkingStepStatus.Error);

/**
 * Drop the trailing in-progress assistant message so a subsequent
 * `resumeStream()` rebuilds it cleanly from the replayed backlog. The AI SDK
 * seeds a resumed stream from `lastMessage` only when it is an assistant
 * message and a `start` chunk does not clear existing parts, so replaying from
 * sequence 0 against a partial assistant message would duplicate its content.
 */
export const dropLastInProgressAssistantMessage = (
  messages: AnalyticsChatMessage[],
): AnalyticsChatMessage[] => {
  if (messages.length === 0) {
    return messages;
  }
  const last = messages[messages.length - 1];
  if (last.role !== 'assistant') {
    return messages;
  }
  return messages.slice(0, -1);
};

/**
 * Rebuild the message list from persisted conversation history. Assumes items
 * are in chronological (ascending) order. If the latest turn is still
 * in-progress on the backend, surface the failure on its in-progress thinking
 * steps so the UI does not spin forever.
 */
export const reconcileMessagesFromHistory = (items: ConversationItem[]): AnalyticsChatMessage[] => {
  const rebuilt = transformConversationItemsToUIMessages(items);
  const lastItem = items.at(-1);
  const stillInProgress = lastItem?.message?.status === MessageStatus.InProgress;
  return stillInProgress ? markLastAssistantThinkingStepsErrored(rebuilt) : rebuilt;
};

export function useAnalyticsChat({
  universeId,
  conversationId: initialConversationId,
  messages,
  onConversationCreated,
  inProgressMessageId,
  shouldResume = false,
  canSendMessage = true,
}: UseAnalyticsChatOptions) {
  const { settings, isFetched } = useSettings();
  const { environment } = useNavigationConfigs();
  const basePath = getRealTimeNotificationsBasePath(environment);

  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<
    Parameters<AbstractChat<AnalyticsChatMessage>['sendMessage']>[0] | null
  >(null);

  const transport = useMemo(() => {
    if (conversationId) {
      return new AnalyticsSignalRTransport({
        universeId,
        conversationId,
        namespace: ANALYTICS_ASSISTANT_NAMESPACE,
      });
    }
    return undefined;
  }, [universeId, conversationId]);

  // Refs let the (stable) connection-state callback act on the latest values
  // without re-registering the SignalR listener on every render. They are synced
  // from an effect (below) so we never write refs during render.
  const transportRef = useRef(transport);
  const conversationIdRef = useRef(conversationId);
  const statusRef = useRef<string>('ready');
  const resumeStreamRef = useRef<(() => Promise<void>) | null>(null);
  const stopRef = useRef<(() => Promise<void>) | null>(null);
  const setMessagesRef = useRef<
    ((updater: (messages: AnalyticsChatMessage[]) => AnalyticsChatMessage[]) => void) | null
  >(null);
  const prevConnectionStateRef = useRef<SignalRConnectionState>('connected');
  const definitiveDeathCountRef = useRef(0);
  const isRecoveringRef = useRef(false);

  // Worst-case backstop: rebuild the message list from persisted conversation
  // history (the source of truth). If the turn is genuinely still incomplete,
  // surface the failure on the in-progress thinking steps so the UI never spins.
  const reconcileAbandonedTurn = useCallback(async () => {
    const targetConversationId = conversationIdRef.current;
    const applyMessages = setMessagesRef.current;
    const abortInFlightTurn = stopRef.current;
    if (!targetConversationId || !applyMessages) {
      return;
    }

    // Abort the in-flight SDK turn before rebuilding from history. Nothing closes
    // the transport's ReadableStream on a definitive socket death, so the SDK
    // would otherwise stay `streaming`/`submitted` indefinitely: the composer
    // (gated on that status) would never re-enable, and a later reconnect would
    // re-trigger recovery against a turn we've already given up on. stop()
    // returns status to `ready` and tears down the transport stream via its
    // cancel handler.
    if (abortInFlightTurn) {
      try {
        await abortInFlightTurn();
      } catch (stopError: unknown) {
        console.error('[useAnalyticsChat] Failed to abort turn during reconcile', stopError);
      }
    }

    try {
      // Request ascending (oldest-first) explicitly: reconcileMessagesFromHistory
      // relies on chronological order, and the endpoint default is descending.
      const response = await listConversationItems(targetConversationId, {
        order: ConversationOrder.Ascending,
      });
      applyMessages(() => reconcileMessagesFromHistory(response.data ?? []));
    } catch (reconcileError: unknown) {
      console.error('[useAnalyticsChat] Failed to reconcile abandoned stream', reconcileError);
      applyMessages(markLastAssistantThinkingStepsErrored);
    }
  }, []);

  // Recover a turn whose live chunks were missed during a connection failure:
  // in-place backfill if the stream is still open, otherwise drop the partial
  // assistant message and re-open the stream so the replay rebuilds it cleanly.
  const recoverStream = useCallback(() => {
    const activeTransport = transportRef.current;
    if (!activeTransport || isRecoveringRef.current) {
      return;
    }
    if (!isTurnInProgress(statusRef.current)) {
      return;
    }

    if (activeTransport.hasActiveStream()) {
      isRecoveringRef.current = true;
      activeTransport
        .reconcileActiveStream()
        .catch((error: unknown) => {
          console.error('[useAnalyticsChat] In-place stream reconcile failed', error);
        })
        .finally(() => {
          isRecoveringRef.current = false;
        });
      return;
    }

    const resume = resumeStreamRef.current;
    const applyMessages = setMessagesRef.current;
    if (!resume || !applyMessages) {
      return;
    }
    applyMessages(dropLastInProgressAssistantMessage);
    void resume().catch((error: unknown) => {
      console.error('[useAnalyticsChat] Stream re-open failed', error);
    });
  }, []);

  const handleDefinitiveDeath = useCallback(() => {
    if (!isTurnInProgress(statusRef.current)) {
      return;
    }
    definitiveDeathCountRef.current += 1;
    if (definitiveDeathCountRef.current <= MAX_DEFINITIVE_REOPEN_ATTEMPTS) {
      recoverStream();
    } else {
      void reconcileAbandonedTurn();
    }
  }, [recoverStream, reconcileAbandonedTurn]);

  const handleConnectionStateChange = useCallback(
    (state: SignalRConnectionState, meta: SignalRConnectionStateMeta) => {
      const previousState = prevConnectionStateRef.current;
      prevConnectionStateRef.current = state;

      if (
        state === 'connected' &&
        (previousState === 'reconnecting' || previousState === 'disconnected')
      ) {
        // Connection recovered mid-turn: backfill the chunks missed during the gap.
        recoverStream();
      } else if (state === 'disconnected' && meta.definitive) {
        handleDefinitiveDeath();
      }
    },
    [recoverStream, handleDefinitiveDeath],
  );

  const handleSignalRNotification: TSignalRCallback = useMemo(
    () => (namespace: string, detail: string) => {
      transport?.handleSignalRMessage(namespace, detail);
    },
    [transport],
  );

  useSignalR(handleSignalRNotification, basePath, {
    crossTab: {
      enabled: settings.enableSignalRCrossTab,
      isLoading: !isFetched,
    },
    logLevel: environment === 'production' ? LogLevel.Error : LogLevel.Trace,
    onConnectionStateChange: handleConnectionStateChange,
  });

  const { sendMessage, stop, setMessages, resumeStream, status, ...restOfChat } =
    useChat<AnalyticsChatMessage>({
      id: conversationId,
      messages,
      transport,
      experimental_throttle: CHAT_MESSAGES_THROTTLE_MS,
      onError: (chatError) => {
        console.error('[useAnalyticsChat] Chat error', chatError);
      },
    });

  // Keep the latest-value refs current without writing them during render: the
  // connection-state callback reads them from SignalR events (outside render).
  useEffect(() => {
    transportRef.current = transport;
    conversationIdRef.current = conversationId;
    statusRef.current = status;
    resumeStreamRef.current = resumeStream;
    setMessagesRef.current = setMessages;
    stopRef.current = stop;
  });

  // Reset the per-turn recovery budget when the turn settles so a later turn
  // starts with a fresh attempt count.
  useEffect(() => {
    if (status === 'ready' || status === 'error') {
      definitiveDeathCountRef.current = 0;
    }
  }, [status]);

  const hasResumedRef = useRef(false);

  useEffect(() => {
    if (!shouldResume || !inProgressMessageId || !transport || hasResumedRef.current) {
      return;
    }

    transport.setInProgressMessageId(inProgressMessageId);
    hasResumedRef.current = true;
    void resumeStream().catch((resumeError: unknown) => {
      console.error('[useAnalyticsChat] Failed to resume stream', resumeError);
    });
  }, [shouldResume, inProgressMessageId, transport, resumeStream]);

  // SINGLE PLACE for sending: when transport is ready and there's a pending message
  useEffect(() => {
    if (transport && pendingMessage && !isCreatingConversation) {
      void sendMessage(pendingMessage);
      // oxlint-disable-next-line react/react-compiler -- pre-existing one-shot send-queue clear (predates this change)
      setPendingMessage(null);
    }
  }, [transport, pendingMessage, isCreatingConversation, sendMessage]);

  // wrappedSendMessage: ONLY queues message + creates conversation if needed
  // Never calls chat.sendMessage directly - that's useEffect's job
  const wrappedSendMessage = useCallback(
    (message: Parameters<AbstractChat<AnalyticsChatMessage>['sendMessage']>[0]) => {
      if (!message || !canSendMessage) {
        return;
      }

      // Fresh turn: reset the per-turn auto-recovery budget.
      definitiveDeathCountRef.current = 0;

      if (!conversationId && !isCreatingConversation) {
        setIsCreatingConversation(true);

        void createConversation(universeId)
          .then((response) => {
            if (!response.conversation) {
              throw new Error('Backend did not return conversation object');
            }
            const newConversationId = response.conversation.id;
            setConversationId(newConversationId);
            onConversationCreated?.(newConversationId);
          })
          .catch(() => {
            setPendingMessage(null);
          })
          .finally(() => {
            setIsCreatingConversation(false);
          });
      }

      setPendingMessage(message);
    },
    [canSendMessage, conversationId, isCreatingConversation, universeId, onConversationCreated],
  );

  const handleStop = useCallback(() => {
    setMessages(markLastAssistantThinkingStepsCancelled);
    void stop();

    if (conversationId) {
      void cancelMessage(conversationId, universeId).catch((cancelError: unknown) => {
        console.error('[useAnalyticsChat] Failed to cancel message', cancelError);
      });
    }
  }, [conversationId, setMessages, stop, universeId]);

  useEffect(() => {
    return () => {
      if (transport) {
        transport.cleanup();
      }
    };
  }, [transport]);

  return {
    ...restOfChat,
    status,
    setMessages,
    sendMessage: wrappedSendMessage,
    stop: handleStop,
    conversationId,
  };
}

export default useAnalyticsChat;
