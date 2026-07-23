import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import Router from 'next/router';
import { SelectStatusEnum } from '@rbx/client-core-content-api/v1';
import type { SearchCreatorType } from '@rbx/client-universes-api/v1';
import { getPrettifiedNumber } from '@rbx/core';
import { Badge, Button, Icon, Tooltip, TooltipTrigger } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, ReturnPolicy } from '@rbx/thumbnails';
import { IconButton, MoreVertIcon } from '@rbx/ui';
import {
  analyticsExploreNavigationItem,
  analyticsAssistantNavigationItem,
} from '@modules/charts-generic/constants/analyticsNavigationItems';
import AnalyticsQueryParams from '@modules/charts-generic/enums/AnalyticsQueryParams';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import {
  CreatorHubCreationsPermissionParameters,
  IXPLayers,
} from '@modules/clients/ixpExperiments';
import ItemCardContextMenu from '@modules/creations/common/components/ItemCardContextMenu';
import PrivacyStatusBadge from '@modules/creations/common/components/PrivacyStatusBadge';
import { Item } from '@modules/miscellaneous/common';
import { useConversionTracker, useIXPParameters } from '@modules/miscellaneous/hooks';
import useStudioEditPlaceLauncher from '@modules/miscellaneous/hooks/useStudioEditPlaceLauncher';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';
import { ExperienceWithAnalyticsTileSize } from '../../constants/tileConstants';
import type { TExperienceInsight } from '../../hooks/useExperienceInsights';
import { useCreator } from '../../providers/CreatorProvider';
import { type TExperience, useExperience } from '../../providers/ExperienceProvider';
import type {
  TExperienceAnalytics,
  TExperienceMetricAnalytics,
} from '../../providers/getExperienceAnalytics';
import { getAnalyticsDateRange } from '../../providers/getExperienceAnalytics';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';

const { dashboard } = creatorHub;

const ANALYTICS_WINDOW_DAYS = 7;

export type TExperienceDataTileV2Props = {
  data: TExperience;
  insight?: TExperienceInsight | null;
  isBeta?: boolean;
};

const getMetricChange = (metric: TExperienceMetricAnalytics | undefined) => {
  if (!metric) {
    return null;
  }
  if (metric.oldValue === 0 || metric.newValue === metric.oldValue) {
    return { trend: 'down' as const, percentage: 0 };
  }
  const change = (metric.newValue - metric.oldValue) / metric.oldValue;
  return {
    trend: change > 0 ? 'up' : 'down',
    percentage: Math.round(Math.abs(change * 100)),
  };
};

const ExperienceDataTileV2: FunctionComponent<
  React.PropsWithChildren<TExperienceDataTileV2Props>
> = ({ data, insight, isBeta }) => {
  const { id, name, isActive, isArchived, rootPlaceId, isFriendsOnly, audiences, creatorType } =
    data;
  const { translate, translateWithNamespace } = useTranslation();
  const [menu, setMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isInsightHovered, setIsInsightHovered] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { launch: launchStudio, dialog } = useStudioEditPlaceLauncher();
  const { permissions } = useCreator();
  const { params: creationsPermissionParams, isFetched: isCreationsPermissionIxpFetched } =
    useIXPParameters(IXPLayers.CreatorHubCreationsPermission);
  const enableNewBadgePattern =
    creationsPermissionParams[CreatorHubCreationsPermissionParameters.EnableNewBadgePattern];
  const enableAtRiskAnnotation =
    creationsPermissionParams[
      CreatorHubCreationsPermissionParameters.EnableAtRiskAnnotationOnExperiences
    ];
  const showNewBadgePattern = isCreationsPermissionIxpFetched && enableNewBadgePattern === true;
  const {
    experiencesDetails,
    experiencesContentMaturity,
    experiencesAnalytics,
    experiencesCoreContentEligibility,
    experiencesSequestration,
    experiencesAgeRecommendation,
    removeExperience,
    updateExperience,
  } = useExperience();
  const concurrentUserCount = experiencesDetails?.[id]?.playing;
  const contentMaturity = experiencesContentMaturity?.[id];
  const ageRecommendationValue = experiencesAgeRecommendation?.[id] ?? null;
  const placeSafetyFlags = experiencesSequestration?.[id];
  const isPlaceSequestered = placeSafetyFlags?.isSequestered ?? false;
  const isPlaceDiscoveryBlocked = placeSafetyFlags?.isDiscoveryBlocked ?? false;

  const coreContentEligibility = experiencesCoreContentEligibility?.[id];
  const isSelect = coreContentEligibility?.selectStatus === SelectStatusEnum.Eligible;
  const comparisonTooltip = useMemo(() => {
    const { startDate, endDate, comparisonStartDate, comparisonEndDate } =
      getAnalyticsDateRange(ANALYTICS_WINDOW_DAYS);
    const fmt = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
    return `${fmt.format(startDate)} - ${fmt.format(endDate)} vs. ${fmt.format(comparisonStartDate)} - ${fmt.format(comparisonEndDate)}`;
  }, []);

  const conversionParams = useMemo(
    () => ({
      page: 'homepage',
      section: EHomepageSection.Experiences,
      id: id.toString(),
      style: 'v2',
      ...(insight && { hasInsight: 'true' }),
    }),
    [id, insight],
  );

  const { ref: cardRef, onConvert } = useConversionTracker<HTMLDivElement>('homeExperienceTile', {
    additionalParams: conversionParams,
  });

  const isSelectAtRisk =
    enableAtRiskAnnotation === true &&
    isSelect &&
    (coreContentEligibility?.reasons.length ?? 0) > 0;

  const handleOpenInStudio = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (rootPlaceId) {
        launchStudio(id, rootPlaceId);
        onConvert('clickOpenInStudio');
        captureHomepageEvent('clickOpenInStudio', EHomepageSection.Experiences, {
          tileId: id.toString(),
          style: 'v2',
        });
      }
    },
    [id, launchStudio, onConvert, rootPlaceId],
  );

  const performanceUrl = dashboard.getAnalyticsPerformanceUrl(id);

  const handleConcurrentUsersClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onConvert('clickConcurrentUsers');
      captureHomepageEvent('clickConcurrentUsers', EHomepageSection.Experiences, {
        tileId: id.toString(),
        style: 'v2',
      });
    },
    [id, onConvert],
  );

  const concurrentUsersSection = (
    <div className='flex flex-col gap-xsmall padding-top-large'>
      <Link
        className='text-body-small content-default no-underline hover:underline self-start'
        href={performanceUrl}
        onClick={handleConcurrentUsersClick}>
        {translate('Label.ConcurrentUsers')}
      </Link>
      <Link
        className='text-heading-small content-emphasis no-underline hover:underline self-start'
        href={performanceUrl}
        onClick={handleConcurrentUsersClick}>
        {concurrentUserCount !== undefined ? getPrettifiedNumber(concurrentUserCount) : '--'}
      </Link>
    </div>
  );
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- indexing into a Record with a dynamic key
  const analytics = (experiencesAnalytics ?? {})[id] as Partial<TExperienceAnalytics> | undefined;

  const renderMetricRow = (
    label: string,
    href: string,
    metric: TExperienceMetricAnalytics | undefined,
    metricName: string,
    options?: { prefix?: React.ReactNode; suffix?: string; isPercentage?: boolean },
  ) => {
    const value =
      metric === undefined
        ? '--'
        : getPrettifiedNumber(
            Math.round(options?.isPercentage ? metric.newValue * 100 : metric.newValue),
          );
    const change = getMetricChange(metric);

    const handleMetricNavigate = (e: React.SyntheticEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onConvert('clickMetric');
      captureHomepageEvent('clickMetric', EHomepageSection.Experiences, {
        tileId: id.toString(),
        metric: metricName,
        style: 'v2',
      });
      void Router.push(href);
    };

    return (
      <Link
        className='group flex items-center justify-between cursor-pointer no-underline'
        href={href}
        tabIndex={0}
        onClick={handleMetricNavigate}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleMetricNavigate(e);
          }
        }}>
        <span className='text-body-small content-default no-underline group-hover:underline'>
          {label}
        </span>
        <div className='flex items-center gap-small'>
          <span
            className='text-caption-medium content-emphasis flex items-center gap-xsmall'
            style={{ textAlign: 'right' }}>
            {metric !== undefined && options?.prefix}
            <span>
              {value}
              {metric !== undefined && options?.suffix}
            </span>
          </span>
          {change && (
            <Tooltip position='top-center' title={comparisonTooltip}>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-xsmall justify-end ${change.trend === 'up' ? 'content-system-success' : 'content-muted'}`}
                  style={{ minWidth: 48 }}>
                  <Icon
                    name={
                      change.trend === 'up'
                        ? 'icon-regular-arrow-small-up'
                        : 'icon-regular-arrow-small-down'
                    }
                    size='XSmall'
                  />
                  <span className='text-caption-medium'>{change.percentage}%</span>
                </div>
              </TooltipTrigger>
            </Tooltip>
          )}
        </div>
      </Link>
    );
  };

  const tileMetrics = permissions?.canViewGameAnalytics ? (
    <div className='flex flex-col gap-small padding-top-large'>
      {renderMetricRow(
        translate('Label.DailyActiveUsers'),
        buildExperienceAnalyticsUrlWithParams(
          analyticsExploreNavigationItem,
          { [AnalyticsQueryParams.Metric]: 'DailyActiveUsers' },
          id,
        ),
        analytics?.dailyActiveUser,
        'DailyActiveUsers',
      )}
      {renderMetricRow(
        translate('Label.D1Retention'),
        buildExperienceAnalyticsUrlWithParams(
          analyticsExploreNavigationItem,
          { [AnalyticsQueryParams.Metric]: 'D1Retention' },
          id,
        ),
        analytics?.d1Retention,
        'ForwardD1Retention',
        { suffix: '%', isPercentage: true },
      )}
      {renderMetricRow(
        translate('Label.DailyRevenue'),
        buildExperienceAnalyticsUrlWithParams(
          analyticsExploreNavigationItem,
          { [AnalyticsQueryParams.Metric]: 'DailyRevenue' },
          id,
        ),
        analytics?.robux,
        'DailyRevenue',
        { prefix: <Icon name='icon-filled-robux' size='XSmall' /> },
      )}
      {renderMetricRow(
        translate('Label.AvgPlaytime'),
        buildExperienceAnalyticsUrlWithParams(
          analyticsExploreNavigationItem,
          { [AnalyticsQueryParams.Metric]: 'AveragePlayTimeMinutesPerDAU' },
          id,
        ),
        analytics?.playtime,
        'AveragePlayTimeMinutesPerDAU',
        { suffix: ` ${translate('Label.PlaytimeMinutesSymbol')}` },
      )}
    </div>
  ) : null;

  const hoverButtons = (
    <div
      className={`${isHovered ? 'flex' : 'hidden'} absolute gap-small padding-top-medium padding-x-large padding-bottom-large stroke-standard stroke-muted`}
      style={{
        top: '100%',
        left: -1,
        right: -1,
        zIndex: 1,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
        backgroundColor: 'var(--color-surface-0)',
        backgroundImage: 'linear-gradient(var(--color-shift-200), var(--color-shift-200))',
      }}>
      {permissions?.canViewGameAnalytics ? (
        <>
          {rootPlaceId && (
            <Button
              variant='Emphasis'
              size='Small'
              onClick={handleOpenInStudio}
              style={{ flex: 1 }}>
              {translate('Label.OpenStudio')}
            </Button>
          )}
          <Button
            variant='Standard'
            size='Small'
            as='a'
            href={dashboard.getExperienceOverviewUrl(id ?? 0)}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onConvert('clickViewDetails');
              captureHomepageEvent('clickViewDetails', EHomepageSection.Experiences, {
                tileId: id.toString(),
                style: 'v2',
              });
            }}
            style={{ flex: 1 }}>
            {translate('Label.ViewDetails')}
          </Button>
        </>
      ) : (
        <Button
          variant='Standard'
          size='Small'
          as='a'
          href={dashboard.getExperienceOverviewUrl(id ?? 0)}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onConvert('clickViewDetails');
            captureHomepageEvent('clickViewDetails', EHomepageSection.Experiences, {
              tileId: id.toString(),
              style: 'v2',
            });
          }}
          style={{ flex: 1 }}>
          {translate('Label.ViewDetails')}
        </Button>
      )}
    </div>
  );

  const handleInsightClick = useCallback(() => {
    onConvert('clickInsightSummary');
    captureHomepageEvent('clickInsightSummary', EHomepageSection.Experiences, {
      tileId: id.toString(),
      style: 'v2',
    });
  }, [id, onConvert]);

  const tileInsight = insight ? (
    <Link
      href={buildExperienceAnalyticsUrlWithParams(
        analyticsAssistantNavigationItem,
        { [AnalyticsQueryParams.InsightId]: insight.insightId },
        id,
      )}
      className='flex items-start gap-small padding-y-medium padding-x-large no-underline'
      style={{
        borderTop: '1px solid',
        borderColor: 'inherit',
        ...(isInsightHovered && {
          backgroundColor: 'var(--color-surface-0)',
          backgroundImage: 'linear-gradient(var(--color-shift-300), var(--color-shift-300))',
        }),
      }}
      onClick={(e) => {
        e.stopPropagation();
        handleInsightClick();
      }}
      onMouseEnter={() => setIsInsightHovered(true)}
      onMouseLeave={() => setIsInsightHovered(false)}>
      <span
        className='text-body-small content-default'
        style={{
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
        {insight.summary}
      </span>
      <div className='flex items-center self-center' style={{ flexShrink: 0 }}>
        {isInsightHovered ? (
          <Badge
            variant='Neutral'
            label={translateWithNamespace(TranslationNamespace.Home, 'Label.AI')}
          />
        ) : (
          <Icon name='icon-regular-chevron-large-right' size='Small' className='content-emphasis' />
        )}
      </div>
    </Link>
  ) : null;

  const experienceInfo = (
    <div className='flex items-start gap-small padding-top-medium'>
      <Link
        className='size-600 shrink-0'
        href={rootPlaceId ? dashboard.getPlaceThumbnailsUrl(id, rootPlaceId) : ''}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onConvert('clickThumbnail');
          captureHomepageEvent('clickThumbnail', EHomepageSection.Experiences, {
            tileId: id.toString(),
            style: 'v2',
          });
        }}>
        <Thumbnail2d
          alt={name ?? ''}
          targetId={id}
          containerClass='block'
          imgClassName='radius-small'
          type={ThumbnailTypes.gameIcon}
          returnPolicy={ReturnPolicy.AutoGenerated}
        />
      </Link>
      <div className='flex flex-col min-width-0'>
        <span className='text-title-large content-emphasis text-no-wrap text-truncate-end'>
          {name}
        </span>
      </div>
    </div>
  );

  const statusAndMenu = (
    <div className='flex items-center justify-between'>
      <PrivacyStatusBadge
        universeId={id}
        isActive={isActive}
        isFriendsOnly={isFriendsOnly}
        audiences={audiences}
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- creatorType comes from same API type
        creatorType={creatorType as unknown as SearchCreatorType}
        contentMaturity={contentMaturity}
        isBeta={isBeta}
        isSelect={isSelect}
        isSelectAtRisk={isSelectAtRisk}
        useNewBadgePattern={showNewBadgePattern}
        ageRecommendation={ageRecommendationValue}
        isSequestered={isPlaceSequestered}
        isDiscoveryBlocked={isPlaceDiscoveryBlocked}
      />
      <IconButton
        ref={setMenuAnchorEl}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          captureHomepageEvent('clickTileViewMenu', EHomepageSection.Experiences, {
            tileId: id.toString(),
            style: 'v2',
          });
          onConvert('clickTileViewMenu');
          setMenu(true);
        }}
        size='small'
        color='secondary'
        aria-label='more'>
        <MoreVertIcon fontSize='small' />
      </IconButton>
    </div>
  );

  return (
    <>
      <div
        ref={cardRef}
        className={`stroke-standard stroke-muted ${isHovered ? '' : 'radius-large'}`}
        style={{
          width: ExperienceWithAnalyticsTileSize.small.width,
          position: 'relative',
          overflow: 'visible',
          alignSelf: 'flex-start',
          backgroundColor: 'var(--color-surface-0)',
          backgroundImage: `linear-gradient(var(--color-shift-${isHovered ? '200' : '100'}), var(--color-shift-${isHovered ? '200' : '100'}))`,
          ...(isHovered && {
            zIndex: 1,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }),
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') {
            setIsHovered(true);
          }
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') {
            setIsHovered(false);
          }
        }}>
        <Link
          className='padding-top-large padding-x-large padding-bottom-medium'
          href={dashboard.getExperienceOverviewUrl(id ?? 0)}
          onClick={() => {
            onConvert('clickTile');
          }}
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          {statusAndMenu}
          {experienceInfo}
          {concurrentUsersSection}
          {tileMetrics}
        </Link>
        {tileInsight}
        {hoverButtons}
      </div>
      <ItemCardContextMenu
        itemType={Item.Game}
        creation={{
          itemType: Item.Game,
          universeId: id,
          name,
          isActive,
          isArchived,
          isDirectlyArchivable: true,
          assetId: rootPlaceId,
          isClickable: false,
        }}
        removeItem={() => {
          removeExperience(id);
        }}
        updateItemPrivacy={(value) => {
          updateExperience(id, {
            ...data,
            isActive: value,
          });
        }}
        updateItem={(value) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- value shape matches TExperience partial
          updateExperience(id, { ...data, ...(value as unknown as Partial<TExperience>) });
        }}
        url={`${process.env.baseUrl}${dashboard.getExperienceOverviewUrl(id ?? 0)}`}
        handleClose={() => {
          setMenu(false);
        }}
        anchorEl={menuAnchorEl}
        menuOpen={menu}
      />
      {dialog}
    </>
  );
};

export default withTranslation(ExperienceDataTileV2, [
  TranslationNamespace.Home,
  TranslationNamespace.Controls,
  TranslationNamespace.Creations,
  TranslationNamespace.Error,
  TranslationNamespace.ServerManagement,
  TranslationNamespace.ExperienceReleases,
]);
