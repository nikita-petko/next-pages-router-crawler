import { useCallback, useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import GenericSummaryInsightCard from '@modules/experience-analytics-shared/components/GenericSummaryInsightCard/GenericSummaryInsightCard';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import { logAnalyticsClickEvent } from '@modules/experience-analytics-shared/utils/analyticsEventLogger';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSnoozeInsight } from '@modules/react-query/universeAnalyticsInsights';

const SNOOZE_DURATION_DAYS = 14;

// Creator docs page covering video usage and how to improve video efficiency.
const VIDEO_EFFICIENCY_DOC_URL = 'https://create.roblox.com/docs/cloud-services/video-service';

type VideoServiceExtendedServicesInsightCardProps = {
  universeId: number;
  snoozeKey: string;
};

/**
 * Extended Services video recommendation card surfaced on the Video Service
 * page when the `INSIGHT_TYPE_EXTENDED_SERVICES_VIDEO` insight is returned for
 * the universe (a large share of video playback is preloaded/played without
 * being viewed). It mirrors the Extended Services compute card on the
 * Performance > Server tab (`ExtendedServicesComputeInsightCard`) but logs under
 * the Video Service surface so impressions are attributed correctly.
 *
 * The primary CTA links to the creator docs on improving video efficiency.
 * Layout is delegated to `GenericSummaryInsightCard` so we inherit the standard
 * "Insights" header used elsewhere in Creator Analytics.
 */
const VideoServiceExtendedServicesInsightCard = ({
  universeId,
  snoozeKey,
}: VideoServiceExtendedServicesInsightCardProps) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { mutate: snoozeInsight } = useSnoozeInsight(
    universeId,
    InsightTypeV2.ExtendedServicesVideo,
    snoozeKey,
  );

  const handleClick = useCallback(() => {
    window.open(VIDEO_EFFICIENCY_DOC_URL, '_blank');
  }, []);

  const handleSnooze = useCallback(() => {
    snoozeInsight();
    logAnalyticsClickEvent(
      unifiedLogger,
      'analytics/videoService/extendedServicesVideoInsightSnooze',
      {
        universe_id: universeId.toString(),
      },
    );
  }, [snoozeInsight, unifiedLogger, universeId]);

  const snoozeActionLabel = useMemo(() => {
    return translate(translationKey('Action.SnoozeV2', TranslationNamespace.Insights), {
      value: SNOOZE_DURATION_DAYS.toLocaleString(),
    });
  }, [translate]);

  return (
    <GenericSummaryInsightCard
      header={{
        text: translate(translationKey('Title.Insights', TranslationNamespace.Insights)),
      }}
      body={{
        content: (
          <Typography variant='body1'>
            <Typography component='strong' variant='body1' className='[font-weight:700]'>
              {translate(
                translationKey(
                  'Label.ExtendedServicesVideo.LowViewedShare',
                  TranslationNamespace.Insights,
                ),
              )}
              {': '}
            </Typography>
            {translate(
              translationKey(
                'Description.ExtendedServicesVideo.LowViewedShare',
                TranslationNamespace.Insights,
              ),
            )}
          </Typography>
        ),
      }}
      primaryAction={{
        label: translate(
          translationKey(
            'Action.ExtendedServicesVideo.ImproveEfficiency',
            TranslationNamespace.Insights,
          ),
        ),
        onClick: handleClick,
      }}
      snoozeAction={{
        label: snoozeActionLabel,
        onSnooze: handleSnooze,
      }}
      logging={{
        impressionEventName: 'analytics/videoService/extendedServicesVideoInsightImpression',
        clickEventName: 'analytics/videoService/extendedServicesVideoInsightPrimaryCTA',
        parameters: {
          universe_id: universeId.toString(),
        },
      }}
    />
  );
};

export default withTranslation(VideoServiceExtendedServicesInsightCard, [
  TranslationNamespace.Insights,
]);
