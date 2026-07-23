import React, { FunctionComponent } from 'react';
import { urls } from '@modules/miscellaneous/common';
import {
  Avatar,
  CircularProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import useLeftNavigationStatusStyles from '@modules/navigation/leftNavigation/componentsV2/LeftNavigationStatus.styles';
import StatusCardContextMenu from '../../../common/components/StatusCardContextMenu';
import CopyTextActionMenuItem from '../../../common/components/CopyTextActionMenuItem';
import OpenLinkActionMenuItem from '../../../common/components/OpenLinkActionMenuItem';
import { useCurrentDeveloperItem } from '../DeveloperItemProvider';

const {
  creatorHub: { creatorStore },
} = urls;
const DeveloperItemStatus: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { classes: styles } = useLeftNavigationStyles();
  const {
    classes: { fullWidth, overflowText },
  } = useLeftNavigationStatusStyles();

  const { translate } = useTranslation();
  const { isLoadingDeveloperItem, developerItemDetails, developerItemImage } =
    useCurrentDeveloperItem();

  if (isLoadingDeveloperItem || !developerItemDetails) {
    return (
      <div className={styles.statusContainer}>
        <CircularProgress color='secondary' />
      </div>
    );
  }

  return (
    <List disablePadding classes={{ root: fullWidth }}>
      <ListItem disableGutters>
        <ListItemAvatar>
          <Avatar variant='rounded' alt='icon'>
            {developerItemImage}
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={developerItemDetails.name} classes={{ primary: overflowText }} />
        <ListItemSecondaryAction>
          <StatusCardContextMenu
            menuItems={[
              <CopyTextActionMenuItem
                actionName={translate('Action.CopyAssetID')}
                itemName={translate('Label.AssetID')}
                key='copy-asset-id'
                actionKey='copyAssetId'
                textToCopy={developerItemDetails?.id}
              />,
              <OpenLinkActionMenuItem
                key='view-on-marketplace'
                actionKey='viewOnMarketplace'
                url={creatorStore.getAssetUrl(parseInt(developerItemDetails.id, 10))}
                actionName={translate('Heading.OpenInCreatorStore')}
              />,
            ]}
          />
        </ListItemSecondaryAction>
      </ListItem>
    </List>
  );
};

export default DeveloperItemStatus;
