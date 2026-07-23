import { useQuery } from '@tanstack/react-query';
import {
  listConversationItems,
  ConversationOrder,
  type ListConversationItemsResponse,
} from './analyticsAssistantRequests';

export type { ListConversationItemsResponse };

export interface UseGetConversationItemsOptions {
  limit?: number;
  order?: ConversationOrder;
}

export function useGetConversationItems(
  conversationId: string | undefined,
  universeId: number,
  options?: UseGetConversationItemsOptions,
) {
  return useQuery({
    queryKey: ['conversationItems', conversationId, universeId, options],
    queryFn: () => listConversationItems(conversationId!, universeId, options),
    enabled: !!conversationId && universeId > 0,
    staleTime: 0,
    gcTime: 0,
  });
}
