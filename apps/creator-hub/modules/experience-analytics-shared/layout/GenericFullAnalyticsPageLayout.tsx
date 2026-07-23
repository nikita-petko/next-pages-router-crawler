import type { FunctionComponent, ReactElement } from 'react';
import React, { useMemo } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { AppBar, CircularProgress, Grid, useMediaQuery } from '@rbx/ui';
import wellKnownAnalyticsTranslationNamespaces from '@modules/analytics-translations/wellKnownAnalyticsTranslationNamespaces';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import useAnalyticsPageStyles from '@modules/charts-generic/layout/AnalyticsPage.styles';
import type { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { AnalyticsPageLayout } from '@modules/charts-generic/layout/AnalyticsPageLayout';
import type { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { EmptyGrid } from '@modules/miscellaneous/components';
import AnalyticsStatusBanner from '../components/RAQIV2/AnalyticsStatusBanner';
import type { FilterPositionOverrides } from '../utils/filterPositionOnPageByDimension';
import type { ExperienceAnalyticsPageControl } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar';
import type { FilterBarControlProps } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarControl';
import ExperienceAnalyticsRAQIV2FilterDrawerControls from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsRAQIV2FilterDrawerControls';
import type { NonRAQIUIDimension } from './ExperienceAnalyticsPageControlBar/filterUtils';

export type GenericFullAnalyticsPageLayoutProps = {
  title?: ReactElement<typeof AnalyticsPageTitle>;
  description?: ReactElement<typeof AnalyticsPageDescription>;
  action?: ReactElement;
  fullScreen?: boolean;

  /** Filters to be shown in the filter bar -- hidden if empty */
  controls: Array<ExperienceAnalyticsPageControl>;
  rightSideControls?: Array<ExperienceAnalyticsPageControl>;

  /** An optional element, to be shown before the filter bar */
  heroElement?: React.JSX.Element;

  /** Optional element to show filters before the hero element and control bar */
  preControlFilters?: React.ReactNode;

  /** Optional boolean to add a divider after hero element */
  addHeroDivider?: boolean;

  /** List of charts to display in the main body (after the hero element and filters). */
  children: React.ReactNode;

  isLoading?: boolean;

  /** filterDimensions are meant to replace filterBar eventually */
  filterBar?: FilterBarControlProps;
  filterDimensions?: ReadonlyArray<NonRAQIUIDimension>;
  raqiDimensions?: ReadonlyArray<TRAQIV2Dimension>;
  resource?: RAQIV2ChartResource;

  /** Per-page overrides for which RAQIV2FilterRenderPosition each dimension renders into. */
  filterPositionOverrides?: FilterPositionOverrides;

  fallbackBanner?: React.ReactNode;

  /** Optional additional banners to render alongside status banners */
  additionalBanners?: React.ReactNode;
};

const GenericFullAnalyticsPageLayout: FunctionComponent<GenericFullAnalyticsPageLayoutProps> = ({
  title,
  description,
  action,
  controls,
  rightSideControls,
  filterBar,
  filterDimensions,
  raqiDimensions,
  resource,
  filterPositionOverrides,
  heroElement,
  preControlFilters,
  addHeroDivider,
  children,
  fullScreen,
  isLoading = false,
  fallbackBanner,
  additionalBanners,
}) => {
  if (filterDimensions && !resource) {
    throw new Error(
      'GenericFullAnalyticsPageLayout: resource is required when filterDimensions is provided',
    );
  }

  const {
    classes: { appBarStyles },
  } = useAnalyticsPageStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));

  if (filterDimensions && !resource) {
    throw new Error('Resource is required when filterDimensions are provided');
  }
  const controlBar = (
    <ExperienceAnalyticsRAQIV2FilterDrawerControls
      controls={controls}
      rightSideControls={rightSideControls}
      filterBar={filterBar}
      filterDimensions={filterDimensions}
      raqiDimensions={raqiDimensions}
      resource={resource}
      filterPositionOverrides={filterPositionOverrides}
    />
  );

  const banners = (
    <>
      <AnalyticsStatusBanner fallbackBanner={fallbackBanner} />
      {additionalBanners}
    </>
  );

  const combinedHeroElement = useMemo(() => {
    if (!heroElement && !preControlFilters) {
      return undefined;
    }

    return (
      // NOTE(shumingxu, 2024-08-08): This might need more design input when we have a page with
      // both hero elements and filters.
      <Grid container spacing={4}>
        {heroElement && (
          <Grid item XSmall={12}>
            {heroElement}
          </Grid>
        )}
        {preControlFilters && (
          <Grid item XSmall={12}>
            {preControlFilters}
          </Grid>
        )}
      </Grid>
    );
  }, [preControlFilters, heroElement]);

  if (isLoading) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  let floaterBar: React.JSX.Element = controlBar;
  if (
    controls.length ||
    rightSideControls?.length ||
    filterDimensions?.length ||
    raqiDimensions?.length
  ) {
    floaterBar = isCompactView ? (
      controlBar
    ) : (
      <AppBar position='sticky' color='inherit' className={appBarStyles}>
        {controlBar}
      </AppBar>
    );
  }

  return (
    <AnalyticsPageLayout
      fullScreen={fullScreen}
      {...{
        title,
        description,
        action,
        banners,
        floaterBar,
        heroElement: combinedHeroElement,
        addHeroDivider,
      }}>
      <Grid container rowSpacing='24px' columnSpacing={isCompactView ? '0px' : '24px'}>
        {children}
      </Grid>
    </AnalyticsPageLayout>
  );
};

export default withNamespaceSwitchedTranslation(
  GenericFullAnalyticsPageLayout,
  wellKnownAnalyticsTranslationNamespaces,
);
