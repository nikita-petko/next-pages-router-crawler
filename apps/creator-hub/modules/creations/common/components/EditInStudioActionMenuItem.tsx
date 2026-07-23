import React, { FunctionComponent } from 'react';
import { LaunchIcon, ListItemIcon, MenuItem } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { EStudioTaskType, useStudio } from '@modules/miscellaneous/hooks';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { gamejoinClient } from '@modules/clients';
import { useSettings } from '@modules/settings';

export type EditInStudioActionMenuItemProps = {
  universeId?: number | string;
  placeId?: number | string;
  openStudio: ReturnType<typeof useStudio>['open'];
};

// TODO(yanzhuang, CRF-4038): add tests for action menu item
const EditInStudioActionMenuItem: FunctionComponent<
  React.PropsWithChildren<EditInStudioActionMenuItemProps>
> = ({ universeId, placeId, openStudio }) => {
  const { translate } = useTranslation();
  const { settings } = useSettings();

  return (
    <MenuItem
      onClick={() => {
        if (settings.enableUseStudioEditPlaceLauncherWithPrelaunch) {
          // Pre-launch the Team Create RCC server so it is ready by the time Studio finishes starting
          if (placeId !== undefined) {
            gamejoinClient.teamCreatePreemptive(Number(placeId));
          }
        }

        openStudio({
          task: EStudioTaskType.EditPlace,
          universeId: universeId?.toString() || '',
          placeId: placeId?.toString() || '',
        });
        unifiedLoggerClient.logClickEvent({ eventName: `clickActionMenuItem.editInStudio` });
      }}>
      <ListItemIcon>
        <LaunchIcon />
      </ListItemIcon>
      {translate('Heading.EditInStudio')}
    </MenuItem>
  );
};

export default EditInStudioActionMenuItem;
