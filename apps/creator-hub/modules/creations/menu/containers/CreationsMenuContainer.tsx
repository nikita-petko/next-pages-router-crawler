import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { Divider, Grid } from '@rbx/ui';
import { isAssetAccessRequestsEnabled } from '@generated/flags/contentAccessAndInventory';
import type { TGroup } from '@modules/authentication/types';
import { Asset } from '@modules/miscellaneous/common';
import Flex from '@modules/miscellaneous/components/Flex';
import MomentsCreationsToolbar from '../../home/components/MomentsCreationsToolbar';
import MomentsSubmenu from '../../home/components/MomentsSubmenu';
import CreationAccessBlockedBanner from '../../verification/components/CreationAccessBlockedBanner';
import type { VerificationMetadataContextValue } from '../../verification/hooks/VerificationMetadataContext';
import CreationsMenu from '../components/CreationsMenu';
import CreationsSubmenu from '../components/CreationsSubmenu';
import CreationsToolbar from '../components/CreationsToolbar';
import type MenuItem from '../interfaces/MenuItem';
import type MenuState from '../interfaces/MenuState';
import useMenuContainerStyles from './CreationsMenuContainer.styles';

export interface CreationsMenuContainerProps {
  menuItems: MenuItem[];
  menuState: MenuState;
  onMenuStateChange: (newState: MenuState) => void;
  verificationMetadata: VerificationMetadataContextValue | undefined;
  group: TGroup | null;
  isMarketplaceAssetType?: boolean;
}

const CreationsMenuContainer: FunctionComponent<
  React.PropsWithChildren<CreationsMenuContainerProps>
> = ({
  menuItems,
  menuState,
  onMenuStateChange,
  verificationMetadata,
  group,
  isMarketplaceAssetType,
}) => {
  const eventItemTypes = ['UpcomingEvent', 'PastEvent', 'DraftEvent'];
  const {
    classes: { menuContainer, subMenuToolbarContainer },
  } = useMenuContainerStyles();

  const { value: isAAREnabled } = useFlag(isAssetAccessRequestsEnabled);
  const visibleMenuItems = useMemo(
    () => menuItems.filter((item) => item.type !== Asset.AssetPermissionRequests || isAAREnabled),
    [menuItems, isAAREnabled],
  );

  return (
    <Grid container justifyContent='space-between' className={menuContainer}>
      <Grid item XSmall={12}>
        <CreationsMenu
          menuItems={visibleMenuItems}
          menuState={menuState}
          onMenuStateChange={onMenuStateChange}
          group={group}
          isMarketplaceAssetType={isMarketplaceAssetType}
        />
        <Divider />
      </Grid>
      {menuState.menuItem.type === Asset.TShirt && (
        <CreationAccessBlockedBanner data={verificationMetadata} />
      )}
      {!eventItemTypes.includes(menuState.submenuItem?.type ?? '') && (
        <Flex
          classes={{ root: subMenuToolbarContainer }}
          justifyContent='space-between'
          flexDirection='row'
          alignItems='flex-start'
          flexWrap='wrap'>
          {menuState.menuItem.type === Asset.Moments ? (
            <>
              <MomentsSubmenu />
              <MomentsCreationsToolbar />
            </>
          ) : (
            <>
              {menuState.submenuItem ? (
                <CreationsSubmenu
                  menuState={menuState}
                  onMenuStateChange={onMenuStateChange}
                  group={group}
                />
              ) : null}
              <CreationsToolbar menuState={menuState} />
            </>
          )}
        </Flex>
      )}
    </Grid>
  );
};

export default CreationsMenuContainer;
