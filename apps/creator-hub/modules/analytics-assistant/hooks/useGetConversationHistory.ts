import { useMemo } from 'react';
import { useGetConversationItems } from '@modules/react-query/analyticsAssistant';
import { transformConversationItemsToUIMessages } from '../utils/transformConversationItems';

export function useGetConversationHistory(conversationId: string | undefined, universeId: number) {
  const { data, isLoading, error } = useGetConversationItems(conversationId, universeId);

  const initialMessages = useMemo(
    () => transformConversationItemsToUIMessages(data?.data ?? []),
    [data],
  );

  return {
    isLoading,
    error,
    initialMessages,
  };
}

export default useGetConversationHistory;
