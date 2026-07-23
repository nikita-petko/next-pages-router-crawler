import type { ReactNode } from 'react';
import React, { useMemo } from 'react';
import { addDays } from '@rbx/core';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { InfoOutlinedIcon, WarningIcon } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatSingleDate } from '@modules/charts-generic/charts/formatters/timeFormatters';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import { analyticsRecommendedEventsFunnelsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import useLocale from '@modules/charts-generic/context/useLocale';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { AnnotationType } from '@modules/clients/analytics';
import { Link } from '@modules/miscellaneous/components';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import {
  RAQIV2PredefinedWarningTranslationKey,
  RAQIV2PredefinedWarnings,
} from '../constants/RAQIV2PredefinedWarnings';
import { useUniverseResource } from './useChartResourceProvider';
import useRAQIV2TranslationDependencies from './useRAQIV2TranslationDependencies';

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
        case RAQIV2PredefinedWarnings.RfyFirstPlayBounceRate:
          return (
            <span key={warning}>
              <WarningIcon
                fontSize='small'
                color='inherit'
                className='relative top-[2px] mr-2 align-text-bottom'
              />{' '}
              {translate(RAQIV2PredefinedWarningTranslationKey[warning])}
            </span>
          );
        case RAQIV2PredefinedWarnings.ServerCpuCoreUtilizationRecommendation:
          return (
            <span key={warning}>
              <InfoOutlinedIcon
                fontSize='small'
                color='inherit'
                style={{ verticalAlign: 'middle', marginRight: 5 }}
              />
              {translate(RAQIV2PredefinedWarningTranslationKey[warning])}
            </span>
          );
        case RAQIV2PredefinedWarnings.ClientCrashRateNoisyData:
          return (
            <span key={warning}>
              <WarningIcon
                fontSize='small'
                color='inherit'
                className='mr-[5px] align-text-bottom'
              />
              {translateHTML(RAQIV2PredefinedWarningTranslationKey[warning], [
                {
                  opening: 'linkStart',
                  closing: 'linkEnd',
                  content(chunks) {
                    return (
                      <Link
                        href={creatorHub.dashboard.getAnalyticsErrorsUrls(universeId)}
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

          const sortedDates = [...changeDates].sort((a, b) => a.getTime() - b.getTime());
          const earliestDate = sortedDates[0];
          const latestDate = sortedDates[sortedDates.length - 1];

          const makeBeforeStartDateLink = (chunks: React.ReactNode) => {
            return (
              <Link
                underline='none'
                href={buildExperienceAnalyticsUrlWithParams(
                  analyticsRecommendedEventsFunnelsNavigationItem,
                  {
                    [AnalyticsQueryParams.RangeType]: RAQIV2DateRangeType.Custom,
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
                    [AnalyticsQueryParams.RangeType]: RAQIV2DateRangeType.Custom,
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
          throw new Error(`Unhandled warning ${String(exhaustiveCheck)}`);
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
