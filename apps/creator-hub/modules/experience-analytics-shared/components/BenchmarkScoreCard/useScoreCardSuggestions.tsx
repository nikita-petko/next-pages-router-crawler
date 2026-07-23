import React, { useMemo } from 'react';
import { RAQIV2Metric } from '@rbx/creator-hub-analytics-config';
import { Link } from '@modules/miscellaneous/common';
import { Typography } from '@rbx/ui';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { UnifiedLogger } from '@rbx/unified-logger';
import type { TRAQIV2NumericUIMetric } from '../../constants/AnalyticsMetricDisplayConfig';
import useRAQIV2TranslationDependencies from '../../hooks/useRAQIV2TranslationDependencies';
import recommendationTypeToTranslationInfo, {
  LowestBenchmarkRecommendationType,
} from '../../utils/recommendationTypeToTranslationInfo';
import computeRAQIV2LoggingMetricOverride from '../../utils/computeRAQIV2LoggingMetricOverride';
import getAnalyticsMetricDisplayConfig from '../../constants/AnalyticsMetricDisplayConfig';

const ClickSuggestionLinkFromBenchmarkScoreCard =
  'analytics/overview/clickSuggestionLinkFromBenchmarkScoreCard';
const logClickSuggestionLinkFromBenchmarkScoreCardTooltip = (
  client: UnifiedLogger,
  {
    universeId,
    metric,
    linkURL,
  }: { universeId: number; metric: TRAQIV2NumericUIMetric; linkURL: string },
) => {
  const { loggingMetricOverride } = getAnalyticsMetricDisplayConfig(metric);
  client.logClickEvent({
    eventName: ClickSuggestionLinkFromBenchmarkScoreCard,
    parameters: {
      universe_id: `${universeId}`,
      metric: computeRAQIV2LoggingMetricOverride(metric, loggingMetricOverride),
      link_url: linkURL,
    },
  });
};

const useScoreCardSuggestions = ({
  metric,
  universeId,
  placeId,
}: {
  metric: TRAQIV2NumericUIMetric;
  universeId: number;
  placeId: number;
}) => {
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { translateHTML } = useRAQIV2TranslationDependencies();

  const recommendation = useMemo(() => {
    switch (metric) {
      case RAQIV2Metric.D1Retention:
      case RAQIV2Metric.ForwardD1Retention:
      case RAQIV2Metric.L7AverageForwardD1Retention:
        return LowestBenchmarkRecommendationType.LowestBenchmarkD1Retention;
      case RAQIV2Metric.AverageSessionLengthMinutes:
        return LowestBenchmarkRecommendationType.LowestBenchmarkSessionTime;
      case RAQIV2Metric.AveragePlayTimeMinutesPerDAU:
      case RAQIV2Metric.L7AveragePlayTimeMinutesPerDAU:
        return LowestBenchmarkRecommendationType.LowestBenchmarkSessionTime;
      case RAQIV2Metric.D7Retention:
      case RAQIV2Metric.ForwardD7Retention:
      case RAQIV2Metric.L7AverageForwardD7Retention:
        return LowestBenchmarkRecommendationType.LowestBenchmarkD7Retention;
      case RAQIV2Metric.PayingUsersCVR:
      case RAQIV2Metric.L7AveragePayingUsersCVR:
        return LowestBenchmarkRecommendationType.LowestBenchmarkPayerConversion;
      case RAQIV2Metric.AverageRevenuePerPayingUser:
      case RAQIV2Metric.L7AverageRevenuePerPayingUser:
        return LowestBenchmarkRecommendationType.LowestBenchmarkArppu;
      case RAQIV2Metric.RFYQualifiedPTR:
      case RAQIV2Metric.L7AverageRFYQualifiedPTR:
        return LowestBenchmarkRecommendationType.LowestBenchmarkRFYQualifiedPTR;
      case RAQIV2Metric.EndToEndCVR:
      case RAQIV2Metric.QualifiedEndToEndCVR:
        return LowestBenchmarkRecommendationType.LowestBenchmarkPtr;
      default: {
        throw new Error(`No suggestion available for scorecard with metric ${metric}`);
      }
    }
  }, [metric]);

  return useMemo(() => {
    return recommendationTypeToTranslationInfo(recommendation, universeId, placeId).map(
      ({ key, links }) => {
        return {
          recommendationType: recommendation,
          suggestion: translateHTML(
            key,
            links.length
              ? links.map(({ url, type }, index) => ({
                  opening: `linkStart${index}`,
                  closing: `linkEnd${index}`,
                  content(linkText) {
                    const logEmbedLinkClick = (e: React.MouseEvent) => {
                      logClickSuggestionLinkFromBenchmarkScoreCardTooltip(unifiedLogger, {
                        universeId,
                        linkURL: url,
                        metric,
                      });

                      // links live in a tooltip on top of the scorecard, to prevent link click causing click on card, we need to stop propagation
                      e.stopPropagation();
                    };
                    return (
                      <Link
                        href={url}
                        // open docsite link in new tab
                        target={type === 'docs' ? '_blank' : undefined}
                        underline='always'
                        onClick={logEmbedLinkClick}
                        color='inherit'>
                        <Typography variant='smallLabel2'>{linkText}</Typography>
                      </Link>
                    );
                  },
                }))
              : undefined,
          ),
        };
      },
    );
  }, [metric, placeId, recommendation, translateHTML, unifiedLogger, universeId]);
};

export default useScoreCardSuggestions;
