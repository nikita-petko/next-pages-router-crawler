import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { IconButton, Menu, MenuItem, MoreHorizIcon, Typography } from '@rbx/ui';
// eslint-disable-next-line no-restricted-imports -- creations barrel not yet migrated
import useItemCardContainerStyles from '@modules/creations/common/containers/ItemCardContainer.styles';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import type { ActivityFeedItemInfo } from '../hooks/useActivityFeedItemInfo';
import { getEventTypeName } from '../utils/eventTypeUtils';

interface ActivityFeedItemCardContainerProps {
  activityFeedItemInfo: ActivityFeedItemInfo;
}

const ActivityFeedItemCardContainer: FunctionComponent<
  React.PropsWithChildren<ActivityFeedItemCardContainerProps>
> = ({ activityFeedItemInfo }) => {
  const {
    classes: { moreIconButton, menuOpenedButton },
    cx,
  } = useItemCardContainerStyles();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const { translate } = useTranslation();

  const handleClose = useCallback(() => {
    setIsMenuOpen(false);
    setMenuAnchor(null);
  }, []);

  return (
    <div>
      <IconButton
        tabIndex={0}
        data-testid='experience-options-button'
        aria-label='yay'
        className={cx({ [menuOpenedButton]: isMenuOpen }, moreIconButton)}
        color='onMediaDark'
        size='small'
        onClick={(event) => {
          setMenuAnchor(event.currentTarget);
          setIsMenuOpen(true);
        }}>
        <MoreHorizIcon color='action' />
      </IconButton>
      <Menu
        data-testid='experience-options-menu'
        open={isMenuOpen}
        anchorEl={menuAnchor}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
        <div>
          {activityFeedItemInfo.viewBasicSettingsLink && (
            <MenuItem
              data-testid='experience-menu-item-migrate-server'
              onClick={() => {
                window.open(activityFeedItemInfo.viewBasicSettingsLink, '_blank')?.focus();
                // Log click event for "View Basic Settings" button
                unifiedLoggerClient.logClickEvent({
                  eventName: 'clickActivityFeedEvent.viewBasicSettings',
                  parameters: {
                    eventType: getEventTypeName(activityFeedItemInfo.filters.eventType),
                  },
                });
              }}
              disabled={false}>
              <Typography>{translate('Action.ViewBasicSettings')}</Typography>
            </MenuItem>
          )}
          {activityFeedItemInfo.viewOnRobloxLink && (
            <MenuItem
              data-testid='experience-menu-item-migrate-server'
              onClick={() => {
                window.open(activityFeedItemInfo.viewOnRobloxLink, '_blank')?.focus();
                // Log click event for "View On Roblox" button
                unifiedLoggerClient.logClickEvent({
                  eventName: 'clickActivityFeedEvent.viewOnRoblox',
                  parameters: {
                    eventType: getEventTypeName(activityFeedItemInfo.filters.eventType),
                  },
                });
              }}
              disabled={false}>
              <Typography>{translate('Action.ViewOnRoblox')}</Typography>
            </MenuItem>
          )}
        </div>
      </Menu>
    </div>
  );
};

export default ActivityFeedItemCardContainer;
