import React, { useMemo } from 'react';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import type { AnalyticsTabConfig } from '../../../layout/GenericAnalyticsTabbedPageLayout';
import GenericAnalyticsTabbedPageLayout from '../../../layout/GenericAnalyticsTabbedPageLayout';
import type RAQIV2ChartContext from '../../../types/RAQIV2ChartContext';
import type {
  CreatorAnalyticsFixedTabPageConfig,
  CreatorAnalyticsPageSurfaceConfig,
} from '../../../types/RAQIV2PageConfig';
import resolveDateRangeSelection from '../../../utils/resolveDateRangeSelection';
import AnalyticsInternalTabContentSurfaceLayout from './AnalyticsInternalTabContentSurfaceLayout';
import RAQIV2PredefinedPageEligibilityCheckContext from './RAQIV2PredefinedPageEligbilityCheckContext';
import useRAQIV2PredefinedPageControlsBundle from './useRAQIV2PredefinedPageControlsBundle';
import useRAQIV2PredefinedPreControlComponentsBundle from './useRAQIV2PredefinedPreControlComponentsBundle';
import useRAQIV2PredefinedSurfaceControlsBundle from './useRAQIV2PredefinedSurfaceControlsBundle';

const FixedTabPreControlComponents = ({
  config,
}: {
  config: CreatorAnalyticsPageSurfaceConfig;
}) => {
  const { chartContext } = useRAQIV2PredefinedSurfaceControlsBundle(config);
  const preControlChartContext: RAQIV2ChartContext = useMemo(() => {
    if (!config.preControlComponentDateRange) {
      return chartContext;
    }
    return {
      ...chartContext,
      timeSpec: resolveDateRangeSelection(config.preControlComponentDateRange),
    };
  }, [config.preControlComponentDateRange, chartContext]);
  const { preControlComponent } = useRAQIV2PredefinedPreControlComponentsBundle(
    config.preControlCharts ?? [],
    preControlChartContext,
  );

  return preControlComponent;
};

function AnalyticsInternalEnumTabbedLayout<TTab extends string>({
  config,
  preControlComponentHack, // TODO(gperkins@20240521): DSA-2360 remove
}: {
  config: CreatorAnalyticsFixedTabPageConfig<TTab>;
  preControlComponentHack?: React.JSX.Element;
}) {
  const { tabs: tabConfig, tabOrder, action } = config;
  const { translate } = useRAQIV2TranslationDependencies();

  const { title, description, buildDescription } = useRAQIV2PredefinedPageControlsBundle(config);

  const tabs: AnalyticsTabConfig[] = useMemo(() => {
    return tabOrder.map((key) => ({
      label: translate(tabConfig[key].label),
      key,
      content: <AnalyticsInternalTabContentSurfaceLayout config={tabConfig[key]} />,
      onboardingTipsConfig: tabConfig[key].onboardingTipsConfig,
      action: tabConfig[key].action,
      description: tabConfig[key].description
        ? buildDescription(tabConfig[key].description)
        : undefined,
      heroElement: tabConfig[key].preControlCharts?.length ? (
        <FixedTabPreControlComponents config={tabConfig[key]} />
      ) : undefined,
    }));
  }, [buildDescription, tabConfig, tabOrder, translate]);

  return (
    <RAQIV2PredefinedPageEligibilityCheckContext
      config={config}
      preControlComponentHack={preControlComponentHack}>
      <GenericAnalyticsTabbedPageLayout
        title={title}
        description={description}
        action={action}
        heroElement={preControlComponentHack ?? undefined}
        addHeroDivider={false}
        controls={[]}
        rightSideControls={[]}
        tabs={tabs}
        navigationItem={config.navigationItem}
        fallbackBanner={config.fallbackBanner}
      />
    </RAQIV2PredefinedPageEligibilityCheckContext>
  );
}

export default AnalyticsInternalEnumTabbedLayout;
