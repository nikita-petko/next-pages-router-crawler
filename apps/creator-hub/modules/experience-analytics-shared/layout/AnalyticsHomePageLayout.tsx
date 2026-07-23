import type { FunctionComponent, ReactElement } from 'react';
import React, { useMemo } from 'react';
import { buildBreadcrumb, buildTitle, HubMeta } from '@rbx/creator-hub-history';
import { AppBar, Grid, useMediaQuery } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import withNamespaceSwitchedTranslation from '@modules/analytics-translations/withNamespaceSwitchedTranslation';
import type { AnalyticsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import useAnalyticsPageStyles from '@modules/charts-generic/layout/AnalyticsPage.styles';
import type { AnalyticsPageDescription } from '@modules/charts-generic/layout/AnalyticsPageDescription';
import { AnalyticsPageLayout } from '@modules/charts-generic/layout/AnalyticsPageLayout';
import type { AnalyticsPageTitle } from '@modules/charts-generic/layout/AnalyticsPageTitle';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import AnalyticsTabs from '../components/AnalyticsTabs';
import { useAnalyticsTabLayoutBundle } from '../context/AnalyticsTabLayoutBundleProvider';
import useRAQIV2TranslationDependencies from '../hooks/useRAQIV2TranslationDependencies';
import type AnalyticsTabContentLayout from './AnalyticsTabContentLayout';
import type { ExperienceAnalyticsPageControl } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar';
import ExperienceAnalyticsPageControlBar from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageControlBar';
import type { FilterBarControlProps } from './ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterBarControl';

type AnalyticsTabConfig = {
  key: string;
  label: FormattedText;
  content: ReactElement<typeof AnalyticsTabContentLayout>;
};

export type AnalyticsHomePageLayoutProps = {
  title?: ReactElement<typeof AnalyticsPageTitle>;
  description?: ReactElement<typeof AnalyticsPageDescription>;
  tabs?: Array<AnalyticsTabConfig>;

  /** Filters to be shown in the filter bar -- hidden if empty */
  controls: Array<ExperienceAnalyticsPageControl>;

  /** An optional element, to be shown before the filter bar */
  heroElement?: React.JSX.Element;

  /** Optional boolean to add a divider after hero element */
  addHeroDivider?: boolean;

  /** List of charts to display in the main body (after the hero element and filters). */
  children?: React.ReactNode;

  filterBar?: FilterBarControlProps;

  /**
   * When provided, the layout automatically renders a `<HubMeta>` with a title
   * built from `navigationItem.title > activeTab.label`.
   */
  navigationItem?: AnalyticsNavigationItem;
};

const AnalyticsHomePageLayout: FunctionComponent<AnalyticsHomePageLayoutProps> = ({
  title,
  description,
  tabs,
  controls,
  filterBar,
  heroElement,
  addHeroDivider,
  children,
  navigationItem,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { appBarStyles },
  } = useAnalyticsPageStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { tabKey } = useAnalyticsTabLayoutBundle(tabs?.map((tab) => tab.key) ?? []);
  const tabConfigs = useMemo(() => {
    return tabs?.map((tab) => ({ label: tab.label, key: tab.key }));
  }, [tabs]);
  const tabChildrenByKey = useMemo(() => {
    if (tabs) {
      return new Map(tabs.map((tab) => [tab.key, tab.content]));
    }
    return;
  }, [tabs]);

  const { seoTitle, hubMetaTitle, breadcrumb } = useMemo(() => {
    if (!navigationItem) {
      return { seoTitle: undefined, hubMetaTitle: undefined, breadcrumb: undefined };
    }
    const pageTitle = translate(navigationItem.title);
    const activeTab = tabs?.find((t) => t.key === tabKey);
    const activeTabLabel = activeTab?.label as string | undefined;
    return {
      seoTitle: buildTitle(pageTitle, activeTabLabel),
      hubMetaTitle: buildTitle(activeTabLabel),
      breadcrumb: buildBreadcrumb(pageTitle, activeTabLabel),
    };
  }, [navigationItem, tabKey, tabs, translate]);

  const controlBar = (
    <ExperienceAnalyticsPageControlBar controls={controls} filterBar={filterBar} />
  );
  const floaterBar = isCompactView ? (
    controlBar
  ) : (
    <AppBar position='sticky' color='inherit' className={appBarStyles}>
      {controlBar}
    </AppBar>
  );

  if (tabs && tabConfigs && tabChildrenByKey) {
    return (
      <>
        {hubMetaTitle && (
          <HubMeta title={hubMetaTitle} seoTitle={seoTitle} breadcrumb={breadcrumb} />
        )}
        <AnalyticsPageLayout {...{ title, description, heroElement, addHeroDivider }}>
          <Grid container direction='column' spacing={2} paddingTop={2}>
            <Grid item>
              <AnalyticsTabs tabs={tabConfigs} />
            </Grid>
            <Grid item>{tabChildrenByKey.get(tabKey)}</Grid>
          </Grid>
        </AnalyticsPageLayout>
      </>
    );
  }

  return (
    <AnalyticsPageLayout {...{ title, description, floaterBar, heroElement, addHeroDivider }}>
      <Grid container spacing={5}>
        {children}
      </Grid>
    </AnalyticsPageLayout>
  );
};

export default withNamespaceSwitchedTranslation(AnalyticsHomePageLayout, [
  TranslationNamespace.Analytics,
  TranslationNamespace.AvatarAnalytics,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Community,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.ImmersiveAdsAnalytics,
]);
