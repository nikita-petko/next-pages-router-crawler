import { useCallback, useMemo } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import type { TransferCreator } from '@modules/clients/ownershipTransferApi';
import { TransferCreatorType, TransferResourceType } from '@modules/clients/ownershipTransferApi';
import useShowCancelledOwnershipTransferToRecipient from '@modules/ownership-transfer/hooks/useShowCancelledOwnershipTransferToRecipient';
import useOwnershipTransferDialog from '@modules/ownership-transfer/useOwnershipTransferDialog';
import { useGetLatestTransfer } from '@modules/react-query/ownershipTransfer/ownershipTransferQueries';
import type { GroupConfiguration } from '../ConfigureGroupTypes';

type TUseGroupOwnershipTransferReturnType = ReturnType<typeof useOwnershipTransferDialog> & {
  hasPendingTransfer: boolean;
  showCancelledTransfer: boolean;
  showExpiredTransfer: boolean;
  targetCreator: TransferCreator | null | undefined;
  groupOwnerMightBeStale: boolean;
  isGroupTransferOnCooldown: boolean;
};

// This setting should be kept in sync with CompletedTransferBlockSeconds
// Until we expose an endpoint for this
// https://obelix.simulprod.com/project/ownership-transfer/runtime-configuration/group/ownership-transfer-hold-service
// https://roblox.atlassian.net/browse/CRF-6473
// exported for tests
export const OWNERSHIP_TRANSFER_COOLDOWN_SECONDS = 2592000;
export const GROUP_OWNER_CACHE_MS = 5 * 60 * 1000;

const useGroupOwnershipTransfer = (
  groupConfiguration: GroupConfiguration,
): TUseGroupOwnershipTransferReturnType => {
  const { data: latestTransfer, isFetched: isLatestTransferFetched } = useGetLatestTransfer(
    TransferResourceType.Group,
    groupConfiguration.id,
  );

  const { user } = useAuthentication();

  const resource = useMemo(
    () => ({
      resourceType: TransferResourceType.Group,
      resourceId: groupConfiguration.id,
      resourceName: groupConfiguration.name,
    }),
    [groupConfiguration.id, groupConfiguration.name],
  );

  const { showCancelledTransfer, trackReceiveAttempt } =
    useShowCancelledOwnershipTransferToRecipient(resource);

  const { open: originalOpen, dialog } = useOwnershipTransferDialog(
    resource,
    { creatorId: groupConfiguration.owner.id ?? 0, creatorType: TransferCreatorType.User },
    latestTransfer?.targetCreator,
  );

  // Wrap the open function to track when user opens receive dialog
  const open = useCallback(
    (variant: Parameters<typeof originalOpen>[0]) => {
      if (variant === 'Receive') {
        trackReceiveAttempt();
      }
      originalOpen(variant);
    },
    [originalOpen, trackReceiveAttempt],
  );

  const shouldShowExpiredTransfer =
    !!latestTransfer &&
    latestTransfer.holdState === 'Timedout' &&
    !latestTransfer.expirationAcknowledged &&
    latestTransfer.currentCreator.creatorType === 'User' &&
    latestTransfer.currentCreator.creatorId === user?.id;

  const elapsedTimeMs = Date.now() - (latestTransfer?.updatedUtcTime?.getTime() ?? 0);

  // Groups services have the owner cached, so it may show as outdated even after a transfer is completed.
  // see https://roblox.slack.com/archives/C04SCK56ZST/p1754391338918739?thread_ts=1754350862.861049&cid=C04SCK56ZST
  const groupOwnerMightBeStale =
    (latestTransfer?.holdState === 'Accepted' || latestTransfer?.holdState === 'Completed') &&
    elapsedTimeMs <= GROUP_OWNER_CACHE_MS;

  const isGroupTransferOnCooldown =
    latestTransfer?.holdState === 'Completed' &&
    elapsedTimeMs <= OWNERSHIP_TRANSFER_COOLDOWN_SECONDS * 1000;

  return {
    hasPendingTransfer: isLatestTransferFetched && latestTransfer?.holdState === 'Pending',
    targetCreator: latestTransfer?.targetCreator,
    showCancelledTransfer,
    showExpiredTransfer: shouldShowExpiredTransfer,
    open,
    dialog,
    groupOwnerMightBeStale,
    isGroupTransferOnCooldown,
  };
};

export default useGroupOwnershipTransfer;
