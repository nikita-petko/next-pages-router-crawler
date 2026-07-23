import React from 'react';
import ConflictClaimFailedDialog from '../createRemovalRequest/ConflictClaimFailedDialog';
import SubmitErrorDialog from '../createRemovalRequest/SubmitErrorDialog';
import SubmitErrorWithoutRetryDialog from '../createRemovalRequest/SubmitErrorWithoutRetryDialog';
import SubmitThrottleDialog from '../createRemovalRequest/SubmitThrottleDialog';

interface handlerErrorDialogProps {
  open: boolean;
  reset: () => void;
  onClose: () => void;
  isLoading: boolean;
  onSubmit: () => void;
  shouldEditConflictClaim: boolean;
  shouldRetryCreateClaim: boolean;
  shouldEditBadRequestClaim: boolean;
  shouldToastRateLimit: boolean;
}

const handlerErrorDialog = ({
  open,
  reset,
  onClose,
  isLoading,
  onSubmit,
  shouldEditConflictClaim,
  shouldRetryCreateClaim,
  shouldEditBadRequestClaim,
  shouldToastRateLimit,
}: handlerErrorDialogProps) => {
  if (shouldEditConflictClaim) {
    // Failed to create claim with 409 conflict. User can back to edit
    return <ConflictClaimFailedDialog open={open} reset={reset} onClose={onClose} />;
  }
  if (shouldToastRateLimit) {
    // Failed to create claim with 429 too many requests. No retry, no back to edit
    return <SubmitThrottleDialog open={open} reset={reset} onClose={onClose} />;
  }
  if (shouldRetryCreateClaim) {
    return (
      <SubmitErrorDialog
        open={open}
        reset={reset}
        onClose={onClose}
        isLoading={isLoading}
        onSubmit={onSubmit}
      />
    );
  }
  if (shouldEditBadRequestClaim) {
    return <SubmitErrorWithoutRetryDialog open={open} reset={reset} onClose={onClose} />;
  }
  return null;
};

export default handlerErrorDialog;
