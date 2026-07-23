import React, { useEffect } from 'react';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useShowCancelledOwnershipTransferToRecipient from '../hooks/useShowCancelledOwnershipTransferToRecipient';
import { TModalStageComponentProps } from '../transferConfiguration';

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
