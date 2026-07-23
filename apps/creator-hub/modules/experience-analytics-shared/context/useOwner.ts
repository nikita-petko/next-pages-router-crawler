import { useAuthentication } from '@modules/authentication/providers';
import { OwnerType } from '@modules/clients/analytics';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import { useMemo } from 'react';
import { useAnalyticsOwnerOverride } from './AnalyticsOwnerOverrideProvider';

export type TUseOwnerResult =
  | {
      isFetched: true;
      ownerType: OwnerType;
      ownerName: string;
      ownerId: number;
    }
  | { isFetched: false };

const useOwner = (): TUseOwnerResult => {
  const override = useAnalyticsOwnerOverride();

  const { user, isFetched: isUserFetched } = useAuthentication();
  const currentGroup = useCurrentGroup();

  const isGroup = currentGroup !== undefined && currentGroup !== null;
  const ownerType = isGroup ? OwnerType.Group : OwnerType.User;
  const ownerId = isGroup ? currentGroup.id : user?.id;
  const ownerName = isGroup ? currentGroup.name : user?.name;

  const ownerResult: TUseOwnerResult = useMemo(() => {
    if (isUserFetched !== true || currentGroup === undefined) {
      return { isFetched: false };
    }
    return {
      isFetched: true,
      ownerType: override?.ownerType ?? ownerType ?? OwnerType.User,
      ownerId: override?.ownerId ?? ownerId ?? 0,
      ownerName: ownerName ?? '',
    };
  }, [
    currentGroup,
    isUserFetched,
    override?.ownerId,
    override?.ownerType,
    ownerId,
    ownerName,
    ownerType,
  ]);

  return ownerResult;
};

export default useOwner;
