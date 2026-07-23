import type { FC } from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { Grid } from '@rbx/ui';
import ChartConfiguratorDateRangeControl from '../../components/chartConfigurator/components/ChartConfiguratorDateRangeControl';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';

const defaultDateRangeOptions: readonly RAQIV2DateRangeType[] = [
  RAQIV2DateRangeType.Last7Days,
  RAQIV2DateRangeType.Last28Days,
  RAQIV2DateRangeType.Last56Days,
  RAQIV2DateRangeType.Last90Days,
  RAQIV2DateRangeType.Custom,
];

type AnalyticsPageDateRangeControlProps = {
  dateRangeOptions?: readonly RAQIV2DateRangeType[];
};

const AnalyticsPageDateRangeControl: FC<AnalyticsPageDateRangeControlProps> = ({
  dateRangeOptions,
}) => {
  const {
    classes: { foundationControlBarSelector },
  } = useAnalyticsPageControlBarStyles();

  return (
    <Grid item>
      <ChartConfiguratorDateRangeControl
        dateRangeOptions={dateRangeOptions ?? defaultDateRangeOptions}
        className={foundationControlBarSelector}
      />
    </Grid>
  );
};

export default AnalyticsPageDateRangeControl;
