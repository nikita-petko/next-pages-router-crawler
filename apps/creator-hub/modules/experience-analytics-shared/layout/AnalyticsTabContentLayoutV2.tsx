import type { FunctionComponent } from 'react';
import React from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { AppBar, Grid, useMediaQuery } from '@rbx/ui';
import useAnalyticsPageStyles from '@modules/charts-generic/layout/AnalyticsPage.styles';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import type { FilterPositionOverrides } from '../utils/filterPositionOnPageByDimension';
import type { ExperienceAnalyticsPageControl } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar';
import type { FilterBarControlProps } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarControl';
import ExperienceAnalyticsRAQIV2FilterDrawerControls from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsRAQIV2FilterDrawerControls';

type AnalyticsTabContentLayoutV2Props = {
  controls: Array<ExperienceAnalyticsPageControl>;
  rightSideControls?: Array<ExperienceAnalyticsPageControl>;
  preControlContent?: React.ReactNode;

  filterBar?: FilterBarControlProps;
  raqiDimensions?: ReadonlyArray<TRAQIV2Dimension>;
  resource?: RAQIV2ChartResource;

  /** Per-page overrides for which RAQIV2FilterRenderPosition each dimension renders into. */
  filterPositionOverrides?: FilterPositionOverrides;

  forceNonStickyControlBar?: boolean;
};

// NOTE(shumingxu, 06/27/2024): I made the mistake to not standardize grid layouts in the V1 component,
// and now it's used a bit at too many places with different layouts. So making a V2 with standardized grid layout.
const AnalyticsTabContentLayoutV2: FunctionComponent<
  React.PropsWithChildren<AnalyticsTabContentLayoutV2Props>
> = ({
  controls,
  rightSideControls,
  preControlContent,
  filterBar,
  raqiDimensions,
  resource,
  filterPositionOverrides,
  forceNonStickyControlBar = false,
  children,
}) => {
  if (raqiDimensions && !resource) {
    throw new Error(
      'ExperienceAnalyticsTabbedPageLayout: resource is required when filterDimensions is provided',
    );
  }

  const {
    classes: { appBarStyles },
  } = useAnalyticsPageStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const controlBar = (
    <ExperienceAnalyticsRAQIV2FilterDrawerControls
      controls={controls}
      rightSideControls={rightSideControls}
      filterBar={filterBar}
      raqiDimensions={raqiDimensions}
      resource={resource}
      filterPositionOverrides={filterPositionOverrides}
    />
  );

  const floaterBar =
    isCompactView || forceNonStickyControlBar ? (
      controlBar
    ) : (
      <AppBar position='sticky' color='inherit' className={appBarStyles}>
        {controlBar}
      </AppBar>
    );

  return (
    <Grid container direction='column'>
      {preControlContent && <Grid item>{preControlContent}</Grid>}
      {floaterBar}
      <Grid container spacing='24px'>
        {children}
      </Grid>
    </Grid>
  );
};

export default AnalyticsTabContentLayoutV2;
