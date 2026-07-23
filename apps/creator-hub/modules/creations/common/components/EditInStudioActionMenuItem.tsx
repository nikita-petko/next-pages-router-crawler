import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { LaunchIcon, ListItemIcon, MenuItem } from '@rbx/ui';
import gamejoinClient from '@modules/clients/gamejoin';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import type { useStudio } from '@modules/miscellaneous/hooks';
import { EStudioTaskType } from '@modules/miscellaneous/hooks';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';

export type EditInStudioActionMenuItemProps = {
  universeId?: number | string;
  placeId?: number | string;
  openStudio: ReturnType<typeof useStudio>['open'];
};

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
          universeId: universeId?.toString() ?? '',
          placeId: placeId?.toString() ?? '',
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
