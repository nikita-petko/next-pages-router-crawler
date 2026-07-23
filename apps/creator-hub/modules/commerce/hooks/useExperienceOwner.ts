import { useEffect, useState, useMemo, useCallback } from 'react';
import { OwnerType } from '@rbx/client-commerce-api/v1';
import { useAuthentication } from '@modules/authentication/providers';
import groupsClient from '@modules/clients/groups';
import { useCurrentGame } from '@modules/providers/game/GameProvider';

function useExperienceOwner() {
  const [isExperienceOwner, setIsExperienceOwner] = useState(false);
  const [isFetched, setIsFetched] = useState(false);

  const { user } = useAuthentication();
  const { gameDetails } = useCurrentGame();

  const { ownerType, ownerId, userId } = useMemo(
    () => ({
      ownerType: (gameDetails?.creator?.type as OwnerType) ?? OwnerType.Invalid,
      ownerId: gameDetails?.creator?.id ?? 0,
      userId: user?.id ?? 0,
    }),
    [gameDetails?.creator?.type, gameDetails?.creator?.id, user?.id],
  );

  const checkIfExperienceOwner = useCallback(async () => {
    setIsExperienceOwner(false);
    setIsFetched(false);

    if (!ownerType || !ownerId || !userId) {
      setIsFetched(true);
      return;
    }

    const normalizedOwnerType = ownerType.toLowerCase();
    if (normalizedOwnerType === OwnerType.User.toLowerCase()) {
      setIsExperienceOwner(ownerId === userId);
    } else if (normalizedOwnerType === OwnerType.Group.toLowerCase()) {
      try {
        const groupInfoResponse = await groupsClient.getGroupInfo(ownerId);
        const groupOwnerId = groupInfoResponse.owner?.userId;
        setIsExperienceOwner(groupOwnerId === userId);
      } catch {
        setIsExperienceOwner(false);
      }
    }

    setIsFetched(true);
  }, [userId, ownerType, ownerId]);

  useEffect(() => {
    checkIfExperienceOwner();
  }, [checkIfExperienceOwner]);

  return { isExperienceOwner, isFetched, ownerType, ownerId, userId };
}

export default useExperienceOwner;
