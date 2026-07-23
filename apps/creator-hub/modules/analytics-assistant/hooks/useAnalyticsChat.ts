// eslint-disable-next-line eslint-comments/require-description, eslint-comments/disable-enable-pair -- Debug logging
import { useCallback, useMemo, useEffect, useState } from 'react';
import { useChat, UIMessage } from '@ai-sdk/react';
import { LogLevel } from '@microsoft/signalr';
import {
  getRealTimeNotificationsBasePath,
  useSignalR,
  type TSignalRCallback,
} from '@rbx/signalr-userhub-client';
import { useNavigationConfigs } from '@rbx/creator-hub-navigation';
import { createConversation } from '@modules/react-query/analyticsAssistant';
import { AbstractChat } from 'ai';
import { useSettings } from '@modules/settings';
import AnalyticsSignalRTransport from '../transport/AnalyticsSignalRTransport';
import { ANALYTICS_ASSISTANT_NAMESPACE } from '../constants/signalr';

export interface UseAnalyticsChatOptions {
  universeId: number;
  conversationId?: string;
  messages?: UIMessage[];
  onConversationCreated?: (conversationId: string) => void;
}

export function useAnalyticsChat({
  universeId,
  conversationId: initialConversationId,
  messages,
  onConversationCreated,
}: UseAnalyticsChatOptions) {
  const { settings, isFetched } = useSettings();
  const { environment } = useNavigationConfigs();
  const basePath = getRealTimeNotificationsBasePath(environment);

  const [conversationId, setConversationId] = useState<string | undefined>(initialConversationId);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<
    Parameters<AbstractChat<UIMessage>['sendMessage']>[0] | null
  >(null);

  const transport = useMemo(() => {
    if (!conversationId) {
      return undefined;
    }
    return new AnalyticsSignalRTransport({
      universeId,
      conversationId,
      namespace: ANALYTICS_ASSISTANT_NAMESPACE,
    });
  }, [universeId, conversationId]);

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
  });

  const { sendMessage, ...restOfChat } = useChat({
    id: conversationId,
    messages,
    transport,
  });

  // SINGLE PLACE for sending: when transport is ready and there's a pending message
  useEffect(() => {
    if (transport && pendingMessage && !isCreatingConversation) {
      sendMessage(pendingMessage);
      setPendingMessage(null);
    }
  }, [transport, pendingMessage, isCreatingConversation, sendMessage]);

  // wrappedSendMessage: ONLY queues message + creates conversation if needed
  // Never calls chat.sendMessage directly - that's useEffect's job
  const wrappedSendMessage = useCallback(
    (message: Parameters<AbstractChat<UIMessage>['sendMessage']>[0]) => {
      if (!message) {
        return;
      }

      if (!conversationId && !isCreatingConversation) {
        setIsCreatingConversation(true);

        createConversation(universeId)
          .then((response) => {
            if (!response.conversation) {
              throw new Error('Backend did not return conversation object');
            }
            const newConversationId = response.conversation.id;
            setConversationId(newConversationId);
            onConversationCreated?.(newConversationId);
          })
          .finally(() => {
            setIsCreatingConversation(false);
          });
      }

      setPendingMessage(message);
    },
    [conversationId, isCreatingConversation, universeId, onConversationCreated],
  );

  useEffect(() => {
    return () => {
      if (transport) {
        transport.cleanup();
      }
    };
  }, [transport]);

  return {
    ...restOfChat,
    sendMessage: wrappedSendMessage,
    conversationId,
  };
}

export default useAnalyticsChat;
