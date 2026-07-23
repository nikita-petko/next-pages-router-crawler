import React, { FC, useMemo } from 'react';
import { CircularProgress, Container, Grid, makeStyles } from '@rbx/ui';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ErrorPage } from '@modules/miscellaneous/error';
import { StatusCodes, subDays } from '@rbx/core';
import { EmptyGrid } from '@modules/miscellaneous/common';
import {
  useFindHomepageThumbnailPersonalization,
  useGetHomepageThumbnailsQuery,
} from '@modules/react-query/thumbnailPersonalization';
import { ChartResourceType, DateRangeType, getCurrentHourDate } from '@modules/charts-generic';
import {
  AnalyticsConfigurableComponent,
  AnalyticsContextLayerInnerProvider,
  CreatorAnalyticsPageSurfaceConfig,
  RAQIV2ChartContext,
  controlledSubcontextConfigThumbnailImpressionDateRange,
  controlledSubcontextConfigThumbnailL7QualifiedPTRDateRange,
  getReactKey,
} from '@modules/experience-analytics-shared';
import { RAQIV2Dimension, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import PersonalizedThumbnailsTable from './components/PersonalizedThumbnailsTable';
import StartPersonalizeThumbnailsCard from './components/StartPersonalizeThumbnailsCard';
import useGetUniversePermissionsQuery from './hooks/useGetUniversePermissionsQuery';
import { NewlyUploadedThumbnailIdsProvider } from './context/NewlyUploadedThumbnailIdsProvider';

const chartConfigsWithL7QPTR = [
  controlledSubcontextConfigThumbnailImpressionDateRange,
  controlledSubcontextConfigThumbnailL7QualifiedPTRDateRange,
] as const;

const pageConfig: CreatorAnalyticsPageSurfaceConfig = {
  resourceTypes: [RAQIV2ChartResourceType.Universe],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Last56Days,
      DateRangeType.Last90Days,
      DateRangeType.Last365Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last28Days,
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
  const { userCanViewAnalyticsForUniverse, isFetched } = useFeatureFlagsForNamespace(
    'userCanViewAnalyticsForUniverse',
    FeatureFlagNamespace.Analytics,
  );
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
        startTime,
        endTime,
      },
      granularity: RAQIV2MetricGranularity.OneHour,
      filter,
      timeAxisBounds: [startTime, endTime],
    };
  }, [personalizationConfigData?.personalizedConfigs, universeId, thumbnailsData?.thumbnails]);

  if (isCheckingPermission || !isFetched || isPending) {
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
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
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
            <React.Fragment>
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
            </React.Fragment>
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
