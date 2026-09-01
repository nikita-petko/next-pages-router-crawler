import { useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import useShowCancelledOwnershipTransferToRecipient from '../hooks/useShowCancelledOwnershipTransferToRecipient';
import type { TModalStageComponentProps } from '../types';

const OwnershipTransferCancelledTransfer = ({ resource }: TModalStageComponentProps) => {
  const { translateHTML } = useTranslation();

  const { setHasAcknowledgedCancelledTransfer } =
    useShowCancelledOwnershipTransferToRecipient(resource);

  // Automatically acknowledge the cancelled transfer when component mounts
  useEffect(() => {
    setHasAcknowledgedCancelledTransfer();
  }, [setHasAcknowledgedCancelledTransfer]);

  return (
    <Typography>
      {translateHTML('Description.RequestCancelledForRecipient', [
        {
          opening: 'resourceStart',
          closing: 'resourceEnd',
          content: () => <b>{resource.resourceName}</b>,
        },
      ])}
    </Typography>
  );
};

export default OwnershipTransferCancelledTransfer;
