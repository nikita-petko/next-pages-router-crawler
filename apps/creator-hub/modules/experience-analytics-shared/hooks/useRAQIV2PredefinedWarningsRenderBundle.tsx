import React, { ReactNode, useMemo } from 'react';
import {
  analyticsRecommendedEventsFunnelsNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
  AnalyticsQueryParams,
  DateRangeType,
  formatSingleDate,
  useLocale,
  TimeSeriesAnnotation,
  useAnalyticsCurrentDateRangeBundle,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { addDays } from '@rbx/core';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { AnnotationType } from '@modules/clients/analytics';
import { Link, urls } from '@modules/miscellaneous/common';
import { WarningIcon } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  RAQIV2PredefinedWarningTranslationKey,
  RAQIV2PredefinedWarnings,
} from '../constants/RAQIV2PredefinedWarnings';
import useRAQIV2TranslationDependencies from './useRAQIV2TranslationDependencies';
import { useUniverseResource } from './useChartResourceProvider';

const useRAQIV2PredefinedWarningsRenderBundle = (
  warnings: RAQIV2PredefinedWarnings[],
  timeSeriesAnnotations: TimeSeriesAnnotation[] | null,
): Array<ReactNode> => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { translate, translateHTML, ready: translationDependenciesReady } = translationDependencies;
  const [tabQueryParams] = useQueryParams([AnalyticsQueryParams.Tab]);
  const locale = useLocale();
  const { startDate, endDate } = useAnalyticsCurrentDateRangeBundle();
  const { id: universeId } = useUniverseResource();

  return useMemo(() => {
    if (!translationDependenciesReady) {
      return [];
    }
    const renderedWarnings = warnings.map((warning) => {
      switch (warning) {
        case RAQIV2PredefinedWarnings.SubscriptionEngagementPayoutsPortalAdsRevenueExcluded:
        case RAQIV2PredefinedWarnings.ShareLinkCampaignExcluded:
        case RAQIV2PredefinedWarnings.ShareLinkCampaignQualifiedPlay:
        case RAQIV2PredefinedWarnings.CreatorRewardsAudienceExpansionEligibility:
        case RAQIV2PredefinedWarnings.CreatorRewardsNegativePayoutDisclaimer:
        case RAQIV2PredefinedWarnings.ExperienceEventsNotificationJoinData:
        case RAQIV2PredefinedWarnings.ImmersiveAdsImpressions:
        case RAQIV2PredefinedWarnings.PortalAdsImpressions:
        case RAQIV2PredefinedWarnings.ImmersiveAdsExcludesUnvalidatedData:
        case RAQIV2PredefinedWarnings.PlatformCrashExplaination:
          return translate(RAQIV2PredefinedWarningTranslationKey[warning]);
        case RAQIV2PredefinedWarnings.ClientCrashRateNoisyData:
          return (
            <span>
              <WarningIcon
                fontSize='small'
                color='inherit'
                style={{ marginRight: '5px', verticalAlign: 'text-bottom' }}
              />
              {translateHTML(RAQIV2PredefinedWarningTranslationKey[warning], [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={urls.creatorHub.dashboard.getAnalyticsErrorsUrls(universeId)}
                        color='inherit'
                        underline='always'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </span>
          );
        // NOTE(shumingxu, 07/27/2024): No other use case for now in the future as we get more
        // chart warnings we can potentially modify this to a generic configuration and switch
        // based on warning renderer. But seems fine for now considering this is the only use case.
        case RAQIV2PredefinedWarnings.FunnelStepNameChangeDuringTimePeriodWithLink: {
          const funnelNameChangeAnnotations = timeSeriesAnnotations?.filter(
            (annotation) => annotation.type === AnnotationType.FunnelStepNameChange,
          );
          const changeDates = funnelNameChangeAnnotations?.map((annotation) => annotation.startUtc);

          if (!changeDates || changeDates.length < 1) {
            return translate(
              translationKey(
                'Warning.FunnelStepNameChangeDuringTimePeriod',
                TranslationNamespace.Analytics,
              ),
            );
          }

          const sortedDates = changeDates.sort();
          const earliestDate = sortedDates[0];
          const latestDate = sortedDates[sortedDates.length - 1];

          const makeBeforeStartDateLink = (chunks: React.ReactNode) => {
            return (
              <Link
                underline='none'
                href={buildExperienceAnalyticsUrlWithParams(
                  analyticsRecommendedEventsFunnelsNavigationItem,
                  {
                    [AnalyticsQueryParams.RangeType]: DateRangeType.Custom,
                    [AnalyticsQueryParams.MinTime]: startDate.getTime().toString(),
                    [AnalyticsQueryParams.MaxTime]: addDays(earliestDate, -1).getTime().toString(),
                    [AnalyticsQueryParams.Tab]: tabQueryParams.tab ?? undefined,
                  },
                  universeId,
                )}>
                {chunks}
              </Link>
            );
          };

          const makeAfterEndDateLink = (chunks: React.ReactNode) => {
            return (
              <Link
                underline='none'
                href={buildExperienceAnalyticsUrlWithParams(
                  analyticsRecommendedEventsFunnelsNavigationItem,
                  {
                    [AnalyticsQueryParams.RangeType]: DateRangeType.Custom,
                    [AnalyticsQueryParams.MinTime]: addDays(latestDate, 1).getTime().toString(),
                    [AnalyticsQueryParams.MaxTime]: endDate.getTime().toString(),
                    [AnalyticsQueryParams.Tab]: tabQueryParams.tab ?? undefined,
                  },
                  universeId,
                )}>
                {chunks}
              </Link>
            );
          };
          return translateHTML(
            RAQIV2PredefinedWarningTranslationKey[warning],
            [
              {
                opening: 'beforeLinkStart',
                closing: 'beforeLinkEnd',
                content: makeBeforeStartDateLink,
              },
              {
                opening: 'afterLinkStart',
                closing: 'afterLinkEnd',
                content: makeAfterEndDateLink,
              },
            ],
            { date: formatSingleDate(locale, latestDate) },
          );
        }
        default: {
          const exhaustiveCheck: never = warning;
          throw new Error(`Unhandled warning ${exhaustiveCheck}`);
        }
      }
    });
    return renderedWarnings.filter((warning) => warning != null);
  }, [
    endDate,
    locale,
    startDate,
    tabQueryParams.tab,
    timeSeriesAnnotations,
    translate,
    translateHTML,
    translationDependenciesReady,
    universeId,
    warnings,
  ]);
};

export default useRAQIV2PredefinedWarningsRenderBundle;
