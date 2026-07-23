import type { FC } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { subMonths } from '@rbx/core';
import { RAQIV2DateRangeType, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { Card, Grid, Typography, Button } from '@rbx/ui';
import { formatSingleDate } from '@modules/charts-generic/charts/formatters/timeFormatters';
import useImpressionObserver from '@modules/charts-generic/charts/hooks/useImpressionObserver';
import { NumberContext } from '@modules/charts-generic/charts/numberFormatters';
import { analyticsExploreNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import useLocale from '@modules/charts-generic/context/useLocale';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { getFirstMetricFromPredefinedChart } from '@modules/experience-analytics-shared/constants/RAQIV2PredefinedChartConfig';
import getExploreModeUrlParams from '@modules/experience-analytics-shared/exploreMode/getExploreModeUrlParams';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { RAQIV2PredefinedChartKeysToInsightTranslationKeys } from '@modules/experience-analytics-shared/types/achievements';
import type { InsightAchievementSpec } from '@modules/experience-analytics-shared/types/insights';
import formatAnalyticsNumber from '@modules/experience-analytics-shared/utils/analyticsNumberFormatter';
import { Link } from '@modules/miscellaneous/components';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { logAchievementCardImpression, logClickViewAchievement } from '../InsightsLogger';
import useAchievementCardStyles from './AchievementCard.styles';

const AchievementCard: FC<{ spec: InsightAchievementSpec }> = ({ spec }) => {
  const {
    classes: { achievementDescription, cardContainer },
  } = useAchievementCardStyles();
  const router = useRouter();
  const locale = useLocale();
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate } = translationDependencies;
  const { id: universeId } = useUniverseResource();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const {
    header: headerKey,
    headerV2: currentValueKey,
    description: descriptionKey,
    action: actionKey,
  } = RAQIV2PredefinedChartKeysToInsightTranslationKeys[spec.chartKey];
  const metric = useMemo(() => getFirstMetricFromPredefinedChart(spec.chartKey), [spec.chartKey]);

  const exploreMetricLink = useMemo(() => {
    const exploreModeBaseParams = getExploreModeUrlParams({
      preset: spec.chartKey,
      chartContext: {
        granularity: RAQIV2MetricGranularity.OneDay,
      },
      annotationOptions: null,
      routerForReferrerParam: router,
    });

    const maxDate = spec.date;
    const minDate = subMonths(maxDate, 6);
    return buildExperienceAnalyticsUrlWithParams(
      analyticsExploreNavigationItem,
      {
        ...exploreModeBaseParams,
        [AnalyticsQueryParams.RangeType]: RAQIV2DateRangeType.Custom,
        [AnalyticsQueryParams.MaxTime]: maxDate.getTime().toString(),
        [AnalyticsQueryParams.MinTime]: minDate.getTime().toString(),
      },
      universeId,
    );
  }, [router, spec.chartKey, spec.date, universeId]);

  const handleButtonOnClick = useCallback(() => {
    logClickViewAchievement(unifiedLogger, {
      universeId,
      chartKey: spec.chartKey,
      type: spec.type,
    });
  }, [spec.chartKey, spec.type, unifiedLogger, universeId]);

  const cardRef = useRef<HTMLDivElement>(null);
  const sendImpressionEvent = useCallback(() => {
    logAchievementCardImpression(unifiedLogger, {
      universeId,
      type: spec.type,
      chartKey: spec.chartKey,
    });
  }, [unifiedLogger, universeId, spec.type, spec.chartKey]);
  useImpressionObserver(cardRef, sendImpressionEvent);

  const header = useMemo(() => {
    // NOTE (@bxu - 2024/08/05): We added `currentValue` to the API response to include them in the header.
    // This ensures backward compatability to support both cases.
    if (spec.currentValue) {
      const currentValue = formatAnalyticsNumber(
        spec.currentValue,
        {
          metric,
          context: NumberContext.AchievementHeader,
        },
        translationDependencies,
      );
      return translate(currentValueKey, { currentValue });
    }

    return translate(headerKey);
  }, [spec.currentValue, translate, headerKey, metric, translationDependencies, currentValueKey]);

  return (
    <Card ref={cardRef} className={cardContainer}>
      <Grid item container justifyContent='space-between'>
        <Typography variant='captionHeader' color='primary' component='div'>
          {header}
        </Typography>
        <Typography variant='captionHeader' color='secondary' component='div'>
          {formatSingleDate(locale, spec.date, 'UTC', true)}
        </Typography>
      </Grid>
      <Typography
        variant='body1'
        color='primary'
        component='div'
        className={achievementDescription}>
        {translate(descriptionKey)}
      </Typography>
      <Link onClick={handleButtonOnClick} href={exploreMetricLink} underline='none'>
        <Button variant='text' size='small' color='primaryBrand'>
          {translate(actionKey)}
        </Button>
      </Link>
    </Card>
  );
};

export default AchievementCard;
