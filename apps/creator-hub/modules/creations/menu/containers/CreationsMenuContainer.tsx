import React, { FunctionComponent } from 'react';
import { Divider, Grid } from '@rbx/ui';
import type { TGroup } from '@modules/authentication/types';
import { Flex } from '@modules/miscellaneous/common/components';
import MenuState from '../interfaces/MenuState';
import MenuItem from '../interfaces/MenuItem';
import CreationsMenu from '../components/CreationsMenu';
import CreationsToolbar from '../components/CreationsToolbar';
import CreationsSubmenu from '../components/CreationsSubmenu';
import useMenuContainerStyles from './CreationsMenuContainer.styles';
import CreationAccessBlockedBanner from '../../verification/components/CreationAccessBlockedBanner';
import { VerificationMetadataContextValue } from '../../verification/hooks/VerificationMetadataContext';
import TaxonomyAnnouncementBanner from '../../avatarItem/components/TaxonomyAnnouncementBanner';

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
  return (
    <Grid container justifyContent='space-between' className={menuContainer}>
      <Grid item XSmall={12}>
        <CreationsMenu
          menuItems={menuItems}
          menuState={menuState}
          onMenuStateChange={onMenuStateChange}
          group={group}
          isMarketplaceAssetType={isMarketplaceAssetType}
        />
        <Divider />
      </Grid>
      {menuState.menuItem.type === 'TShirt' && <TaxonomyAnnouncementBanner />}
      {menuState.menuItem.type === 'TShirt' && (
        <CreationAccessBlockedBanner data={verificationMetadata} />
      )}
      {!eventItemTypes.includes(menuState.submenuItem?.type ?? '') && (
        <Flex
          classes={{ root: subMenuToolbarContainer }}
          justifyContent='space-between'
          flexDirection='row'
          alignItems='flex-start'
          flexWrap='wrap'>
          {menuState.submenuItem && (
            <CreationsSubmenu
              menuState={menuState}
              onMenuStateChange={onMenuStateChange}
              group={group}
            />
          )}
          <CreationsToolbar menuState={menuState} />
        </Flex>
      )}
    </Grid>
  );
};

export default CreationsMenuContainer;
