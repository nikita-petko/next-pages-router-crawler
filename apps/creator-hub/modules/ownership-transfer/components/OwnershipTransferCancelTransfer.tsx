import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import useTransferCreatorName from '../hooks/useTransferCreatorName';
import type { TModalStageComponentProps } from '../types';

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
