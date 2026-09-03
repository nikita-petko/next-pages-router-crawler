import React, { useCallback } from 'react';
import { Grid, useMediaQuery } from '@rbx/ui';
import DateRangeSelector from '@modules/licenses/components/DateRangeSelector';
import type {
  FilterDrawerChoicesType,
  GroupActivityHistoryFilterCategories,
  GroupActivityHistoryFilterDimensions,
} from '../constants/groupConstants';
import { getEndOfDay } from '../constants/groupConstants';
import useGroupActivityHistoryControllerStyles from './GroupActivityHistoryController.styles';
import GroupActivityHistoryFilterChips from './GroupActivityHistoryFilterChips';
import GroupActivityHistoryFilterDrawer from './GroupActivityHistoryFilterDrawer';

type GroupActivityHistoryControllerProps = {
  filterDimensions: GroupActivityHistoryFilterDimensions[];
  filters: FilterDrawerChoicesType;
  onFilterChange: (
    key: GroupActivityHistoryFilterDimensions,
    newValue: GroupActivityHistoryFilterCategories[],
  ) => void;
  allUsernames: string[];
  usernames: string[];
  setUsernames: (selected: string[]) => void;
  startDate: Date;
  setStartDate: (d: Date) => void;
  endDate: Date;
  setEndDate: (d: Date) => void;
};

const GroupActivityHistoryController = ({
  filterDimensions,
  filters,
  onFilterChange,
  allUsernames,
  usernames,
  setUsernames,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: GroupActivityHistoryControllerProps) => {
  const {
    classes: { controlBarPadding },
  } = useGroupActivityHistoryControllerStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Small'));

  const handleDateRangeChange = useCallback(
    ({ startDate: start, endDate: end }: { startDate: Date | null; endDate: Date | null }) => {
      if (start) {
        setStartDate(start);
      }
      if (end) {
        setEndDate(getEndOfDay(end));
      }
    },
    [setStartDate, setEndDate],
  );

  return (
    <Grid paddingBottom={1}>
      <Grid
        container
        direction={isCompactView ? 'column' : 'row'}
        justifyContent='space-between'
        className={controlBarPadding}
        alignItems={isCompactView ? 'left' : 'center'}>
        <Grid item>
          <Grid
            container
            justifyContent='flex-start'
            direction='row'
            spacing={1}
            alignItems='center'>
            <DateRangeSelector
              disableFuture
              maxLookbackMonths={24}
              value={{ startDate, endDate }}
              onChange={handleDateRangeChange}
            />
            {filterDimensions.length ? (
              <GroupActivityHistoryFilterDrawer
                filterDimensions={filterDimensions}
                filters={filters}
                onFilterChange={onFilterChange}
                allUsernames={allUsernames}
                usernames={usernames}
                setUsernames={setUsernames}
              />
            ) : null}
          </Grid>
        </Grid>
      </Grid>
      <GroupActivityHistoryFilterChips
        filters={filters}
        onFilterChange={onFilterChange}
        usernames={usernames}
        setUsernames={setUsernames}
      />
    </Grid>
  );
};

export default GroupActivityHistoryController;
