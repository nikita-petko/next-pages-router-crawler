import React, { FC, useMemo } from 'react';
import { Link } from '@rbx/ui';
import {
  AnalyticsPageTitle,
  AnalyticsPageDescription,
  DateRangeType,
  analyticsErrorReportNavigationItem,
  SeriesIntervalMeaning,
  SeriesIntervalAlignment,
  ChartResourceType,
  AnalyticsDocLink,
} from '@modules/charts-generic';

import { translationKey, TranslationKey } from '@modules/analytics-translations';

import { TranslationNamespace } from '@modules/miscellaneous/localization';

import { withTranslation } from '@rbx/intl';
import { AnnotationType } from '@modules/clients/analytics';
import {
  PlaceVersionNumber,
  SupportedLogSeverities,
  SupportedLogSources,
} from '@modules/clients/analytics/universePerformanceRaqi';
import {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  ExperienceAnalyticsPageLayout,
  ExperienceAnalyticsPageDateRangeControl,
  AnalyticsPageAnnotationsControl,
  useExperienceAnalyticsCurrentDateRangeBundle,
  useAnalyticsCurrentFilterBundle,
  useOnSelectChartRegion,
  ExperienceAnalyticsPageGranularityControl,
  useAnalyticsCurrentGranularityBundle,
  useRAQIV2TranslationDependencies,
  getFilterValuesForDimension,
  UIFilters,
  GenericAnalyticsLayoutItem,
  RAQIV2SpecialLayoutType,
  useUniverseResource,
  NonRAQIUIDimension,
  ManualAnalyticsPageSurfaceContextProvider,
  chartConfigPerformancePeakConcurrentPlayers,
  CreatorAnalyticsPageMode,
  EndDateBehavior,
} from '@modules/experience-analytics-shared';

import { RAQIV2Dimension, RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import { isValidArrayEnumValue } from '@modules/miscellaneous/common/utils/enumUtils';
import { type CreatorAnalyticsUntabbedPageConfig } from '@modules/experience-analytics-shared';
import ErrorLogTableContent from '../../components/errorLogTable/ErrorLogTableContent';
import ErrorReportChart from '../../components/ErrorReportChart';
import { ErrorReportSupportedGranularities } from '../../types/ErrorReportChartSpec';

const errorReportDocLink: AnalyticsDocLink = '/docs/production/analytics/error-report';

const makeTakeActionLink = (chunks: React.ReactNode) => {
  return (
    <Link href={errorReportDocLink} underline='always'>
      {chunks}
    </Link>
  );
};

const getFilterValueForPlaceVersion = (uiFilters: UIFilters): PlaceVersionNumber[] | null => {
  const placeVersionValue = getFilterValuesForDimension<string>(
    uiFilters,
    NonRAQIUIDimension.Version,
    null,
  );

  return (
    placeVersionValue?.map((value) => (value.startsWith('V') ? value.slice(1) : value)) ?? null
  );
};

const errorReportFilterDimensions = [NonRAQIUIDimension.Version, NonRAQIUIDimension.Text] as const;
const errorReportRAQIFilterDimensions = [
  RAQIV2Dimension.Place,
  RAQIV2Dimension.LogSeverity,
  RAQIV2Dimension.LogSource,
] as const;

const supportedGranularities: ErrorReportSupportedGranularities[] = [
  RAQIV2MetricGranularity.OneDay,
  RAQIV2MetricGranularity.OneHour,
  RAQIV2MetricGranularity.HalfHour,
  RAQIV2MetricGranularity.OneMinute,
] as const;

const pageGranularityToMonitoringSeriesIntervalMeaning: Record<
  ErrorReportSupportedGranularities,
  SeriesIntervalMeaning
> = {
  [RAQIV2MetricGranularity.OneHour]: {
    length: RAQIV2MetricGranularity.OneHour,
    alignment: SeriesIntervalAlignment.UTC_Hour,
    isRetrospective: true,
  },
  [RAQIV2MetricGranularity.OneDay]: {
    length: RAQIV2MetricGranularity.OneDay,
    alignment: SeriesIntervalAlignment.UTC_Day,
    isRetrospective: true,
  },
  [RAQIV2MetricGranularity.OneMinute]: {
    length: RAQIV2MetricGranularity.OneMinute,
    alignment: SeriesIntervalAlignment.UTC_Minute,
    isRetrospective: true,
  },
  [RAQIV2MetricGranularity.HalfHour]: {
    length: RAQIV2MetricGranularity.HalfHour,
    alignment: SeriesIntervalAlignment.UTC_Hour,
    isRetrospective: true,
  },
};

const pageConfigCurrentlyUsedOnlyToFakeTheMetricForThePlaceSelector = {
  mode: CreatorAnalyticsPageMode.Untabbed,
  debugPageName: 'ErrorReport',
  title: translationKey('Title.ErrorReport', TranslationNamespace.Analytics),
  description: {
    standard: translationKey('Description.TakeActionErrorReport', TranslationNamespace.Analytics),
  },
  docLinks: [errorReportDocLink],
  resourceTypes: [ChartResourceType.Universe],
  timeRangeOptions: {
    type: 'dateRange',
    supportedRanges: [
      DateRangeType.Last1Hour,
      DateRangeType.Last1Day,
      DateRangeType.Last7Days,
      DateRangeType.Last28Days,
      DateRangeType.Custom,
    ],
    defaultRange: DateRangeType.Last1Day,
    maxStartDateOffsetDays: 30,
  } as const satisfies AnalyticsPageConfigDateOptions,
  surfaceAnnotationOptions: {
    supportedAnnotationTypes: [
      AnnotationType.PlaceIcon,
      AnnotationType.PlaceThumbnail,
      AnnotationType.PlaceVideo,
      AnnotationType.PlaceVersion,
      AnnotationType.LiveEvent,
      AnnotationType.ConfigVersion,
      AnnotationType.Announcement,
    ],
    defaultAnnotationTypes: [],
    showAnnotationsControl: false,
  } as const satisfies AnalyticsPageConfigAnnotationOptions,
  filterDimensions: [], // filter dimensions are not yet RAQI
  breakdownDimensions: [], // breakdown dimensions are not yet RAQI
  body: [
    // This hack allows for populating the place selector prior to migrating error report to CAaaS
    chartConfigPerformancePeakConcurrentPlayers,
  ],
  endDateBehavior: EndDateBehavior.LatestAvailableForMetrics,
} as const satisfies CreatorAnalyticsUntabbedPageConfig;
/**
 * Inner component that consumes analytics contexts.
 * This MUST be rendered inside ManualAnalyticsPageSurfaceContextProvider
 * so that the hooks read from the correct provider.
 */
const ErrorReportPageInner: FC = () => {
  const { translate, translateHTML } = useRAQIV2TranslationDependencies();
  const { id: universeId } = useUniverseResource();

  // eslint-disable-next-line deprecation/deprecation -- DSA-3131 to migrate
  const { filters } = useAnalyticsCurrentFilterBundle(
    errorReportFilterDimensions,
    errorReportRAQIFilterDimensions,
  );

  const { startDate, endDate } = useExperienceAnalyticsCurrentDateRangeBundle();
  const onSelectChartRegion = useOnSelectChartRegion();

  const placeId = useMemo(() => {
    const placeIdFromFilter = filters.find((f) => f.dimension === RAQIV2Dimension.Place)?.values[0];
    return placeIdFromFilter ? Number(placeIdFromFilter) : null;
  }, [filters]);

  const placeVersionFilter = useMemo(() => {
    return getFilterValueForPlaceVersion(filters);
  }, [filters]);

  const textFilterValue = useMemo(() => {
    return filters.find((f) => f.dimension === NonRAQIUIDimension.Text)?.values[0] ?? '';
  }, [filters]);

  const logSeverityFilterValue = useMemo(() => {
    const values = getFilterValuesForDimension<SupportedLogSeverities>(
      filters,
      RAQIV2Dimension.LogSeverity,
      [SupportedLogSeverities.All],
    );

    if (values?.length === 1) {
      return values[0];
    }

    return SupportedLogSeverities.All;
  }, [filters]);

  const logSourceFilterValue = useMemo(() => {
    const values = getFilterValuesForDimension<SupportedLogSources>(
      filters,
      RAQIV2Dimension.LogSource,
      [SupportedLogSources.All],
    );

    if (values?.length === 1) {
      return values[0];
    }

    return SupportedLogSources.All;
  }, [filters]);

  const getTranslationKeyForChartFilterState = useMemo((): TranslationKey => {
    switch (logSeverityFilterValue) {
      case SupportedLogSeverities.All:
        return translationKey('Title.ErrorReportChart', TranslationNamespace.Analytics);
      case SupportedLogSeverities.Warning:
        return translationKey(
          'Title.ErrorReportChart.WarningSeverity',
          TranslationNamespace.Analytics,
        );
      case SupportedLogSeverities.Error:
        return translationKey(
          'Title.ErrorReportChart.ErrorSeverity',
          TranslationNamespace.Analytics,
        );
      default: {
        const exhaustiveCheck: never = logSeverityFilterValue;
        throw new Error(`Unhandled log severitytype ${exhaustiveCheck}`);
      }
    }
  }, [logSeverityFilterValue]);

  const getTranslationKeyForChartTableState = useMemo((): TranslationKey => {
    switch (logSeverityFilterValue) {
      case SupportedLogSeverities.All:
        return translationKey('Title.ErrorLogTable', TranslationNamespace.Analytics);
      case SupportedLogSeverities.Warning:
        return translationKey(
          'Title.ErrorLogTable.WarningSeverity',
          TranslationNamespace.Analytics,
        );
      case SupportedLogSeverities.Error:
        return translationKey('Title.ErrorLogTable.ErrorSeverity', TranslationNamespace.Analytics);
      default: {
        const exhaustiveCheck: never = logSeverityFilterValue;
        throw new Error(`Unhandled log severitytype ${exhaustiveCheck}`);
      }
    }
  }, [logSeverityFilterValue]);

  const leftSideControls = useMemo(() => {
    return [
      <ExperienceAnalyticsPageDateRangeControl
        key='date'
        dateRangeOptions={[
          DateRangeType.Last1Hour,
          DateRangeType.Last1Day,
          DateRangeType.Last7Days,
          DateRangeType.Last28Days,
          DateRangeType.Custom,
        ]}
      />,
    ];
  }, []);

  const rightSideControls = useMemo(() => {
    return [
      <ExperienceAnalyticsPageGranularityControl
        key='granularity'
        granularityOptions={supportedGranularities}
      />,
      <AnalyticsPageAnnotationsControl
        key='annotations'
        resourceType={ChartResourceType.Universe}
      />,
    ];
  }, []);

  const { granularity: givenGranularity } = useAnalyticsCurrentGranularityBundle();
  const granularity = useMemo(
    () =>
      isValidArrayEnumValue(supportedGranularities, givenGranularity)
        ? givenGranularity
        : RAQIV2MetricGranularity.OneDay,
    [givenGranularity],
  );

  const seriesIntervalMeaning = useMemo(
    () => pageGranularityToMonitoringSeriesIntervalMeaning[granularity],
    [granularity],
  );

  const chart = (
    <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
      <ErrorReportChart
        titleKey={getTranslationKeyForChartFilterState}
        definitionTooltipKey={translationKey(
          'Description.ErrorReportChart',
          TranslationNamespace.Analytics,
        )}
        seriesIntervalMeaning={seriesIntervalMeaning}
        spec={{
          startDate,
          endDate,
          granularity,
          placeId,
          placeVersionFilter,
          textFilter: textFilterValue,
          logSeverityFilter: logSeverityFilterValue,
          logSourceFilter: logSourceFilterValue,
        }}
        onSelectChartRegion={onSelectChartRegion}
      />
    </GenericAnalyticsLayoutItem>
  );

  const errorLogTable = (
    <ErrorLogTableContent
      titleKey={getTranslationKeyForChartTableState}
      universeId={universeId}
      startDate={startDate}
      endDate={endDate}
      placeId={placeId}
      placeVersionFilter={placeVersionFilter}
      textFilter={textFilterValue}
      logSeverityFilter={logSeverityFilterValue}
      logSourceFilter={logSourceFilterValue}
    />
  );

  const title = useMemo(() => {
    return <AnalyticsPageTitle text={translate(analyticsErrorReportNavigationItem.title)} />;
  }, [translate]);

  const description = useMemo(() => {
    return (
      <AnalyticsPageDescription
        text={translateHTML(
          translationKey('Description.TakeActionErrorReport', TranslationNamespace.Analytics),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: makeTakeActionLink,
            },
          ],
        )}
      />
    );
  }, [translateHTML]);

  const resource = useUniverseResource();

  return (
    // eslint-disable-next-line deprecation/deprecation -- DSA-3131 to migrate
    <ExperienceAnalyticsPageLayout
      title={title}
      description={description}
      controls={leftSideControls}
      rightSideControls={rightSideControls}
      filterDimensions={errorReportFilterDimensions}
      raqiDimensions={errorReportRAQIFilterDimensions}
      resource={resource}>
      {chart}
      {errorLogTable}
    </ExperienceAnalyticsPageLayout>
  );
};

/**
 * Outer component that sets up the analytics context provider.
 * The inner component must be a separate component so that hooks
 * are called INSIDE the provider, not outside of it.
 */
const ErrorReportPage: FC = () => {
  return (
    <ManualAnalyticsPageSurfaceContextProvider
      config={pageConfigCurrentlyUsedOnlyToFakeTheMetricForThePlaceSelector}>
      <ErrorReportPageInner />
    </ManualAnalyticsPageSurfaceContextProvider>
  );
};

export default withTranslation(ErrorReportPage, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
  TranslationNamespace.Navigation,
]);
