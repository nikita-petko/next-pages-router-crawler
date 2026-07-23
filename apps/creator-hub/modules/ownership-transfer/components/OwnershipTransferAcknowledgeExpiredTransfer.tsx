import { useEffect } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { useAcknowledgeExpiredTransfer } from '@modules/react-query/ownershipTransfer/ownershipTransferQueries';
import useTransferCreatorName from '../hooks/useTransferCreatorName';
import type { TModalStageComponentProps } from '../types';

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
