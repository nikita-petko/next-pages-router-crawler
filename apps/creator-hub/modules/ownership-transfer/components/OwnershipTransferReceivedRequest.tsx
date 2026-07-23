import React from 'react';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { type TModalStageComponentProps } from '../transferConfiguration';
import { ownershipTransferResourceTypeToTranslationString } from '../constants/contentConstants';
import useTransferCreatorName from '../hooks/useTransferCreatorName';

type TOwnershipTransferReceiveRequestProps = TModalStageComponentProps;

const OwnershipTransferReceivedRequest = ({
  resource,
  currentCreator,
}: TOwnershipTransferReceiveRequestProps) => {
  const { translateHTML, translate } = useTranslation();

  const { name: currentCreatorName } = useTransferCreatorName(currentCreator);

  const currentResourceString =
    ownershipTransferResourceTypeToTranslationString[resource.resourceType];

  return (
    <Typography data-testid='ownership-transfer-received-request'>
      {translateHTML('Description.UserHasReceivedRequest', [
        {
          opening: 'usernameStart',
          closing: 'usernameEnd',
          content: () => <b>{currentCreatorName}</b>,
        },
        {
          opening: 'resourceStart',
          closing: 'resourceEnd',
          content: () => translate(currentResourceString),
        },
      ])}
    </Typography>
  );
};

export default OwnershipTransferReceivedRequest;
