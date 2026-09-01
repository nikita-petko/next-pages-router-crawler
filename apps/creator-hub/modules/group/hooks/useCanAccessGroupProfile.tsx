import { useAuthentication } from '@modules/authentication/providers';
import { useGetLatestTransfer } from '@modules/react-query/ownershipTransfer/ownershipTransferQueries';
import useCurrentOrganization from './useCurrentOrganization';

type TUseCanAccessGroupProfileReturnType = {
  canAccess: boolean | undefined;
  isLoading: boolean;
};

const useCanAccessGroupProfile = (
  groupId: number | undefined,
): TUseCanAccessGroupProfileReturnType => {
  const { user, isFetched: isUserFetched } = useAuthentication();
  const { permissions, isOrganizationLoading } = useCurrentOrganization();
  const { data: latestTransfer, isFetched: isTransferFetched } = useGetLatestTransfer(
    'Group',
    groupId ?? 0,
  );

  const isLoading = isOrganizationLoading || !isUserFetched || !isTransferFetched;

  if (!isOrganizationLoading && permissions?.canConfigureOrganization) {
    return { canAccess: true, isLoading: false };
  }
  if (
    isUserFetched &&
    isTransferFetched &&
    latestTransfer?.targetCreator.creatorType === 'User' &&
    latestTransfer?.targetCreator.creatorId === user?.id
  ) {
    return { canAccess: true, isLoading: false };
  }

  if (isLoading) {
    return { canAccess: undefined, isLoading: true };
  }

  return { canAccess: false, isLoading: false };
};

export default useCanAccessGroupProfile;
