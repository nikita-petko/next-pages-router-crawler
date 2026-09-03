import { useQuery } from '@tanstack/react-query';
import type { AccountOwnerTypeEnum } from '@rbx/client-rights/v1';
import { GET_ACCOUNT_OWNER_CREATOR_QUERY_KEY } from '../../queryKeys';
import type { AgreementCreator } from '../../utils/agreementCreator';
import { getAccountOwnerCreator } from '../../utils/agreementCreator';

interface UseGetAccountOwnerCreatorParams {
  ownerId?: string;
  ownerType?: AccountOwnerTypeEnum;
  enabled?: boolean;
}

/**
 * Resolves the Roblox handle behind a Rights account owner in its own query, keyed on the
 * owner rather than an agreement, so every consumer of the same owner shares one lookup
 * instead of issuing a users/groups call per agreement.
 */
export const useGetAccountOwnerCreator = ({
  ownerId,
  ownerType,
  enabled = true,
}: UseGetAccountOwnerCreatorParams) =>
  useQuery({
    queryKey: GET_ACCOUNT_OWNER_CREATOR_QUERY_KEY(ownerId, ownerType),
    // React Query rejects `undefined` as query data, so an unresolved handle is null.
    queryFn: async (): Promise<AgreementCreator | null> =>
      (await getAccountOwnerCreator(ownerId, ownerType)) ?? null,
    enabled: enabled && !!ownerId,
  });

export default useGetAccountOwnerCreator;
