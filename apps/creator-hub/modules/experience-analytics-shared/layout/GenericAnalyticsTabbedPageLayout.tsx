import type { FunctionComponent, ReactElement } from 'react';
import React, { useEffect, useMemo } from 'react';
import type { TRAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { AppBar, CircularProgress, Grid, useMediaQuery } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import wellKnownAnalyticsTranslationNamespaces from '@modules/analytics-translations/wellKnownAnalyticsTranslationNamespaces';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import type { AnalyticsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import useAnalyticsPageStyles from '@modules/charts-generic/layout/AnalyticsPage.styles';
import type { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { AnalyticsPageLayout } from '@modules/charts-generic/layout/AnalyticsPageLayout';
import type { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import type { RAQIV2ChartResource } from '@modules/clients/analytics';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import AnalyticsTabs from '../components/AnalyticsTabs';
import AnalyticsStatusBanner from '../components/RAQIV2/AnalyticsStatusBanner';
import type { OnboardingTipsConfigs } from '../constants/onboardingTipsConfigs';
import { useAnalyticsTabLayoutBundle } from '../context/AnalyticsTabLayoutBundleProvider';
import { logPageTabView } from '../logging/experienceAnalyticsUnifiedLogger';
import type AnalyticsTabContentLayout from './AnalyticsTabContentLayout';
import type { ExperienceAnalyticsPageControl } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar';
import type { FilterBarControlProps } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarControl';
import ExperienceAnalyticsRAQIV2FilterDrawerControls from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsRAQIV2FilterDrawerControls';
import type { NonRAQIUIDimension } from './ExperienceAnalyticsPageControlBar/filterUtils';

export type AnalyticsTabConfig = {
  key: string;
  label: FormattedText;
  content: ReactElement<typeof AnalyticsTabContentLayout>;
  onboardingTipsConfig?: OnboardingTipsConfigs;
  action?: ReactElement;
  description?: ReactElement<typeof AnalyticsPageDescription>;
  heroElement?: React.JSX.Element;
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

  /** Temporary acquisition banner slot; remove with CLIGROW-3770 cleanup. */
  fallbackBanner?: React.ReactNode;
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
  fallbackBanner,
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

  const activeAction = useMemo(
    () => tabs.find((tab) => tab.key === tabKey)?.action ?? action,
    [action, tabKey, tabs],
  );

  const activeDescription = useMemo(
    () => tabs.find((tab) => tab.key === tabKey)?.description ?? description,
    [description, tabKey, tabs],
  );

  const activeHeroElement = useMemo(
    () => tabs.find((tab) => tab.key === tabKey)?.heroElement ?? heroElement,
    [heroElement, tabKey, tabs],
  );

  const hubMetaTitle = useMemo(() => {
    if (!navigationItem) {
      return undefined;
    }
    const activeTab = tabs.find((t) => t.key === tabKey);
    const activeTabLabel = activeTab?.label as string | undefined;
    return buildTitle(activeTabLabel);
  }, [navigationItem, tabKey, tabs]);

  const banners = <AnalyticsStatusBanner fallbackBanner={fallbackBanner} />;

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

  const hasFilterDimensions = Boolean(filterDimensions?.length) || Boolean(raqiDimensions?.length);
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
    <>
      {hubMetaTitle && <HubMeta hubOnly title={hubMetaTitle} />}
      <AnalyticsPageLayout
        {...{
          title,
          description: activeDescription,
          action: activeAction,
          banners,
          floaterBar,
          heroElement: activeHeroElement,
          addHeroDivider,
        }}>
        <Grid container direction='column' spacing={2}>
          {content && <Grid item>{content}</Grid>}
          <Grid item>
            <AnalyticsTabs tabs={tabConfigs} />
          </Grid>
          <Grid item>{tabChildrenByKey.get(tabKey)}</Grid>
        </Grid>
      </AnalyticsPageLayout>
    </>
  );
};

export default withNamespaceSwitchedTranslation(
  GenericAnalyticsTabbedPageLayout,
  wellKnownAnalyticsTranslationNamespaces,
);
