import React, { useMemo } from 'react';

import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';
import { CreatorAnalyticsFixedTabPageConfig } from '../../../types/RAQIV2PageConfig';
import useRAQIV2PredefinedPageControlsBundle from './useRAQIV2PredefinedPageControlsBundle';
import RAQIV2PredefinedPageEligibilityCheckContext from './RAQIV2PredefinedPageEligbilityCheckContext';
import GenericAnalyticsTabbedPageLayout, {
  AnalyticsTabConfig,
} from '../../../layout/GenericAnalyticsTabbedPageLayout';
import AnalyticsInternalTabContentSurfaceLayout from './AnalyticsInternalTabContentSurfaceLayout';

function AnalyticsInternalEnumTabbedLayout<TTab extends string>({
  config,
  preControlComponentHack, // TODO(gperkins@20240521): DSA-2360 remove
}: {
  config: CreatorAnalyticsFixedTabPageConfig<TTab>;
  preControlComponentHack?: React.JSX.Element;
}) {
  const { tabs: tabConfig, tabOrder, action } = config;
  const { translate } = useRAQIV2TranslationDependencies();

  const tabs: AnalyticsTabConfig[] = useMemo(() => {
    return tabOrder.map((key) => ({
      label: translate(tabConfig[key].label),
      key,
      content: <AnalyticsInternalTabContentSurfaceLayout config={tabConfig[key]} />,
      onboardingTipsConfig: tabConfig[key].onboardingTipsConfig,
    }));
  }, [tabConfig, tabOrder, translate]);

  const { title, description } = useRAQIV2PredefinedPageControlsBundle(config);

  return (
    <RAQIV2PredefinedPageEligibilityCheckContext
      config={config}
      preControlComponentHack={preControlComponentHack}>
      <GenericAnalyticsTabbedPageLayout
        title={title}
        description={description}
        action={action}
        heroElement={preControlComponentHack || undefined}
        controls={[]}
        rightSideControls={[]}
        tabs={tabs}
        navigationItem={config.navigationItem!}
      />
    </RAQIV2PredefinedPageEligibilityCheckContext>
  );
}

export default AnalyticsInternalEnumTabbedLayout;
