import React, { FC, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, Container, Typography } from '@rbx/ui';
import { Button } from '@rbx/foundation-ui';
import {
  analyticsAssistantNavigationItem,
  analyticsExploreNavigationItem,
  AnalyticsQueryParams,
  buildExperienceAnalyticsUrlWithParams,
  ChartUnit,
  ChartUnitAggregationType,
  DateRangeType,
  formatNumber,
  formatSingleDate,
  NumberContext,
  useComponentSize,
  useImpressionObserver,
  useLocale,
} from '@modules/charts-generic';
import {
  getExploreModeUrlParams,
  getInsightCardButtonKey,
  getInsightCardCaptions,
  getFirstMetricFromPredefinedChart,
  getTitleKeyFromPredefinedChart,
  InsightCardSpec,
  insightCardTypeToTranslationKey,
  InsightTypeV2,
  RAQIV2PredefinedChartKey,
  useRAQIV2TranslationDependencies,
  useUniverseResource,
  getAnalyticsMetricDisplayConfig,
} from '@modules/experience-analytics-shared';
import { Link, urls } from '@modules/miscellaneous/common';
import { Flex } from '@modules/miscellaneous/common/components';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { useSnoozeInsight } from '@modules/react-query/universeAnalyticsInsights';
import InsightSuggestions from './InsightSuggestions';
import useInsightCardV2Styles from './InsightCardV2.styles';

import {
  logInsightsV2Impression,
  logInsightsV2PrimaryLinkClick,
  logInsightsV2SnoozeClick,
} from '../InsightsLogger';
import InsightChart from './charts/InsightChart';
import InsightActionMenu from '../InsightActionMenu';
import QualitySignalsCardContent from './QualitySignalsCardContent';

export type InsightCardV2Props = {
  spec: InsightCardSpec;
};

const InsightCardV2: FC<InsightCardV2Props> = ({ spec }) => {
  const {
    classes: {
      insightCardContainer,
      header,
      headerContent,
      cardContent,
      suggestionContainer,
      suggestionContainerInColumn,
      informationLeftColumn,
      insightCaptionContent,
      insightCardButton,
      cardContentSideBySide,
      columnSideBySide,
    },
    cx,
  } = useInsightCardV2Styles();
  const router = useRouter();
  const locale = useLocale();
  const { translate } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  const { mutate: snoozeInsight } = useSnoozeInsight(universeId, spec.type, spec.snoozeKey);
  const metric = useMemo(() => getFirstMetricFromPredefinedChart(spec.chartKey), [spec.chartKey]);

  const onSnooze = useCallback(() => {
    snoozeInsight();
    logInsightsV2SnoozeClick(unifiedLogger, {
      universeId,
      insightType: spec.type,
      lastGenerated: spec.date,
      metric,
      chartKey: spec.chartKey,
      snoozeKey: spec.snoozeKey,
    });
  }, [
    snoozeInsight,
    unifiedLogger,
    universeId,
    spec.type,
    spec.date,
    spec.chartKey,
    spec.snoozeKey,
    metric,
  ]);

  const cardRef = React.useRef<HTMLDivElement>(null);
  const { width: cardWidth } = useComponentSize(cardRef, 250);
  const isContentSideBySide = cardWidth >= 640;

  const headerText = useMemo(() => {
    const insightType = spec.type;
    switch (insightType) {
      case InsightTypeV2.SummaryReport7Days:
      case InsightTypeV2.SummaryReport:
      case InsightTypeV2.PercentChange:
      case InsightTypeV2.LowEndAndroidCrashRate:
      case InsightTypeV2.ExperienceQuality:
      case InsightTypeV2.PlayerFeedbackReport7Days:
      case InsightTypeV2.PlayerFeedbackReport28Days:
      case InsightTypeV2.AdsPerformance7Days: {
        return translate(insightCardTypeToTranslationKey[insightType].header);
      }
      default: {
        const exhaustiveCheck: never = insightType;
        throw new Error(`Exhaustive check ${exhaustiveCheck}`);
      }
    }
  }, [translate, spec]);

  const { title: titleDescription, displayValue } = useMemo(() => {
    const insightType = spec.type;
    // eslint-disable-next-line deprecation/deprecation -- DSA-4609 TODO: Move to new number formatter
    const formattedValue = formatNumber({
      value: spec.summaryValue,
      unit: ChartUnit.Percentage,
      type: ChartUnitAggregationType.Ratio,
      context: NumberContext.ChartSummary,
      translate,
      locale,
    });

    switch (insightType) {
      case InsightTypeV2.PercentChange: {
        const { localizedName } = getAnalyticsMetricDisplayConfig(metric);
        const titleKey = getTitleKeyFromPredefinedChart(spec.chartKey) ?? localizedName;
        return {
          title: translate(titleKey),
          displayValue: formattedValue,
        };
      }
      case InsightTypeV2.LowEndAndroidCrashRate: {
        // Shows place name as the title
        return { title: spec.titleInfo.placeName, displayValue: formattedValue };
      }
      case InsightTypeV2.SummaryReport7Days:
      case InsightTypeV2.SummaryReport:
      case InsightTypeV2.ExperienceQuality:
      case InsightTypeV2.PlayerFeedbackReport7Days:
      case InsightTypeV2.PlayerFeedbackReport28Days: {
        // This is unused, just to comply with type
        return { title: null, displayValue: null };
      }
      case InsightTypeV2.AdsPerformance7Days: {
        // Ads performance shows the ads plays count as the display value
        const adsPlaysFormatted = spec.captionInfo.adsPlaysL7.toLocaleString(locale);
        return {
          title: null, // Title is shown in header
          displayValue: adsPlaysFormatted,
        };
      }
      default: {
        const exhaustiveCheck: never = insightType;
        throw new Error(`Exhaustive check ${exhaustiveCheck}`);
      }
    }
  }, [locale, metric, spec, translate]);

  const title = useMemo(() => {
    if (!titleDescription) return null;
    return React.isValidElement(titleDescription) ? titleDescription : `: ${titleDescription}`;
  }, [titleDescription]);

  /** beginning of explore button component */
  const exploreLink = useMemo(() => {
    const insightType = spec.type;
    switch (insightType) {
      case InsightTypeV2.PercentChange: {
        if (spec.chartKey === RAQIV2PredefinedChartKey.QualifiedPTRAndImpressionComparison) {
          return urls.creatorHub.dashboard.getAnalyticAcquisitionHomeRecommendationsUrl(universeId);
        }
        const exploreModeParams = getExploreModeUrlParams({
          preset: spec.chartKey,
          chartContext: {
            granularity: RAQIV2MetricGranularity.OneDay,
          },
          annotationOptions: null,
          routerForReferrerParam: router,
        });
        return buildExperienceAnalyticsUrlWithParams(
          analyticsExploreNavigationItem,
          {
            ...exploreModeParams,
            [AnalyticsQueryParams.RangeType]: DateRangeType.Last28Days,
          },
          universeId,
        );
      }
      case InsightTypeV2.LowEndAndroidCrashRate: {
        return urls.creatorHub.docs.getPerformanceOptimizationUrl();
      }
      case InsightTypeV2.ExperienceQuality: {
        return '';
      }
      case InsightTypeV2.SummaryReport7Days:
      case InsightTypeV2.SummaryReport:
      case InsightTypeV2.PlayerFeedbackReport7Days:
      case InsightTypeV2.PlayerFeedbackReport28Days: {
        return buildExperienceAnalyticsUrlWithParams(
          analyticsAssistantNavigationItem,
          {
            [AnalyticsQueryParams.InsightId]: spec.insightId,
          },
          universeId,
        );
      }
      case InsightTypeV2.AdsPerformance7Days: {
        // Link to Ads Manager (Sponsor Experience) for this universe
        return urls.www.AdsManagerUrl;
      }
      default: {
        const exhaustiveCheck: never = insightType;
        throw new Error(`Exhaustive check ${exhaustiveCheck}`);
      }
    }
  }, [spec.type, spec.chartKey, spec.insightId, router, universeId]);

  const handleButtonOnClick = useCallback(() => {
    logInsightsV2PrimaryLinkClick(unifiedLogger, {
      universeId,
      insightType: spec.type,
      lastGenerated: spec.date,
      linkURL: exploreLink,
      metric,
      chartKey: spec.chartKey,
    });
  }, [exploreLink, metric, spec.chartKey, spec.date, spec.type, unifiedLogger, universeId]);

  const exploreButton = useMemo(() => {
    return (
      <Link href={exploreLink} underline='none' onClick={handleButtonOnClick}>
        <Button className={insightCardButton} variant='Standard' size='Medium' color='primaryBrand'>
          {translate(getInsightCardButtonKey(spec.type, spec.chartKey))}
        </Button>
      </Link>
    );
  }, [exploreLink, handleButtonOnClick, insightCardButton, spec.chartKey, spec.type, translate]);
  /** end of explore button component */

  const caption = useMemo(() => {
    const formattedCaption = getInsightCardCaptions(translate, locale, spec);
    return formattedCaption ? `(${formattedCaption})` : null;
  }, [translate, locale, spec]);

  const recommendationsContent = useMemo(() => {
    return spec.recommendations.length ? <InsightSuggestions spec={spec} /> : null;
  }, [spec]);

  const recommendations = useMemo(() => {
    return (
      <div>
        <Typography variant='h3' color='primary'>
          {displayValue}{' '}
          {caption && (
            <Typography
              variant='captionBody'
              color='primary'
              component='span'
              className={insightCaptionContent}>
              {caption}
            </Typography>
          )}
        </Typography>
        {recommendationsContent ? (
          <div className={isContentSideBySide ? suggestionContainerInColumn : suggestionContainer}>
            {recommendationsContent}
          </div>
        ) : null}
      </div>
    );
  }, [
    caption,
    displayValue,
    insightCaptionContent,
    isContentSideBySide,
    recommendationsContent,
    suggestionContainer,
    suggestionContainerInColumn,
  ]);

  const content = useMemo(() => {
    // TODO: Refactor InsightCardV2 to be more modular so that different types of insights can
    // compose their card based on their own needs.
    if (spec.type === InsightTypeV2.ExperienceQuality) {
      return <QualitySignalsCardContent spec={spec} />;
    }
    return (
      <React.Fragment>
        <Flex
          flexDirection='column'
          justifyContent='space-between'
          alignItems='flex-start'
          classes={{
            root: cx(informationLeftColumn, {
              [columnSideBySide]: isContentSideBySide,
            }),
          }}>
          {recommendations}
          {isContentSideBySide ? exploreButton : null}
        </Flex>
        <Container
          disableGutters
          maxWidth={false}
          classes={{
            root: cx({
              [columnSideBySide]: isContentSideBySide,
            }),
          }}>
          <InsightChart spec={spec} />
        </Container>
        <span>{!isContentSideBySide ? exploreButton : null}</span>
      </React.Fragment>
    );
  }, [
    columnSideBySide,
    cx,
    exploreButton,
    recommendations,
    informationLeftColumn,
    isContentSideBySide,
    spec,
  ]);

  const sendImpressionEvent = useCallback(() => {
    logInsightsV2Impression(unifiedLogger, {
      universeId,
      insightType: spec.type,
      lastGenerated: spec.date,
      metric,
      chartKey: spec.chartKey,
    });
  }, [unifiedLogger, universeId, spec.type, spec.date, spec.chartKey, metric]);
  useImpressionObserver(cardRef, sendImpressionEvent);

  return (
    <Card classes={{ root: insightCardContainer }} ref={cardRef}>
      <CardHeader
        title={
          <Flex justifyContent='space-between' alignItems='center'>
            <Typography noWrap variant='captionHeader' color='secondary'>
              {headerText}
              {title}
            </Typography>
            <Typography variant='captionHeader' color='secondary'>
              {spec.snoozeKey ? (
                <InsightActionMenu onSnooze={onSnooze} useVerticalIcon />
              ) : (
                formatSingleDate(locale, spec.date, 'UTC', true)
              )}
            </Typography>
          </Flex>
        }
        classes={{ root: header, content: headerContent }}
      />
      <CardContent
        classes={{
          root: cx(cardContent, {
            [cardContentSideBySide]: isContentSideBySide,
          }),
        }}>
        {content}
      </CardContent>
    </Card>
  );
};

export default InsightCardV2;
