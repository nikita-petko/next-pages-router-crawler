import type { FC } from 'react';
import React, { useMemo } from 'react';
import { subDays } from '@rbx/core';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import { withTranslation } from '@rbx/intl';
import { CircularProgress, Container, Grid, makeStyles } from '@rbx/ui';
import ChartResourceType from '@modules/charts-generic/enums/ChartResourceType';
import { getCurrentHourDate } from '@modules/charts-generic/utils/dateUtils';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import AnalyticsConfigurableComponent from '@modules/experience-analytics-shared/components/RAQIV2/layout/AnalyticsConfigurableComponent';
import getReactKey from '@modules/experience-analytics-shared/components/RAQIV2/layout/getReactKey';
import {
  controlledSubcontextConfigThumbnailImpressionDateRange,
  controlledSubcontextConfigThumbnailL7QualifiedPTRDateRange,
} from '@modules/experience-analytics-shared/constants/chart-configs/PredefinedSubcontextConfigLiterals';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import { useAnalyticsExperiencePermissions } from '@modules/experience-analytics-shared/hooks/useAnalyticsPermissions';
import type RAQIV2ChartContext from '@modules/experience-analytics-shared/types/RAQIV2ChartContext';
import type { CreatorAnalyticsPageSurfaceConfig } from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { EmptyGrid } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  useFindHomepageThumbnailPersonalization,
  useGetHomepageThumbnailsQuery,
} from '@modules/react-query/thumbnailPersonalization';
import PersonalizedThumbnailsTable from './components/PersonalizedThumbnailsTable';
import StartPersonalizeThumbnailsCard from './components/StartPersonalizeThumbnailsCard';
import { NewlyUploadedThumbnailIdsProvider } from './context/NewlyUploadedThumbnailIdsProvider';
import useGetUniversePermissionsQuery from './hooks/useGetUniversePermissionsQuery';

const chartConfigsWithL7QPTR = [
  controlledSubcontextConfigThumbnailImpressionDateRange,
  controlledSubcontextConfigThumbnailL7QualifiedPTRDateRange,
] as const;

const forbiddenErrorCode = 403;

const pageConfig: CreatorAnalyticsPageSurfaceConfig = {
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      RAQIV2DateRangeType.Last7Days,
      RAQIV2DateRangeType.Last28Days,
      RAQIV2DateRangeType.Last56Days,
      RAQIV2DateRangeType.Last90Days,
      RAQIV2DateRangeType.Last365Days,
      RAQIV2DateRangeType.Custom,
    ],
    defaultRange: RAQIV2DateRangeType.Last28Days,
    excludeEndDateInRange: false,
    maxEndDateOffset: 0,
    maxStartDateOffsetDays: 365,
  },
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [],
    defaultAnnotationTypes: [],
    showAnnotationsControl: false,
  },
  filterDimensions: [],
  breakdownDimensions: [],
  body: [...chartConfigsWithL7QPTR],
};

const useStyles = makeStyles()(() => {
  return {
    container: {
      marginTop: '36px',
    },
    chartContainer: {
      marginTop: 0,
    },
  };
});

type ThumbnailsHomePageTabContentProps = {
  universeId: number;
  canConfigure?: boolean;
};

const ThumbnailsHomePageTabContent: FC<ThumbnailsHomePageTabContentProps> = ({
  universeId,
  canConfigure,
}) => {
  const {
    classes: { container, chartContainer },
  } = useStyles();
  const { data: permissions, isPending: isCheckingPermission } =
    useGetUniversePermissionsQuery(universeId);
  const canManage = permissions?.canManage;
  const { userCanViewAnalyticsForUniverse, isPending: isPendingAnalyticsExperiencePermissions } =
    useAnalyticsExperiencePermissions(universeId);
  const isViewOnly = !canManage && userCanViewAnalyticsForUniverse;

  const { data: personalizationConfigData } = useFindHomepageThumbnailPersonalization(
    universeId,
    true,
  );

  const { data: thumbnailsData, isPending } = useGetHomepageThumbnailsQuery(universeId);
  const hasNoThumbnails = thumbnailsData && thumbnailsData.thumbnails.length === 0;

  const chartContext: RAQIV2ChartContext | null = useMemo(() => {
    const activeThumbnailConfig = personalizationConfigData?.personalizedConfigs?.find(
      (config) => config.personalizedConfigStatus === 'Active',
    );
    if (!activeThumbnailConfig) {
      return null;
    }

    const currentTime = getCurrentHourDate();
    const filter = [
      { dimension: RAQIV2Dimension.ThumbnailList, values: [activeThumbnailConfig.id] },
      {
        dimension: RAQIV2Dimension.ThumbnailAsset,
        values:
          thumbnailsData?.thumbnails
            .filter((thumbnail) => thumbnail.active)
            .map((thumbnail) => thumbnail.assetId.toString()) ?? [],
      },
    ];

    const endTime = currentTime;
    const startTime = subDays(endTime, 7);
    return {
      resource: { id: universeId, type: ChartResourceType.Universe },
      timeSpec: {
        rangeType: RAQIV2DateRangeType.Custom,
        startTime,
        endTime,
      },
      granularity: RAQIV2MetricGranularity.OneHour,
      filter,
      timeAxisBounds: [startTime, endTime],
    };
  }, [personalizationConfigData?.personalizedConfigs, universeId, thumbnailsData?.thumbnails]);

  if (isCheckingPermission || isPendingAnalyticsExperiencePermissions || isPending) {
    return (
      <EmptyGrid>
        <CircularProgress />
      </EmptyGrid>
    );
  }

  // render permission error page iff
  // 1. user cannot configure and
  // 2. user cannot view analytics
  if (!canConfigure && !userCanViewAnalyticsForUniverse) {
    return <ErrorPage errorCode={forbiddenErrorCode} />;
  }

  return (
    <AnalyticsContextLayerInnerProvider config={pageConfig}>
      <Container disableGutters maxWidth={false} classes={{ root: container }}>
        <NewlyUploadedThumbnailIdsProvider>
          {hasNoThumbnails ? (
            <StartPersonalizeThumbnailsCard
              universeId={universeId}
              isUserViewAnalyticsOnly={isViewOnly}
            />
          ) : (
            <>
              <PersonalizedThumbnailsTable
                isUserViewAnalyticsOnly={isViewOnly}
                universeId={universeId}
              />
              {chartContext && (
                <Grid container spacing={5} classes={{ root: chartContainer }}>
                  {chartConfigsWithL7QPTR.map((key) => (
                    <AnalyticsConfigurableComponent
                      key={getReactKey(key)}
                      component={key}
                      chartContext={chartContext}
                      onSelectChartRegion={null}
                    />
                  ))}
                </Grid>
              )}
            </>
          )}
        </NewlyUploadedThumbnailIdsProvider>
      </Container>
    </AnalyticsContextLayerInnerProvider>
  );
};

export default withTranslation(ThumbnailsHomePageTabContent, [
  TranslationNamespace.Controls,
  TranslationNamespace.Analytics,
  TranslationNamespace.PlaceThumbnails,
  TranslationNamespace.Error,
]);
