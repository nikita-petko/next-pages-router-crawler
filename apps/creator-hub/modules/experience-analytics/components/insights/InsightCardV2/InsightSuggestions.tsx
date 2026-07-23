import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { Grid, InsightsIcon, Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatNumberWithSpec } from '@modules/charts-generic/charts/numberFormatters';
import { percentageFormattingSpec } from '@modules/charts-generic/constants/analyticsNumberFormattingSpec';
import useLocale from '@modules/charts-generic/context/useLocale';
import type { RecommendationType } from '@modules/clients/analytics';
import { getFirstMetricFromPredefinedChart } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import { useExperienceAnalyticsGameDetails } from '@modules/experience-analytics-shared/context/ExperienceAnalyticsGameDetailsProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type { InsightCardSpec } from '@modules/experience-analytics-shared/types/insights';
import { InsightTypeV2 } from '@modules/experience-analytics-shared/types/insights';
import recommendationTypeToTranslationInfo from '@modules/experience-analytics-shared/utils/recommendationTypeToTranslationInfo';
import { Link } from '@modules/miscellaneous/components';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { logInsightsV2EmbeddedLinkClick } from '../InsightsLogger';
import useInsightSuggestionsStyles from './InsightSuggestions.styles';

const InsightSuggestions: FC<{ spec: InsightCardSpec }> = ({ spec }) => {
  const {
    classes: { listContainer, icon },
  } = useInsightSuggestionsStyles();
  const locale = useLocale();
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const gameDetails = useExperienceAnalyticsGameDetails();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const translationArguments = useMemo(() => {
    const insightType = spec.type;
    switch (insightType) {
      case InsightTypeV2.PercentChange: {
        return;
      }
      case InsightTypeV2.LowEndAndroidCrashRate: {
        return {
          ccuRatio: formatNumberWithSpec(spec.suggestionsInfo.ccuRatio, percentageFormattingSpec, {
            locale,
            translate,
          }),
        };
      }
      case InsightTypeV2.SummaryReport:
      case InsightTypeV2.SummaryReport7Days:
      case InsightTypeV2.PlayerFeedbackReport7Days:
      case InsightTypeV2.PlayerFeedbackReport28Days:
      case InsightTypeV2.ExperienceQuality:
      case InsightTypeV2.AdsPerformance7Days: {
        return;
      }
      default: {
        const exhaustiveCheck: never = insightType;
        throw new Error(`Exhaustive check: ${exhaustiveCheck}`);
      }
    }
  }, [locale, spec, translate]);

  const placeId = useMemo(() => {
    // The target place ID is different per insight type
    if (spec.type === InsightTypeV2.LowEndAndroidCrashRate) {
      return spec.suggestionsInfo.placeId;
    }

    return gameDetails.rootPlaceId;
  }, [spec, gameDetails.rootPlaceId]);

  const recommendationTypeToSuggestions = useCallback(
    (recommendationType: RecommendationType) => {
      const translations = recommendationTypeToTranslationInfo(
        recommendationType,
        gameDetails.universeId,
        placeId,
      );
      if (!translations.length) {
        return null;
      }

      return translations.map(({ key, links }) => {
        const translatedSuggestion = translateHTML(
          key,
          links.length
            ? links.map(({ url, type }, index) => ({
                opening: `linkStart${index}`,
                closing: `linkEnd${index}`,
                content(linkText) {
                  const logEmbedLinkClick = () => {
                    const metric = getFirstMetricFromPredefinedChart(spec.chartKey);
                    logInsightsV2EmbeddedLinkClick(unifiedLogger, {
                      universeId: gameDetails.universeId,
                      insightType: spec.type,
                      lastGenerated: spec.date,
                      linkURL: url,
                      metric,
                      chartKey: spec.chartKey,
                    });
                  };
                  return (
                    <Link
                      href={url}
                      color='inherit'
                      underline='always'
                      target={type === 'docs' ? '_blank' : undefined}
                      onClick={logEmbedLinkClick}>
                      {linkText}
                    </Link>
                  );
                },
              }))
            : undefined,
          translationArguments,
        );
        return (
          <li key={key.key}>
            <Typography variant='body1' color='primary'>
              {translatedSuggestion}
            </Typography>
          </li>
        );
      });
    },
    [
      gameDetails.universeId,
      placeId,
      translateHTML,
      translationArguments,
      spec.chartKey,
      spec.type,
      spec.date,
      unifiedLogger,
    ],
  );

  const recommendationItems = useMemo(
    () =>
      spec.recommendations.map((recommendationType) =>
        recommendationTypeToSuggestions(recommendationType),
      ),
    [recommendationTypeToSuggestions, spec.recommendations],
  );

  return (
    <Grid item container>
      <Grid item container alignItems='center'>
        <InsightsIcon color='primary' className={icon} />
        <Typography variant='captionHeader' color='secondary'>
          {translate(translationKey('Title.Suggestions', TranslationNamespace.Insights))}
        </Typography>
      </Grid>
      <ul className={listContainer}>{recommendationItems}</ul>
    </Grid>
  );
};

export default InsightSuggestions;
