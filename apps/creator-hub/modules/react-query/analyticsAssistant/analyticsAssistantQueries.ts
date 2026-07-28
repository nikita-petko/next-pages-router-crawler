import { useQuery } from '@tanstack/react-query';
import type { ConversationOrder } from './analyticsAssistantRequests';
import { listAllConversationItems } from './analyticsAssistantRequests';

export interface UseGetConversationItemsOptions {
  order?: ConversationOrder;
  pageSize?: number;
}

export function useGetConversationItems(
  conversationId: string | undefined,
  universeId: number,
  options?: UseGetConversationItemsOptions,
) {
  return useQuery({
    queryKey: ['conversationItems', conversationId, universeId, options],
    queryFn: () => {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      return listAllConversationItems(conversationId, options);
    },
    enabled: !!conversationId && universeId > 0,
    staleTime: 0,
    gcTime: 0,
  });
}
