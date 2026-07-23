import React, { useCallback } from 'react';
import { DatePicker, Grid, PickersUtilsProvider, TextField, useMediaQuery } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import {
  FilterDrawerChoicesType,
  GroupActivityHistoryFilterCategories,
  GroupActivityHistoryFilterDimensions,
} from '../constants/groupConstants';
import GroupActivityHistoryFilterDrawer from './GroupActivityHistoryFilterDrawer';
import useGroupActivityHistoryControllerStyles from './GroupActivityHistoryController.styles';
import GroupActivityHistoryFilterChips from './GroupActivityHistoryFilterChips';

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
  date: number;
  setDate: React.Dispatch<React.SetStateAction<number>>;
};

const GroupActivityHistoryController = ({
  filterDimensions,
  filters,
  onFilterChange,
  allUsernames,
  usernames,
  setUsernames,
  date,
  setDate,
}: GroupActivityHistoryControllerProps) => {
  const {
    classes: { controlBarPadding },
  } = useGroupActivityHistoryControllerStyles();
  const { translate } = useTranslation();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Small'));
  const handleDateChange = useCallback(
    (selectedDate: Date | null) => {
      if (selectedDate) {
        selectedDate.setHours(0);
        selectedDate.setMinutes(0);
        selectedDate.setSeconds(0);
        selectedDate.setMilliseconds(0);
        setDate(Math.floor(selectedDate.getTime()));
      }
    },
    [setDate],
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
            <PickersUtilsProvider>
              <DatePicker
                disableFuture
                label='Date Picker'
                onChange={handleDateChange}
                openTo='day'
                orientation='portrait'
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant='outlined'
                    id='values'
                    label={translate('Label.DateRange')}
                  />
                )}
                value={new Date(date)}
                views={['year', 'month', 'day']}
              />
            </PickersUtilsProvider>
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
