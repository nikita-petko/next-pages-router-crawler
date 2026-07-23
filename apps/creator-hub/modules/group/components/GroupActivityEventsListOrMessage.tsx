import React, { FunctionComponent } from 'react';
import { ActivityFeedItemList, ItemGridEmptyView, ActivityFeedItemInfo } from '@modules/creations';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid, RestoreIcon, Typography } from '@rbx/ui';
import useGroupActivityHistoryControllerStyles from './GroupActivityHistoryController.styles';

const GroupActivityEventsListOrMessage: FunctionComponent<{
  error: boolean;
  activityFeedLoading: boolean;
  settingsFetched: boolean;
  filteredItems: ActivityFeedItemInfo[];
  isSmallScreen: boolean;
  settings: { enableActivityFeedLocation: boolean };
}> = ({ error, activityFeedLoading, settingsFetched, filteredItems, isSmallScreen, settings }) => {
  const { translate } = useTranslation();
  const {
    classes: { root, textHeader, restoreIcon },
  } = useGroupActivityHistoryControllerStyles();

  if (error) {
    return <ItemGridEmptyView emptyMessage={translate('Message.FailedToLoadPage')} />;
  }
  if (activityFeedLoading || !settingsFetched) {
    return <CircularProgress />;
  }
  return filteredItems.length !== 0 ? (
    <ActivityFeedItemList
      activityFeedItems={filteredItems}
      isSmallScreen={isSmallScreen}
      includeLocationColumn={settings.enableActivityFeedLocation}
    />
  ) : (
    <Grid className={root} container direction='column' alignItems='center' justifyContent='center'>
      <Grid item>
        <RestoreIcon className={restoreIcon} />
      </Grid>
      <Grid item className={textHeader}>
        <Typography color='primary' variant='h1' align={isSmallScreen ? 'center' : 'left'}>
          {translate('Description.NoActivityFound')}
        </Typography>
      </Grid>
      <Grid item>
        <Typography color='secondary' align={isSmallScreen ? 'center' : 'left'}>
          {translate('Description.AdjustFilters')}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default GroupActivityEventsListOrMessage;
