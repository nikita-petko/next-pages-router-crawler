import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import TrackedMenuItem from '../../common/components/TrackedMenuItem';
import type CreationData from '../../common/interfaces/CreationData';

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
