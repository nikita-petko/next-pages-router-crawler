import { skipToken, useQuery } from '@tanstack/react-query';
import rightsClient from '@modules/clients/rights';
import { GET_IP_CONTENT_BY_ID } from '../../ipFamilies/queryKeys';

const useIpContent = (
  accountId: string | undefined,
  ipContentId: string | undefined,
  enabled = true,
) => {
  return useQuery({
    queryKey: GET_IP_CONTENT_BY_ID(accountId, ipContentId),
    queryFn:
      enabled && accountId !== undefined && ipContentId !== undefined
        ? () => rightsClient.getIpContent({ accountId, ipContentId })
        : skipToken,
    staleTime: Infinity,
  });
};

export default useIpContent;
