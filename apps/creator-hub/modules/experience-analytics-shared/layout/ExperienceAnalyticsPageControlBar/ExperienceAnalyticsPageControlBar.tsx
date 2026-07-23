import type { FC, ReactElement } from 'react';
import { Grid, useMediaQuery } from '@rbx/ui';
import type FilterDrawerButton from '@modules/charts-generic/components/FilterDrawer/FilterDrawerButton';
import type AnalyticsPageAnnotationsControl from './AnalyticsPageAnnotationsControl';
import type AnalyticsPageDateRangeControl from './AnalyticsPageDateRangeControl';
import type ExperienceAnalyticsPageBreakdownControl from './ExperienceAnalyticsPageBreakdownControl';
import useAnalyticsPageControlBarStyles from './ExperienceAnalyticsPageControlBar.styles';
import type { FilterBarControlProps } from './ExperienceAnalyticsPageFilterBarControl';
import ExperienceAnalyticsPageFilterBarControl from './ExperienceAnalyticsPageFilterBarControl';

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

  if (!controls.length && !filterBarProps) {
    return null;
  }

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
