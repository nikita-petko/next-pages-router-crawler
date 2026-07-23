import { useCallback } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import { useGetLatestTransfer } from '@modules/react-query/ownershipTransfer/ownershipTransferQueries';
import { useSessionStorage } from '@rbx/react-utilities';
import { TOwnershipTransferResource } from '../types';

type UseShowCancelledOwnershipTransferToRecipientReturn = {
  showCancelledTransfer: boolean;
  setHasAcknowledgedCancelledTransfer: () => void;
  trackReceiveAttempt: () => void;
};

const useShowCancelledOwnershipTransferToRecipient = (
  resource: TOwnershipTransferResource | null,
): UseShowCancelledOwnershipTransferToRecipientReturn => {
  const { user } = useAuthentication();
  const { data: latestTransfer } = useGetLatestTransfer(
    resource?.resourceType ?? 'Invalid',
    resource?.resourceId ?? 0,
  );

  // NOTE(@rvaughan): We use sessionStorage because this flow should only be shown if the user
  // just tried to receive a transfer which no longer exists. There is no backend state for acking this, and
  // on subsequent sessions they won't be able to begin the receiving flow again.
  const currentHoldId = latestTransfer?.holdId;
  const sessionKey = `hasTriedToReceive_${currentHoldId}`;
  const ackSessionKey = `hasAcknowledgedCancelled_${currentHoldId}`;

  const [hasTriedToReceive, setHasTriedToReceive] = useSessionStorage(sessionKey, false);
  const [hasAcknowledgedCancelledTransfer, setHasAcknowledgedCancelledTransfer] = useSessionStorage(
    ackSessionKey,
    false,
  );

  const trackReceiveAttempt = useCallback(() => {
    setHasTriedToReceive(true);
  }, [setHasTriedToReceive]);

  const shouldShowCancelledTransfer =
    !!resource &&
    !!latestTransfer &&
    latestTransfer.holdState === 'Canceled' &&
    latestTransfer.targetCreator &&
    user?.id === latestTransfer.targetCreator.creatorId &&
    latestTransfer.targetCreator.creatorType === 'User' &&
    hasTriedToReceive &&
    !hasAcknowledgedCancelledTransfer;

  const setHasAcknowledgedCancelledTransferCallback = useCallback(() => {
    setHasAcknowledgedCancelledTransfer(true);
  }, [setHasAcknowledgedCancelledTransfer]);

  return {
    showCancelledTransfer: shouldShowCancelledTransfer,
    setHasAcknowledgedCancelledTransfer: setHasAcknowledgedCancelledTransferCallback,
    trackReceiveAttempt,
  };
};

export default useShowCancelledOwnershipTransferToRecipient;
