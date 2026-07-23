import React, { FunctionComponent, ReactElement, useEffect, useMemo } from 'react';
import { AppBar, CircularProgress, Grid, useMediaQuery } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';

import {
  type AnalyticsNavigationItem,
  AnalyticsPageLayout,
  useAnalyticsPageStyles,
  AnalyticsPageTitle,
  AnalyticsPageDescription,
} from '@modules/charts-generic';
import {
  FormattedText,
  wellKnownAnalyticsTranslationNamespaces,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';

import { RAQIV2ChartResource } from '@modules/clients/analytics';
import { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { OnboardingTipsConfigs } from '../constants/onboardingTipsConfigs';
import { ExperienceAnalyticsPageControl } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar';
import { FilterBarControlProps } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarControl';
import AnalyticsTabContentLayout from './AnalyticsTabContentLayout';
import AnalyticsTabs from '../components/AnalyticsTabs';
import { useAnalyticsTabLayoutBundle } from '../context/AnalyticsTabLayoutBundleProvider';
import { logPageTabView } from '../logging/experienceAnalyticsUnifiedLogger';
import { NonRAQIUIDimension } from './ExperienceAnalyticsPageControlBar/filterUtils';
import ExperienceAnalyticsRAQIV2FilterDrawerControls from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsRAQIV2FilterDrawerControls';
import AnalyticsStatusBanner from '../components/RAQIV2/AnalyticsStatusBanner';

export type AnalyticsTabConfig = {
  key: string;
  label: FormattedText;
  content: ReactElement<typeof AnalyticsTabContentLayout>;
  onboardingTipsConfig?: OnboardingTipsConfigs;
};

export type GenericAnalyticsTabbedPageLayoutProps = {
  title?: ReactElement<typeof AnalyticsPageTitle>;
  description?: ReactElement<typeof AnalyticsPageDescription>;
  action?: ReactElement;

  /** List of tabs to display in the main body (after the hero element and filters). */
  tabs: Array<AnalyticsTabConfig>;

  /** Filters to be shown in the filter bar -- hidden if empty */
  controls: Array<ExperienceAnalyticsPageControl>;
  rightSideControls?: Array<ExperienceAnalyticsPageControl>;

  /** An optional element, to be shown before the filter bar */
  heroElement?: React.JSX.Element;

  /** Optional boolean to add a divider after hero element */
  addHeroDivider?: boolean;

  isLoading?: boolean;

  filterBar?: FilterBarControlProps;

  content?: React.JSX.Element;
  filterDimensions?: Readonly<NonRAQIUIDimension[]>;
  raqiDimensions?: ReadonlyArray<TRAQIV2Dimension>;
  resource?: RAQIV2ChartResource;

  /**
   * The layout automatically renders a `<HubMeta hubOnly>` with a title
   * built from `group.title > navigationItem.title > activeTab.label`.
   */
  navigationItem?: AnalyticsNavigationItem;
};

const GenericAnalyticsTabbedPageLayout: FunctionComponent<
  GenericAnalyticsTabbedPageLayoutProps
> = ({
  title,
  description,
  action,
  tabs,
  controls,
  rightSideControls,
  filterBar,
  heroElement,
  addHeroDivider,
  filterDimensions,
  raqiDimensions,
  resource,
  content = null,
  isLoading = false,
  navigationItem,
}) => {
  if (filterDimensions && !resource) {
    throw new Error(
      'GenericAnalyticsTabbedPageLayout: resource is required when filterDimensions is provided',
    );
  }
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const {
    classes: { appBarStyles },
  } = useAnalyticsPageStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { tabKey } = useAnalyticsTabLayoutBundle(tabs.map((tab) => tab.key) ?? []);
  const tabConfigs = useMemo(() => {
    return tabs.map((tab) => {
      return { label: tab.label, key: tab.key, onboardingTipsConfig: tab.onboardingTipsConfig };
    });
  }, [tabs]);
  const tabChildrenByKey = useMemo(
    () => new Map(tabs.map((tab) => [tab.key, tab.content])),
    [tabs],
  );

  const hubMetaTitle = useMemo(() => {
    if (!navigationItem) return undefined;
    const activeTab = tabs.find((t) => t.key === tabKey);
    const activeTabLabel = activeTab?.label as string | undefined;
    return buildTitle(activeTabLabel);
  }, [navigationItem, tabKey, tabs]);

  const banners = <AnalyticsStatusBanner />;

  useEffect(() => {
    if (tabKey) {
      logPageTabView(unifiedLogger, { tab: tabKey });
    }
  }, [tabKey, unifiedLogger]);

  if (isLoading) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  const hasFilterDimensions = filterDimensions?.length || raqiDimensions?.length;
  const controlBar = hasFilterDimensions ? (
    <ExperienceAnalyticsRAQIV2FilterDrawerControls
      controls={controls}
      rightSideControls={rightSideControls}
      filterBar={filterBar}
      resource={resource}
      filterDimensions={filterDimensions}
      raqiDimensions={raqiDimensions}
    />
  ) : (
    <ExperienceAnalyticsRAQIV2FilterDrawerControls
      controls={controls}
      rightSideControls={rightSideControls}
      filterBar={filterBar}
      filterDimensions={undefined}
      raqiDimensions={undefined}
      resource={resource}
    />
  );

  const floaterBar = isCompactView ? (
    controlBar
  ) : (
    <AppBar position='sticky' color='inherit' className={appBarStyles}>
      {controlBar}
    </AppBar>
  );

  return (
    <React.Fragment>
      {hubMetaTitle && <HubMeta hubOnly title={hubMetaTitle} />}
      <AnalyticsPageLayout
        {...{ title, description, action, banners, floaterBar, heroElement, addHeroDivider }}>
        <Grid container direction='column' spacing={2}>
          {content && <Grid item>{content}</Grid>}
          <Grid item>
            <AnalyticsTabs tabs={tabConfigs} />
          </Grid>
          <Grid item>{tabChildrenByKey.get(tabKey)}</Grid>
        </Grid>
      </AnalyticsPageLayout>
    </React.Fragment>
  );
};

export default withNamespaceSwitchedTranslation(
  GenericAnalyticsTabbedPageLayout,
  wellKnownAnalyticsTranslationNamespaces,
);
