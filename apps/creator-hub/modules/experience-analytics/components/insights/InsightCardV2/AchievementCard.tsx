import React, { FC, useCallback, useMemo, useRef } from 'react';
import { Card, Grid, Typography, Button } from '@rbx/ui';
import {
  analyticsExploreNavigationItem,
  AnalyticsQueryParams,
  DateRangeType,
  buildExperienceAnalyticsUrlWithParams,
  formatSingleDate,
  useImpressionObserver,
  useLocale,
  NumberContext,
} from '@modules/charts-generic';
import {
  useRAQIV2TranslationDependencies,
  getExploreModeUrlParams,
  getFirstMetricFromPredefinedChart,
  useUniverseResource,
  RAQIV2PredefinedChartKeysToInsightTranslationKeys,
  InsightAchievementSpec,
  formatAnalyticsNumber,
} from '@modules/experience-analytics-shared';
import { Link } from '@modules/miscellaneous/common';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useRouter } from 'next/router';
import { subMonths } from '@rbx/core';
import useAchievementCardStyles from './AchievementCard.styles';
import { logAchievementCardImpression, logClickViewAchievement } from '../InsightsLogger';

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
        [AnalyticsQueryParams.RangeType]: DateRangeType.Custom,
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
