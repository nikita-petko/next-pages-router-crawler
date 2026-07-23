import React, { FC, useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { analyticsCreationOverviewNavigationItem } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import GenericAssistantPageLayout from '@modules/analytics-assistant/components/layout/GenericAssistantPageLayout';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import UnifiedAlertBanner from '@modules/unified-alerts/components/UnifiedAlertBanner';
import { useRAQIV2TranslationDependencies } from '@modules/experience-analytics-shared';
import AIChatInterface from '../chat/AIChatInterface';
import AIChatCanvasCard from '../canvas/AIChatCanvasCard';
import { useAIChatContext } from '../../providers/AIChatProvider';

const AIChatPageComponent: FC = () => {
  const { canvasElement } = useAIChatContext();
  const { translate } = useRAQIV2TranslationDependencies();
  const { isAnalyticsAssistantIssueBannerEnabled, isAssistantInlineLayoutEnabled } =
    useFeatureFlagsForNamespace(
      ['isAnalyticsAssistantIssueBannerEnabled', 'isAssistantInlineLayoutEnabled'],
      FeatureFlagNamespace.Analytics,
    );

  const chatPanel = useMemo(() => <AIChatInterface />, []);

  const assistantIssueBanner = useMemo(() => {
    if (!isAnalyticsAssistantIssueBannerEnabled) {
      return null;
    }

    const alerts = [
      {
        id: 'assistant-issue-banner',
        title: translate(
          translationKey(
            'Heading.AssistantIssueBanner.Title',
            TranslationNamespace.AnalyticsAssistant,
          ),
        ),
        description: translate(
          translationKey(
            'Description.AssistantIssueBanner.Body',
            TranslationNamespace.AnalyticsAssistant,
          ),
        ),
        dismissible: false,
      },
    ];

    return <UnifiedAlertBanner alerts={alerts} trackingPage='analytics_ai_chat' />;
  }, [isAnalyticsAssistantIssueBannerEnabled, translate]);

  // Only render canvas panel when there's a chart to display
  const canvasPanel = useMemo(() => {
    return canvasElement !== null ? <AIChatCanvasCard /> : null;
  }, [canvasElement]);

  return (
    <GenericAssistantPageLayout
      prevPage={analyticsCreationOverviewNavigationItem}
      banner={assistantIssueBanner}
      assistantPanel={chatPanel}
      canvasPanel={canvasPanel}
      useInlineLayout={isAssistantInlineLayoutEnabled}
    />
  );
};

export default withTranslation(AIChatPageComponent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.AnalyticsAssistant,
]);
