import { Grid, useMediaQuery } from '@rbx/ui';
import React, { FC, ReactElement } from 'react';
import { FilterDrawerButton } from '@modules/charts-generic';
import ExperienceAnalyticsPageBreakdownControl from './ExperienceAnalyticsPageBreakdownControl';
import AnalyticsPageDateRangeControl from './AnalyticsPageDateRangeControl';
import AnalyticsPageAnnotationsControl from './AnalyticsPageAnnotationsControl';
import ExperienceAnalyticsPageFilterBarControl, {
  FilterBarControlProps,
} from './ExperienceAnalyticsPageFilterBarControl';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';

export type ExperienceAnalyticsPageControl = ReactElement<
  | typeof AnalyticsPageDateRangeControl
  | typeof ExperienceAnalyticsPageBreakdownControl
  | typeof AnalyticsPageAnnotationsControl
  | typeof FilterDrawerButton
>;

const ExperienceAnalyticsPageControlBar: FC<{
  controls: Array<ExperienceAnalyticsPageControl>;
  filterBar?: FilterBarControlProps;
}> = ({ controls, filterBar: filterBarProps }) => {
  const {
    classes: { controlBarPadding },
  } = useAnalyticsPageControlBarStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  if (!controls.length && !filterBarProps) return null;

  return (
    <Grid
      container
      direction={isCompactView ? 'column' : 'row'}
      justifyContent='space-between'
      className={controlBarPadding}
      alignItems={isCompactView ? 'left' : 'center'}>
      <Grid item>
        <Grid container justifyContent='flex-start' direction='row' spacing={1} alignItems='center'>
          {controls}
        </Grid>
      </Grid>
      {filterBarProps ? (
        <Grid item>
          <Grid
            container
            justifyContent='flex-start'
            direction='row'
            spacing={1}
            alignItems='center'>
            <ExperienceAnalyticsPageFilterBarControl {...filterBarProps} />
          </Grid>
        </Grid>
      ) : null}
    </Grid>
  );
};

export default ExperienceAnalyticsPageControlBar;
