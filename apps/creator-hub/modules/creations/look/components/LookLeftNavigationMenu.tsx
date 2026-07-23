import React, { FunctionComponent } from 'react';
import {
  itemTypeToThumbnailType,
  itemTypeToReturnPolicyType,
  urls,
  Item,
} from '@modules/miscellaneous/common';
import {
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  makeStyles,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useLeftNavigationStatusStyles from '@modules/navigation/leftNavigation/componentsV2/LeftNavigationStatus.styles';
import ItemThumbnail from '../../common/components/ItemThumbnail';
import OpenLinkActionMenuItem from '../../common/components/OpenLinkActionMenuItem';
import CopyTextActionMenuItem from '../../common/components/CopyTextActionMenuItem';
import StatusCardContextMenu from '../../common/components/StatusCardContextMenu';
import useCurrentLook from '../hooks/useCurrentLook';

const useStyles = makeStyles()(() => ({
  avatarThumbnail: {
    width: '40px',
    height: '40px',
    display: 'block',
  },
}));

const LookLeftNavigationMenu: FunctionComponent<React.PropsWithChildren<object>> = () => {
  const {
    classes: { fullWidth, overflowText },
  } = useLeftNavigationStatusStyles();
  const {
    classes: { avatarThumbnail },
  } = useStyles();
  const { translate } = useTranslation();
  const { lookDetail } = useCurrentLook();

  const lookId = lookDetail?.lookId ? (lookDetail?.lookId as unknown as number) : 0;
  const name = lookDetail?.name;

  const menuItems = [
    <CopyTextActionMenuItem
      actionName={translate('Action.CopyLookID')}
      itemName={translate('Label.LookID')}
      key='copy-look-id'
      actionKey='copyLookId'
      textToCopy={lookId?.toString()}
    />,
  ];

  menuItems.push(
    <OpenLinkActionMenuItem
      key='view-on-marketplace'
      actionKey='viewOnMarketplace'
      url={urls.www.getLookUrl(lookId)}
      actionName={translate('Heading.OpenOnRoblox')}
    />,
  );

  return (
    <List disablePadding classes={{ root: fullWidth }}>
      <ListItem disableGutters>
        <ListItemAvatar>
          <Avatar variant='rounded' alt='icon'>
            <ItemThumbnail
              containerClass={avatarThumbnail}
              moderatedContainerClass={avatarThumbnail}
              type={itemTypeToThumbnailType[Item.Look]}
              targetId={lookId}
              bundleModerationStatus={undefined}
              returnPolicy={itemTypeToReturnPolicyType[Item.Look]}
              alt={name ?? ''}
              isPendingNewTarget={false}
              itemType={Item.Look}
            />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={name} classes={{ primary: overflowText }} />
        <ListItemSecondaryAction>
          <StatusCardContextMenu menuItems={menuItems} />
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  );
};

export default LookLeftNavigationMenu;
