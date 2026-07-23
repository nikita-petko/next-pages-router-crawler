import type { FunctionComponent } from 'react';
import React from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { AppBar, Grid, useMediaQuery } from '@rbx/ui';
import useAnalyticsPageStyles from '@modules/charts-generic/layout/AnalyticsPage.styles';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import type { ExperienceAnalyticsPageControl } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar';
import type { FilterBarControlProps } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarControl';
import ExperienceAnalyticsRAQIV2FilterDrawerControls from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsRAQIV2FilterDrawerControls';
import type { NonRAQIUIDimension } from './ExperienceAnalyticsPageControlBar/filterUtils';

type AnalyticsTabContentLayoutProps = {
  controls: Array<ExperienceAnalyticsPageControl>;

  filterBar?: FilterBarControlProps;

  forceNonStickyControlBar?: boolean;

  resource?: RAQIV2ChartResource;
  filterDimensions?: Readonly<NonRAQIUIDimension[]>;
  raqiDimensions?: Readonly<TRAQIV2Dimension[]>;
};

// NOTE(shumingxu, 2024/07/02): This component is deprecated due to the lack of standardized Grid layout.
// Use AnalyticsTabContentLayoutV2 instead.
const AnalyticsTabContentLayoutDeprecated: FunctionComponent<
  React.PropsWithChildren<AnalyticsTabContentLayoutProps>
> = ({
  controls,
  filterBar,
  filterDimensions,
  raqiDimensions,
  forceNonStickyControlBar = false,
  resource,
  children,
}) => {
  if (filterDimensions && !resource) {
    throw new Error(
      'AnalyticsTabContentLayoutDeprecated: resource is required when filterDimensions is provided',
    );
  }
  const {
    classes: { appBarStyles },
  } = useAnalyticsPageStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  const hasFilterDimensions = filterDimensions?.length || raqiDimensions?.length;
  const controlBar = hasFilterDimensions ? (
    <ExperienceAnalyticsRAQIV2FilterDrawerControls
      controls={controls}
      filterBar={filterBar}
      filterDimensions={filterDimensions}
      raqiDimensions={raqiDimensions}
      resource={resource}
    />
  ) : (
    <ExperienceAnalyticsRAQIV2FilterDrawerControls
      controls={controls}
      filterBar={filterBar}
      filterDimensions={undefined}
      raqiDimensions={undefined}
      resource={resource}
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
      {floaterBar}
      {children}
    </Grid>
  );
};

export default AnalyticsTabContentLayoutDeprecated;
