import type { FC } from 'react';
import { useMemo } from 'react';
import { useFlag } from '@rbx/flags';
import { withTranslation } from '@rbx/intl';
import { isAnalyticsAssistantIssueBannerEnabled as isAnalyticsAssistantIssueBannerEnabledFlag } from '@generated/flags/creatorAnalytics';
import GenericAssistantPageLayout from '@modules/analytics-assistant/components/layout/GenericAssistantPageLayout';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import UnifiedAlertBanner from '@modules/unified-alerts/components/UnifiedAlertBanner';
import { useAIChatContext } from '../../providers/AIChatProvider';
import AIChatCanvasCard from '../canvas/AIChatCanvasCard';
import AIChatInterface from '../chat/AIChatInterface';

const AIChatPageComponent: FC = () => {
  const { canvasElement, isCanvasOpen } = useAIChatContext();
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    ready: isAnalyticsAssistantIssueBannerReady,
    value: isAnalyticsAssistantIssueBannerEnabledValue,
  } = useFlag(isAnalyticsAssistantIssueBannerEnabledFlag);
  const isAnalyticsAssistantIssueBannerEnabled =
    isAnalyticsAssistantIssueBannerReady && isAnalyticsAssistantIssueBannerEnabledValue;

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

  // Only render canvas panel when there's a chart to display and the user
  // hasn't collapsed it via the close (X) button on the charts panel header.
  const canvasPanel = useMemo(() => {
    return canvasElement !== null && isCanvasOpen ? <AIChatCanvasCard /> : null;
  }, [canvasElement, isCanvasOpen]);

  return (
    <GenericAssistantPageLayout
      banner={assistantIssueBanner}
      assistantPanel={chatPanel}
      canvasPanel={canvasPanel}
    />
  );
};

export default withTranslation(AIChatPageComponent, [
  TranslationNamespace.Analytics,
  TranslationNamespace.AnalyticsAssistant,
]);
