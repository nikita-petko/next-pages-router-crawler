import React, { FunctionComponent } from 'react';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useRouter } from 'next/router';
import CreationData from '../../common/interfaces/CreationData';
import TrackedMenuItem from '../../common/components/TrackedMenuItem';

export interface ItemCardMigratePlaceButtonProps {
  creation: CreationData;
  handleClose: () => void;
  isDisabled?: boolean;
}

const ItemCardMigratePlaceButton: FunctionComponent<
  React.PropsWithChildren<ItemCardMigratePlaceButtonProps>
> = ({ creation, handleClose, isDisabled }) => {
  const { translate } = useTranslation();
  const router = useRouter();

  return (
    <TrackedMenuItem
      data-testid='experience-menu-item-migrate-server'
      onClick={() => {
        router.push(`/dashboard/creations/experiences/${creation.universeId}/server-management`);
        handleClose();
      }}
      itemKey='Action.RestartServers'
      disabled={isDisabled}>
      <Typography>{translate('Action.RestartServers')}</Typography>
    </TrackedMenuItem>
  );
};

export default ItemCardMigratePlaceButton;
