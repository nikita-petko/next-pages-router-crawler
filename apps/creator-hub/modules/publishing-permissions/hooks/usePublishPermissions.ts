import { useQuery } from '@tanstack/react-query';
import type { CreatorPublishPermissionsResponse } from '@rbx/client-core-content-api/v1';
import { useAuthentication } from '@modules/authentication/providers';
import coreContentClient from '@modules/clients/coreContent';

export const publishPermissionsQueryKey = (userId?: number) =>
  ['publishPermissions', userId ?? null] as const;

interface UsePublishPermissionsOptions {
  overrideUserId?: number;
  isReady?: boolean;
}

export const usePublishPermissions = ({
  overrideUserId,
  isReady = true,
}: UsePublishPermissionsOptions = {}) => {
  const { user } = useAuthentication();
  const userId = user?.id;
  const effectiveUserId = overrideUserId ?? userId;

  return useQuery({
    queryKey: publishPermissionsQueryKey(effectiveUserId),
    queryFn: async (): Promise<CreatorPublishPermissionsResponse> =>
      coreContentClient.coreContentGetCreatorPublishPermissions({
        // oxlint-disable-next-line typescript/no-non-null-assertion -- enabled guarantees effectiveUserId
        userId: effectiveUserId!,
      }),
    enabled: isReady && !!effectiveUserId,
  });
};
