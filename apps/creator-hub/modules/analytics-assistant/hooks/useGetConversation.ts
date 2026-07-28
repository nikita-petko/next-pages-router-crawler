import { useQuery } from '@tanstack/react-query';
import { getConversation } from '@modules/react-query/analyticsAssistant/analyticsAssistantRequests';

export function useGetConversation(conversationId: string | undefined, universeId: number) {
  return useQuery({
    queryKey: ['conversation', conversationId, universeId],
    queryFn: () => {
      if (!conversationId) {
        throw new Error('Conversation ID is required');
      }

      return getConversation(conversationId);
    },
    enabled: !!conversationId && universeId > 0,
    staleTime: 0,
    gcTime: 0,
  });
}

export default useGetConversation;
