import React from 'react';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { TModalStageComponentProps } from '../transferConfiguration';
import useTransferCreatorName from '../hooks/useTransferCreatorName';

const OwnershipTransferCancelTransfer = ({
  resource,
  targetCreator,
}: TModalStageComponentProps) => {
  const { translateHTML } = useTranslation();

  const { name: targetCreatorName } = useTransferCreatorName(targetCreator);

  return (
    <Typography>
      {translateHTML('Action.CancelRequest', [
        {
          opening: 'resourceStart',
          closing: 'resourceEnd',
          content: () => <b>{resource.resourceName}</b>,
        },
        {
          opening: 'recipientStart',
          closing: 'recipientEnd',
          content: () => <b>{targetCreatorName}</b>,
        },
      ])}
    </Typography>
  );
};

export default OwnershipTransferCancelTransfer;
