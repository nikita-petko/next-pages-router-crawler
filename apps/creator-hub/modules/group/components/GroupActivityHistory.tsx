import { useSettings } from '@modules/settings';
import { Grid, Pagination } from '@rbx/ui';
import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { EventType } from '@modules/creations';
import { Organization } from '@modules/clients/organizationApi';
import useGetOrgsActivityFeed from '@modules/react-query/activityFeed/activityFeedQueries';
import useGetGroupAuditLog from '@modules/react-query/groupAuditLog/groupAuditLogQueries';
import { GroupAuditLogActionTypes } from '@modules/clients';
import {
  useOrganizationActivityFeedItemInfo,
  affectedUserKey,
} from '../hooks/useOrganizationActivityFeedItemInfo';
import {
  ActivityHistoryPageSize,
  FilterDrawerChoicesType,
  GroupActivityHistoryEventTypesMapping,
  GroupActivityHistoryFilterDimensions,
  THIRTY_DAYS,
} from '../constants/groupConstants';
import GroupActivityHistoryController from './GroupActivityHistoryController';
import useGroupActivityHistoryControllerStyles from './GroupActivityHistoryController.styles';
import GroupActivityEventsListOrMessage from './GroupActivityEventsListOrMessage';

export interface GroupActivityHistoryProps {
  isSmallScreen: boolean;
  organization: Organization;
}

export interface GroupActivityHistoryContentProps {
  isSmallScreen: boolean;
  organization: Organization;
}

// TODO: Add more dimensions as we add events
const filterDimensions = [
  GroupActivityHistoryFilterDimensions.Creator,
  GroupActivityHistoryFilterDimensions.Content,
  GroupActivityHistoryFilterDimensions.Membership,
  GroupActivityHistoryFilterDimensions.Monetization,
  GroupActivityHistoryFilterDimensions.GroupSettings,
];

const defaultDrawerChoices: FilterDrawerChoicesType = filterDimensions.reduce((acc, dimension) => {
  acc[dimension] = [];
  return acc;
}, {} as FilterDrawerChoicesType);

export const GroupActivityHistoryContent: FunctionComponent<
  React.PropsWithChildren<GroupActivityHistoryContentProps>
> = ({ isSmallScreen, organization }) => {
  const {
    classes: { smallScreenMargin },
  } = useGroupActivityHistoryControllerStyles();
  const [date, setDate] = useState<number>(Date.now() - THIRTY_DAYS);
  const { data: orgsServiceResponses, isLoading: getActivityFeedLoading } = useGetOrgsActivityFeed(
    organization.id,
    date,
  );
  const { data: auditLogResponses, isLoading: getAuditLogLoading } = useGetGroupAuditLog(
    organization.groupId,
    date,
  );
  const { settings, isFetched: settingsFetched } = useSettings();
  const {
    activityFeedItemInfo,
    usernames: allUsernames,
    isLoading: activityFeedLoading,
    error,
  } = useOrganizationActivityFeedItemInfo(
    organization.groupId ?? '',
    orgsServiceResponses ?? [],
    auditLogResponses,
  );

  const [selectedUsernames, setSelectedUsernames] = useState<string[]>([]);
  const [page, setPage] = React.useState<number>(1);

  const [drawerChoices, setDrawerChoices] = useState<FilterDrawerChoicesType>(defaultDrawerChoices);

  const handleOptionsChange = useCallback((key: string, selectedOptions: string[]) => {
    setDrawerChoices((prevChoices) => {
      return {
        ...prevChoices,
        [key]: selectedOptions,
      };
    });
  }, []);

  const selectedEventTypes: (EventType | GroupAuditLogActionTypes)[] = useMemo(() => {
    return Object.values(drawerChoices)
      .flat()
      .map((value) => GroupActivityHistoryEventTypesMapping[value])
      .flat();
  }, [drawerChoices]);

  const filteredItems = useMemo(
    () =>
      activityFeedItemInfo.filter((item) => {
        if (!item.translationString) {
          // remove untranslated items.
          return false;
        }

        const affectedUserIsSelected = selectedUsernames.some(
          (username) => item.usernameMetadata.get(affectedUserKey) === username,
        );
        if (
          (selectedUsernames.length &&
            !selectedUsernames.includes(item.username) &&
            !affectedUserIsSelected) ||
          (selectedEventTypes.length && !selectedEventTypes.includes(item.filters.eventType))
        ) {
          return false;
        }
        return item.filters.createdUtc >= date;
      }),
    [selectedUsernames, selectedEventTypes, activityFeedItemInfo, date],
  );

  const paginatedActivityFeedItems = useMemo(() => {
    const start = (page - 1) * ActivityHistoryPageSize;
    const end = start + ActivityHistoryPageSize;
    return filteredItems.slice(start, end);
  }, [filteredItems, page]);

  useEffect(() => {
    setPage(1);
  }, [filteredItems]);

  return (
    <Grid container justifyContent='flex-start' className={isSmallScreen ? smallScreenMargin : ''}>
      <GroupActivityHistoryController
        filterDimensions={filterDimensions}
        filters={drawerChoices}
        onFilterChange={handleOptionsChange}
        allUsernames={allUsernames}
        usernames={selectedUsernames}
        setUsernames={setSelectedUsernames}
        date={date}
        setDate={setDate}
      />
      <Grid container direction='column' alignItems='center'>
        <GroupActivityEventsListOrMessage
          error={error}
          activityFeedLoading={activityFeedLoading || getActivityFeedLoading || getAuditLogLoading}
          settingsFetched={settingsFetched}
          filteredItems={paginatedActivityFeedItems}
          isSmallScreen={isSmallScreen}
          settings={settings}
        />
        <Grid item container justifyContent='center' alignItems='center'>
          <Pagination
            page={page}
            nextProps={{
              disabled: !filteredItems[page * ActivityHistoryPageSize],
              onClick: () => setPage((prevPage) => prevPage + 1),
            }}
            previousProps={{
              disabled: page === 1,
              onClick: () => setPage((prevPage) => prevPage - 1),
            }}
            shape='circular'
            size='medium'
            variant='reduced'
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

const GroupActivityHistory: FunctionComponent<
  React.PropsWithChildren<GroupActivityHistoryContentProps>
> = ({ isSmallScreen, organization }) => {
  return <GroupActivityHistoryContent isSmallScreen={isSmallScreen} organization={organization} />;
};

export default GroupActivityHistory;
