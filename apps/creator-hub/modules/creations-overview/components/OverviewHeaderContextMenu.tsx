import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import CopyTextActionMenuItem from '@modules/creations/common/components/CopyTextActionMenuItem';
import OpenLinkActionMenuItem from '@modules/creations/common/components/OpenLinkActionMenuItem';
import StatusCardContextMenu from '@modules/creations/common/components/StatusCardContextMenu';
import { Item } from '@modules/miscellaneous/common';
import { getUrlForItemType } from '@modules/miscellaneous/urls';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';

type OverviewHeaderContextMenuProps = {
  universeId: number;
  rootPlaceId: number;
};

const OverviewHeaderContextMenu: FC<OverviewHeaderContextMenuProps> = ({
  universeId,
  rootPlaceId,
}) => {
  const { translate } = useTranslation();

  return (
    <Grid item>
      <StatusCardContextMenu
        size='large'
        menuItems={[
          <OpenLinkActionMenuItem
            key='view-on-roblox'
            actionKey='viewOnRoblox'
            url={getUrlForItemType(Item.Game, rootPlaceId) ?? ''}
            actionName={translate('Action.OpenExperienceDetails')}
          />,
          <CopyTextActionMenuItem
            actionName={translate('Action.CopyUniverseID')}
            itemName={translate('Label.UniverseID')}
            key='copy-universe-id'
            actionKey='copyUniverseId'
            textToCopy={universeId.toString()}
          />,
          <CopyTextActionMenuItem
            actionName={translate('Action.CopyStartPlaceID')}
            itemName={translate('Label.StartPlaceID')}
            key='copy-start-place-id'
            actionKey='copyPlaceId'
            textToCopy={rootPlaceId.toString()}
          />,
          <CopyTextActionMenuItem
            actionName={translate('Action.CopyURL')}
            itemName={translate('Label.URL')}
            key='copy-url'
            actionKey='copyURL'
            textToCopy={`${process.env.baseUrl}${dashboard.getExperienceOverviewUrl(universeId)}`}
          />,
        ]}
      />
    </Grid>
  );
};

export default OverviewHeaderContextMenu;
