import type { FunctionComponent } from 'react';
import { Grid } from '@rbx/ui';
import MonthRangePicker from '@modules/charts-generic/charts/MonthRangePicker';
import { useAccountActivityFilter } from '../AccountActivityProvider/AccountActivityProvider';
import useAccountActivityFilterStyles from './AccountActivityFilter.styles';

const AccountActivityFilter: FunctionComponent = () => {
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
