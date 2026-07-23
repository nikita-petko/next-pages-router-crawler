import React, { FC, useCallback } from 'react';
import { DateRangeType, useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic';
import { Grid } from '@rbx/ui';
import DateRangeControl from '../../components/DateRangeControl';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';

type AnalyticsPageDateRangeControlProps = {
  dateRangeOptions?: DateRangeType[];
};

const AnalyticsPageDateRangeControl: FC<AnalyticsPageDateRangeControlProps> = ({
  dateRangeOptions,
}) => {
  const {
    rangeType,
    onChangeRangeType,
    startDate,
    endDate,
    minStartDate,
    maxEndDate,
    maxRangeDays,
    onChangeDateRangeParams,
  } = useAnalyticsCurrentDateRangeBundle();
  const {
    classes: { controlBarSelector },
  } = useAnalyticsPageControlBarStyles();

  const onCustomDateRangeChangeConfirmed = useCallback(
    (customStartDate: Date, customEndDate: Date) => {
      onChangeDateRangeParams(customStartDate, customEndDate, DateRangeType.Custom);
    },
    [onChangeDateRangeParams],
  );

  return (
    <Grid item>
      <DateRangeControl
        dateRangeType={rangeType}
        dateRangeOptions={dateRangeOptions}
        startDate={startDate}
        endDate={endDate}
        minStartDate={minStartDate}
        maxEndDate={maxEndDate}
        maxRangeDays={maxRangeDays}
        onChangeRangeType={onChangeRangeType}
        selectClassName={controlBarSelector}
        onCustomDateRangeChangeConfirmed={onCustomDateRangeChangeConfirmed}
      />
    </Grid>
  );
};

export default AnalyticsPageDateRangeControl;
