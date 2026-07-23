import React, { useEffect } from 'react';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useAcknowledgeExpiredTransfer } from '@modules/react-query/ownershipTransfer/ownershipTransferQueries';
import { TModalStageComponentProps } from '../transferConfiguration';
import useTransferCreatorName from '../hooks/useTransferCreatorName';

const OwnershipTransferAcknowledgeExpiredTransfer = ({
  resource,
  targetCreator,
}: TModalStageComponentProps) => {
  const { translateHTML } = useTranslation();
  const { mutate: acknowledgeTransfer } = useAcknowledgeExpiredTransfer();
  const { name: targetCreatorName } = useTransferCreatorName(targetCreator);

  // Auto-acknowledge expired transfer in the background
  useEffect(() => {
    acknowledgeTransfer({
      resourceId: resource.resourceId,
      resourceType: resource.resourceType,
    });
  }, [acknowledgeTransfer, resource.resourceId, resource.resourceType]);

  return (
    <Typography>
      {translateHTML('Description.OwnershipRequestExpired', [
        {
          opening: 'resourceNameStart',
          closing: 'resourceNameEnd',
          content: () => <b>{resource.resourceName}</b>,
        },
        {
          opening: 'creatorNameStart',
          closing: 'creatorNameEnd',
          content: () => <b>{targetCreatorName}</b>,
        },
      ])}
    </Typography>
  );
};

export default OwnershipTransferAcknowledgeExpiredTransfer;
