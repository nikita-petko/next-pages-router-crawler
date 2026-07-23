import { ItemGridEmptyView } from '@modules/creations/common';
import { useSettings } from '@modules/settings';
import { useTranslation } from '@rbx/intl';
import { CircularProgress, Grid } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import useActivityFeedStyles from '../components/ActivityFeed.styles';
import ActivityFeedDateRange from '../components/ActivityFeedDateRange';
import ActivityFeedFilterMenu from '../components/ActivityFeedFilterMenu';
import ActivityFeedItemList from '../components/ActivityFeedItemList';
import { Categories, allCategoriesEnums, categoryEventMapping } from '../enums/ActivityFeedEnums';
import ActivityFeedServiceProvider from '../hooks/ActivityFeedServiceProvider';
import { ActivityFeedEvent, useActivityFeedItemInfo } from '../hooks/useActivityFeedItemInfo';
import useActivityFeedService from '../hooks/useActivityFeedService';

export interface ActivityFeedGridContentProps {
  isSmallScreen: boolean;
  universeId: number;
  mockServiceResponsesForTesting?: ActivityFeedEvent[];
}

export const ActivityFeedGridContent: FunctionComponent<
  React.PropsWithChildren<ActivityFeedGridContentProps>
> = ({ mockServiceResponsesForTesting, isSmallScreen, universeId }) => {
  const { translate } = useTranslation();
  const {
    classes: { smallScreenMargin },
  } = useActivityFeedStyles();
  const { serviceResponses, fetchServiceResponses } = useActivityFeedService();
  const { settings, isFetched: settingsFetched } = useSettings();
  const {
    activityFeedItemInfo,
    usernames: allUsernames,
    placeNames: allPlaceNames,
    isLoading: activityFeedLoading,
    error,
  } = useActivityFeedItemInfo(universeId ?? -1, mockServiceResponsesForTesting ?? serviceResponses);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [selectedPlaceNames, setSelectedPlaceNames] = useState<string[]>([]);
  const [date, setDate] = useState<number>(Date.now());

  useEffect(() => {
    if (!mockServiceResponsesForTesting) {
      fetchServiceResponses(universeId ?? 0);
    }
  }, [mockServiceResponsesForTesting]);

  const selectedEventTypeIds = useMemo(() => {
    return (selectedCategories.length === 0 ? allCategoriesEnums : selectedCategories)
      .map((category) => categoryEventMapping[category as Categories])
      .flat();
  }, [selectedCategories]);

  const applySelectedItems = useCallback(
    (categories: string[], usernames: string[], placeNames: string[]) => {
      setSelectedCategories(categories);
      setSelectedUsernames(usernames);
      setSelectedPlaceNames(placeNames);
    },
    [],
  );

  const filteredItems = activityFeedItemInfo.filter((item) => {
    if (!item.translationString || item.translationString.length === 0) return false; // Ignore empty events
    if (!selectedEventTypeIds.includes(item.filters.eventType)) return false;
    if (selectedUsernames.length !== 0 && !selectedUsernames.includes(item.username)) return false;
    if (
      selectedPlaceNames.length !== 0 &&
      item.location &&
      !selectedPlaceNames.includes(item.location)
    )
      return false;
    return item.filters.createdUtc <= date;
  });

  const ActivityFeedListOrMessage: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
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
      <ItemGridEmptyView emptyMessage={translate('Message.EmptyActivityFeed')} />
    );
  };

  return (
    <Grid container justifyContent='flex-start' className={isSmallScreen ? smallScreenMargin : ''}>
      <ActivityFeedFilterMenu
        allCategories={allCategoriesEnums}
        allUsernames={allUsernames}
        allPlaceNames={allPlaceNames}
        applySelectedItems={applySelectedItems}
      />
      <ActivityFeedDateRange date={date} setDate={setDate} />
      <Grid container direction='column' alignItems='center'>
        <ActivityFeedListOrMessage />
      </Grid>
    </Grid>
  );
};

export interface ActivityFeedGridContainerProps {
  isSmallScreen: boolean;
  universeId: number;
}

const ActivityFeedGridContainer: FunctionComponent<
  React.PropsWithChildren<ActivityFeedGridContainerProps>
> = ({ isSmallScreen, universeId }) => {
  return (
    <ActivityFeedServiceProvider>
      <ActivityFeedGridContent isSmallScreen={isSmallScreen} universeId={universeId} />
    </ActivityFeedServiceProvider>
  );
};

export default ActivityFeedGridContainer;
