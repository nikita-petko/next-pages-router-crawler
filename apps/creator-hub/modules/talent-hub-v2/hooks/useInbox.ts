import { useQuery } from '@tanstack/react-query';
import { inboxClient } from '../api/inboxClient';
import type { ApiInboxResponse, ApiStudioInboxResponse } from '../types';
import { isMocksEnabled } from '../utils';

export function useInbox() {
  const mocks = isMocksEnabled();
  return useQuery<ApiInboxResponse>({
    queryKey: ['talent-hub-v2', 'inbox', { mocks }],
    queryFn: async () => {
      if (mocks) {
        const { MOCK_INBOX_RESPONSE_V2 } = await import('../mocks/mockData');
        return MOCK_INBOX_RESPONSE_V2;
      }
      return inboxClient.getInbox();
    },
  });
}

export function useStudioInbox() {
  const mocks = isMocksEnabled();
  return useQuery<ApiStudioInboxResponse>({
    queryKey: ['talent-hub-v2', 'studio-inbox', { mocks }],
    queryFn: async () => {
      if (mocks) {
        const { MOCK_STUDIO_INBOX_RESPONSE } = await import('../mocks/mockData');
        return MOCK_STUDIO_INBOX_RESPONSE;
      }
      return inboxClient.getInbox() as unknown as ApiStudioInboxResponse;
    },
  });
}

export default useInbox;
