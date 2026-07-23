import type { FunctionComponent } from 'react';
import React from 'react';
import type { TGroup } from '@modules/authentication/types';
import { Asset } from '@modules/miscellaneous/common';
import MomentsCreationsToolbar from '../../home/components/MomentsCreationsToolbar';
import MomentsSubmenu from '../../home/components/MomentsSubmenu';
import CreationAccessBlockedBanner from '../../verification/components/CreationAccessBlockedBanner';
import type { VerificationMetadataContextValue } from '../../verification/hooks/VerificationMetadataContext';
import CreationsSubmenu from '../components/CreationsSubmenu';
import CreationsToolbar from '../components/CreationsToolbar';
import type MenuState from '../interfaces/MenuState';

export interface CreationsIANavigationControlsProps {
  menuState: MenuState;
  onMenuStateChange: (newState: MenuState) => void;
  verificationMetadata: VerificationMetadataContextValue | undefined;
  group: TGroup | null;
}

const CreationsIANavigationControls: FunctionComponent<
  React.PropsWithChildren<CreationsIANavigationControlsProps>
> = ({ menuState, onMenuStateChange, verificationMetadata, group }) => {
  const eventItemTypes = [Asset.UpcomingEvent, Asset.PastEvent, Asset.DraftEvent];
  const isEventItem = menuState.submenuItem
    ? eventItemTypes.includes(menuState.submenuItem.type)
    : false;

  return (
    <div className='flex justify-between padding-top-small'>
      {menuState.menuItem.type === Asset.TShirt && (
        <CreationAccessBlockedBanner data={verificationMetadata} />
      )}
      {!isEventItem && (
        <div className='flex width-full padding-bottom-large [align-content:flex-start] [row-gap:12px] justify-between flex-row items-start wrap'>
          {menuState.menuItem.type === Asset.Moments ? (
            <>
              <MomentsSubmenu />
              <MomentsCreationsToolbar />
            </>
          ) : (
            <>
              {menuState.submenuItem && (
                <CreationsSubmenu
                  menuState={menuState}
                  onMenuStateChange={onMenuStateChange}
                  group={group}
                />
              )}
              <CreationsToolbar menuState={menuState} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CreationsIANavigationControls;
