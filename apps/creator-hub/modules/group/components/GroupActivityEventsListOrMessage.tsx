import type { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid, RestoreIcon, Typography } from '@rbx/ui';
import ActivityFeedItemList from '@modules/creations/activityFeed/components/ActivityFeedItemList';
import type { ActivityFeedItemInfo } from '@modules/creations/activityFeed/hooks/useActivityFeedItemInfo';
import ItemGridEmptyView from '@modules/creations/common/components/ItemGridEmptyView/ItemGridEmptyView';
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
