import type { FC } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Link } from '@rbx/ui';
import ItemGridEmptyView from '@modules/creations/common/components/ItemGridEmptyView/ItemGridEmptyView';
import { notificationContentPlayerInvitePromptDocUrl } from '../../constants/notificationContent';
import CreateNotificationContentButton from './CreateNotificationContentButton';

export interface NotificationsContentEmptyViewProps {
  universeId: number;
}

const NotificationsContentEmptyView: FC<
  React.PropsWithChildren<NotificationsContentEmptyViewProps>
> = ({ universeId }) => {
  const { translate, translateHTML } = useTranslation();

  return (
    <ItemGridEmptyView
      illustration='notifications'
      createItemButton={
        <CreateNotificationContentButton universeId={universeId} buttonPosition='center' />
      }
      emptyMessage={translate('Description.NoNotificationStings')}
      itemDescription={translateHTML('Description.NotificationsIncreaseEngagement', [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content(chunks) {
            return (
              <Link href={notificationContentPlayerInvitePromptDocUrl} target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
      ])}
    />
  );
};

export default NotificationsContentEmptyView;
