import type { QueryKey, UseQueryResult, QueryObserverOptions } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import { useAuthentication } from '@modules/authentication/providers';
import type { CreatorContactInfo, CreatorContactType } from '@modules/clients/brandPlatform';
import brandPlatformApiClient, { CreatorType } from '@modules/clients/brandPlatform';
import { getResponseFromError } from '@modules/clients/utils';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';

type QueryOptions = QueryObserverOptions<Omit<CreatorContactInfo, 'contactType'> | null>;

export interface UseCreatorContactInfoQueryProps {
  enabled?: boolean;
  refetchOnWindowFocus?: QueryOptions['refetchOnWindowFocus'];
}

export type CreatorContactInfoQuery = UseQueryResult<
  Omit<CreatorContactInfo, 'contactType'> | null | undefined
>;

const useCreatorContactInfoQuery = (
  contactType: CreatorContactType,
  { enabled = true, refetchOnWindowFocus = false }: UseCreatorContactInfoQueryProps = {},
): [CreatorContactInfoQuery, QueryKey] => {
  const currentGroup = useCurrentGroup();
  const { user } = useAuthentication();

  const creatorType = currentGroup?.id ? CreatorType.Group : CreatorType.User;
  const creatorId = String(currentGroup?.id ?? user?.id ?? 0);

  const queryKey: QueryKey = ['creatorContactInfo', creatorType, creatorId, contactType];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const response = await brandPlatformApiClient.getCreatorContactInfo({
          creatorType,
          creatorId,
          contactType,
        });

        if (!response.creatorContact) {
          return null;
        }

        const { contactType: _, ...rest } = response.creatorContact;
        return rest;
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

export default useCreatorContactInfoQuery;
