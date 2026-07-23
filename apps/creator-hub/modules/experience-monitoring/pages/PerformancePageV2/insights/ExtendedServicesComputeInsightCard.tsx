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
import { creatorHub } from '@modules/miscellaneous/urls';
import { useSnoozeInsight } from '@modules/react-query/universeAnalyticsInsights';

const SNOOZE_DURATION_DAYS = 14;

type ExtendedServicesComputeInsightCardProps = {
  universeId: number;
  snoozeKey: string;
};

/**
 * Insight card surfaced on the Performance page Server tab when the
 * `INSIGHT_TYPE_EXTENDED_SERVICES_COMPUTE` insight (developer-analytics PR
 * #3103) is returned for the universe -- i.e. average physics CPU time and max
 * CPU core utilization both exceed configured thresholds.
 *
 * The card recommends purchasing Extended Services compute capacity and links
 * out to the Extended Services unlock flow. Layout is delegated to
 * `GenericSummaryInsightCard` so we inherit the standard "Insights" header
 * (icon + label) used elsewhere in Creator Analytics.
 */
const ExtendedServicesComputeInsightCard = ({
  universeId,
  snoozeKey,
}: ExtendedServicesComputeInsightCardProps) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { mutate: snoozeInsight } = useSnoozeInsight(
    universeId,
    InsightTypeV2.ExtendedServicesCompute,
    snoozeKey,
  );

  const unlockUrl = creatorHub.dashboard.getExtendedServicesUnlock(universeId);

  const handleClick = useCallback(() => {
    window.open(unlockUrl, '_blank');
  }, [unlockUrl]);

  const handleSnooze = useCallback(() => {
    snoozeInsight();
    logAnalyticsClickEvent(
      unifiedLogger,
      'analytics/performance/extendedServicesComputeInsightSnooze',
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
            <Typography component='strong' variant='body1' style={{ fontWeight: 700 }}>
              {translate(
                translationKey(
                  'Label.ExtendedServicesCompute.HighQuotaUsage',
                  TranslationNamespace.Insights,
                ),
              )}
              {': '}
            </Typography>
            {translate(
              translationKey(
                'Description.ExtendedServicesCompute.HighQuotaUsage',
                TranslationNamespace.Insights,
              ),
            )}
          </Typography>
        ),
      }}
      primaryAction={{
        label: translate(
          translationKey(
            'Action.ExtendedServicesCompute.PurchaseCompute',
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
        impressionEventName: 'analytics/performance/extendedServicesComputeInsightImpression',
        clickEventName: 'analytics/performance/extendedServicesComputeInsightPrimaryCTA',
        parameters: {
          universe_id: universeId.toString(),
        },
      }}
    />
  );
};

export default withTranslation(ExtendedServicesComputeInsightCard, [TranslationNamespace.Insights]);
