import type { FunctionComponent } from 'react';
import { Button, Checkbox, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import type { ServerStatus } from '../../../../types/GameServerControls';
import {
  areAllServerStatusesSelected,
  DEFAULT_SERVER_STATUS_FILTER,
  NONE_SELECTED_SERVER_STATUS_FILTER,
  SERVER_STATUS_DESCRIPTIONS,
  SERVER_STATUS_FILTER_KEYS,
  SERVER_STATUS_KEYS,
} from '../../../../utils/serverStatus';
import useFilterSidebarStyles from '../FilterSidebar.styles';

export interface ServerStatusSectionProps {
  setServerStatus: (type: ServerStatus) => void;
  currentStatus: ServerStatus;
}

const ServerStatusSection: FunctionComponent<ServerStatusSectionProps> = ({
  setServerStatus,
  currentStatus,
}) => {
  const { translate } = useTranslation();
  const { classes } = useFilterSidebarStyles();
  const { checkboxSection, checkboxGroup } = classes;
  const allSelected = areAllServerStatusesSelected(currentStatus);

  return (
    <Grid container className={checkboxSection}>
      <Grid item>
        <Typography variant='captionHeader'>
          {translate('ServerListTable.Filter.ServerStatus')}
        </Typography>
      </Grid>
      <Grid item>
        <Button
          variant='Link'
          size='Small'
          onClick={() =>
            setServerStatus(
              allSelected
                ? { ...NONE_SELECTED_SERVER_STATUS_FILTER }
                : { ...DEFAULT_SERVER_STATUS_FILTER },
            )
          }>
          {translate(allSelected ? 'Action.DeselectAll' : 'Action.SelectAll')}
        </Button>
      </Grid>
      <Grid item container className={checkboxGroup} direction='column'>
        {SERVER_STATUS_FILTER_KEYS.map((statusKey) => {
          const statusLabel = translate(SERVER_STATUS_KEYS[statusKey]);
          const statusDescription = translate(SERVER_STATUS_DESCRIPTIONS[statusKey]);
          return (
            <Grid item key={statusKey}>
              <Tooltip
                title=''
                description={statusDescription}
                position='right-center'
                contentClassName='text-wrap text-truncate-none no-clip text-align-x-left'>
                <TooltipTrigger asChild>
                  <div>
                    <Checkbox
                      label={statusLabel}
                      size='Medium'
                      isChecked={currentStatus[statusKey]}
                      placement='Start'
                      onCheckedChange={(checked) =>
                        setServerStatus({ ...currentStatus, [statusKey]: checked === true })
                      }
                    />
                  </div>
                </TooltipTrigger>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>
    </Grid>
  );
};

export default ServerStatusSection;
