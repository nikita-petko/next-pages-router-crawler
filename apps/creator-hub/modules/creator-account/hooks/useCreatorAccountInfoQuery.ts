import { useQuery, QueryKey, UseQueryResult, QueryObserverOptions } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import brandPlatformApiClient, {
  CreatorAccountInfo,
  CreatorType,
} from '@modules/clients/brandPlatform';
import { getResponseFromError } from '@modules/clients/utils';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';

type QueryOptions = QueryObserverOptions<CreatorAccountInfo | null | undefined>;

export interface UseCreatorAccountInfoQueryProps {
  enabled?: boolean;
  refetchOnWindowFocus?: QueryOptions['refetchOnWindowFocus'];
}

export type CreatorAccountInfoQuery = UseQueryResult<CreatorAccountInfo | null | undefined, Error>;

const useCreatorAccountInfoQuery = ({
  enabled = true,
  refetchOnWindowFocus = false,
}: UseCreatorAccountInfoQueryProps = {}): [CreatorAccountInfoQuery, QueryKey] => {
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();

  const creatorType = currentGroup?.id ? CreatorType.Group : CreatorType.User;
  const creatorId = String(currentGroup?.id ?? user?.id ?? 0);

  const queryKey: QueryKey = ['creatorAccountInfo', creatorType, creatorId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await brandPlatformApiClient.getCreatorAccountInfo({
          creatorType: currentGroup?.id ? CreatorType.Group : CreatorType.User,
          creatorId: String(currentGroup?.id ?? user?.id ?? 0),
        });
        return response.creatorAccountInfo;
      } catch (err) {
        const errorResponse = getResponseFromError(err);
        if (errorResponse?.status === 404) {
          return null;
        }
        throw err;
      }
    },
    enabled: enabled && (!!user?.id || !!currentGroup?.id),
    refetchOnWindowFocus,
  });

  return [query, queryKey];
};

export default useCreatorAccountInfoQuery;
