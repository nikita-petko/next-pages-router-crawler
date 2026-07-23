import { Grid } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { MonthRangePicker } from '@modules/charts-generic';
import useAccountActivityFilterStyles from './AccountActivityFilter.styles';
import { useAccountActivityFilter } from '../AccountActivityProvider/AccountActivityProvider';

const AccountActivityFilter: FunctionComponent<{}> = () => {
  const {
    classes: { filterContainer },
  } = useAccountActivityFilterStyles();
  const { startMonth, endMonth, onChangeStartMonth, onChangeEndMonth } = useAccountActivityFilter();

  return (
    <Grid
      item
      container
      direction='row'
      XSmall={12}
      alignItems='center'
      className={filterContainer}>
      <MonthRangePicker
        startMonth={startMonth}
        endMonth={endMonth}
        onChangeStartMonth={onChangeStartMonth}
        onChangeEndMonth={onChangeEndMonth}
      />
    </Grid>
  );
};

export default AccountActivityFilter;
