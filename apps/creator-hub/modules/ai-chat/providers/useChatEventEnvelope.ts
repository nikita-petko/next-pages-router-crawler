import { useMemo } from 'react';
import {
  buildChatEventEnvelope,
  type ChatEventEnvelope,
} from '@modules/analytics-assistant/utils/AssistantLogger';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { useAIChatContext } from './AIChatProvider';

/**
 * Builds the common chat-event envelope from the active chat context so every
 * chat-surface event is sliced consistently. Read at render; capture in event
 * handlers as needed.
 */
export const useChatEventEnvelope = (): ChatEventEnvelope => {
  const { id: universeId } = useUniverseResource();
  const { conversationId, canSendMessage, messages } = useAIChatContext();

  const turnIndex = useMemo(
    () => messages.reduce((count, message) => (message.role === 'user' ? count + 1 : count), 0),
    [messages],
  );

  return useMemo(
    () =>
      buildChatEventEnvelope({
        universeId,
        conversationId,
        isReadOnly: !canSendMessage,
        turnIndex,
      }),
    [universeId, conversationId, canSendMessage, turnIndex],
  );
};
