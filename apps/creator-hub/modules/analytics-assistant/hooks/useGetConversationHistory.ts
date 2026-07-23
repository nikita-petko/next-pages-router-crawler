import { useMemo } from 'react';
import { MessageStatus } from '@rbx/client-analytics-assistant-api/v2';
import { useGetConversationItems } from '@modules/react-query/analyticsAssistant';
import { transformConversationItemsToUIMessages } from '../utils/transformConversationItems';

export function useGetConversationHistory(conversationId: string | undefined, universeId: number) {
  const { data, isLoading, error } = useGetConversationItems(conversationId, universeId);

  const items = useMemo(() => data ?? [], [data]);

  const inProgressMessageId = useMemo(() => {
    const lastItem = items.at(-1);
    return lastItem?.message?.status === MessageStatus.InProgress ? lastItem.id : undefined;
  }, [items]);

  const shouldResume = Boolean(inProgressMessageId);

  const initialMessages = useMemo(
    () =>
      transformConversationItemsToUIMessages(
        items.filter((item) => item.message?.status !== MessageStatus.InProgress),
      ),
    [items],
  );

  return {
    isLoading,
    error,
    initialMessages,
    inProgressMessageId,
    shouldResume,
  };
}

export default useGetConversationHistory;
