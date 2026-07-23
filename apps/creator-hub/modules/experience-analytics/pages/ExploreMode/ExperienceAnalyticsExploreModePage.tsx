import React, { FC, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  type AnalyticsNavigationItem,
  analyticsCreationOverviewNavigationItem,
  analyticsExploreNavigationItem,
  ChartResourceType,
  ChartType,
  DateRangeType,
  GenericChartExportButton,
  GenericCsvExporter,
  getChartThemedColors,
} from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { ChartStyleMode } from '@rbx/analytics-ui';
import {
  AnalyticsPageAnnotationsControl,
  ExperienceAnalyticsPageBreakdownControl,
  ExperienceAnalyticsPageDateRangeControl,
  UniversePerformanceRaqiClientProvider,
  useOnSelectChartRegion,
  useExperienceAnalyticsExploreModeContext,
  DefaultExploreModeDateRanges,
  isExploreModeMetric,
  getExploreModeDimensions,
  getAtomicMetricsFromMetricLike,
  RAQIV2GenericChart,
  useCurrentChartContext,
  getExploreModeChartType,
  getTitleKeyFromPredefinedChart,
  ExperienceAnalyticsPermalinkIcon,
  getTooltipKeyFromPredefinedChart,
  GenericAnalyticsLayoutItem,
  RAQIV2SpecialLayoutType,
  useUniverseResource,
  NonConfigurationBasedSpecialExperienceAnalyticsPageLayout,
  computeRAQIV2SpecOverride,
  ExperienceAnalyticsFullScreenModeExitControl,
  ExperienceAnalyticsMetricControl,
  getExploreModeFilterOnlyDimensions,
  ExperienceAnalyticsFullScreenModeTitleOrBackLink,
  isExploreModeSupportedChartType,
  getAnalyticsMetricDisplayConfig,
  AnalyticsContextLayerInnerProvider,
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsPageSurfaceConfig,
  type MetricLike,
  type TRAQIV2NumericUIMetric,
  TExploreModeMetrics,
  TRAQIV2PredefinedChartKey,
} from '@modules/experience-analytics-shared';

import { Collapse, Dialog, Grid, makeStyles } from '@rbx/ui';
import AppBreadcrumbs from '@modules/navigation/layout/components/AppBreadcrumbs';

import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation } from '@rbx/intl';
import {
  AnnotationType,
  TRAQIV2BreakdownDimension,
  isSupportedBreakdownDimension,
  RAQIV2ChartResource,
} from '@modules/clients/analytics';
import ExploreModeGranularityControl from './ExploreModeGranularityControl';

/**
 * NOTE(gperkins@20240702):
 * This needs to be coordinated with `padding` in useHeightAdjustments.
 *
 * Due to our use of an MUI Dialog + dynamic `useHeightAdjustments` logic,
 *  we need to accomplish a bunch of things with these padding & margin adjustments.
 *
 * It is quite delicate. If you change it, please test:
 * - There is no horizontal region at the top of the page in a different background color
 * - When on a desktop-sized screen that alows the chart to have height > minHeight:
 *  - The chart adjusts on first render to have the same size padding on the bottom as the sides
 *  - The chart adjusts after a resize in the same way
 *  - There is no vertical scrollbar
 * - When the screen size causes the chart to be at minHeight but at a moderate width:
 *  - When the page is scrolled to the bottom:
 *    - the controls to float above the chart
 *    - The padding below the chart has the same size on the bottom as the sides
 * - When the width is very small:
 *  - The bottom of the chart is visible.
 */
const padding = 16;
const useExploreModePageStyles = makeStyles()((theme) => {
  const { layoutBackground: background } = getChartThemedColors(theme);

  return {
    fullScreen: {
      maxWidth: '100%',
      maxHeight: '100%',
      width: '100%',
      height: '100%',
      background,

      // NOTE(gperkins@20240702): see above
      margin: `-${padding}px 0`,
      padding: `${padding}px ${padding}px 0`,
      [theme.breakpoints.between('Medium', 'Large')]: {
        margin: `-24px 0`,
        padding: '24px 32px 0',
      },
      [theme.breakpoints.between('Large', 'XLarge')]: {
        margin: `-32px 0`,
        padding: '32px 48px 0',
      },
      [theme.breakpoints.up('XLarge')]: {
        margin: `-48px 0`,
        padding: '48px 96px 0',
      },
    },
    bodyContainer: {
      width: '100%',
      height: '100%',

      // NOTE(gperkins@20240702): see above
      marginBottom: `-${padding}px`,
    },
    dividerStyle: {
      borderWidth: '0.5px',
      margin: '24px 0 12px',
    },
    breadcrumbSpacingAdjustment: {
      marginBottom: -32,
    },
    titleContainer: {
      boxSizing: 'border-box',
      display: 'flex',
      flexFlow: 'wrap',
      width: '100%',
      boxPack: 'justify',
      justifyContent: 'space-between',
      marginBottom: '-6px',
    },
    metricControlContainer: {
      paddingTop: '6px',
    },
  };
});

const exploreSurfaceAnnotationOptions: AnalyticsPageConfigAnnotationOptions = {
  supportedAnnotationTypes: [
    AnnotationType.PlaceIcon,
    AnnotationType.PlaceThumbnail,
    AnnotationType.PlaceVideo,
    AnnotationType.PlaceVersion,
    AnnotationType.Benchmark,
    AnnotationType.LiveEvent,
    AnnotationType.CustomMatchmaking,
    AnnotationType.RetentionCorhortDisclaimer,
    AnnotationType.ConfigVersion,
    AnnotationType.Announcement,
  ],
  defaultAnnotationTypes: [],
  showAnnotationsControl: false,
};
/**
 * Inner component that renders inside AnalyticsContextLayerInnerProvider.
 * This ensures all the controls read from the correct context.
 */
type ExploreModePageContentProps = {
  executionMetric: MetricLike<TRAQIV2NumericUIMetric> | null;
  displayMetric: TExploreModeMetrics | null;
  preset: TRAQIV2PredefinedChartKey | null;
  priorUri: string | null;
  priorPage: AnalyticsNavigationItem | null;
  dimensions: readonly TRAQIV2BreakdownDimension[];
  resource: RAQIV2ChartResource;
  dateRangeOptions: DateRangeType[];
  fullScreenClass: string;
  bodyContainerClass: string;
  breadcrumbSpacingAdjustmentClass: string;
  titleContainerClass: string;
  metricControlComponent: React.JSX.Element;
};

const ExploreModePageContent: FC<ExploreModePageContentProps> = ({
  executionMetric,
  displayMetric,
  preset,
  priorUri,
  priorPage,
  dimensions,
  resource,
  dateRangeOptions,
  fullScreenClass,
  bodyContainerClass,
  breadcrumbSpacingAdjustmentClass,
  titleContainerClass,
  metricControlComponent,
}) => {
  const onSelectChartRegion = useOnSelectChartRegion();

  const chartContext = useCurrentChartContext({
    resource,
    dimensions,
    metric: displayMetric,
  });
  const chartType = useMemo(
    () => (displayMetric ? getExploreModeChartType(preset, displayMetric, chartContext) : null),
    [chartContext, displayMetric, preset],
  );

  const [exporter, setExporter] = useState<GenericCsvExporter | null>(null);
  const onChartDataUpdated = useCallback(
    ({ exporter: chartExporter }: { exporter: GenericCsvExporter }) => {
      setExporter(chartExporter);
    },
    [],
  );
  useEffect(() => {
    if (!displayMetric) {
      setExporter(null);
    }
  }, [displayMetric]);

  const leftSideControls = useMemo(() => {
    return [
      <ExperienceAnalyticsPageDateRangeControl key='date' dateRangeOptions={dateRangeOptions} />,
    ];
  }, [dateRangeOptions]);

  const chartSpec = useMemo(() => {
    if (!executionMetric || !displayMetric) {
      return null;
    }
    const { exploreModeSpecOverride } = getAnalyticsMetricDisplayConfig(displayMetric);
    return {
      ...(exploreModeSpecOverride
        ? computeRAQIV2SpecOverride(chartContext, exploreModeSpecOverride)
        : chartContext),
      metric: executionMetric,
    };
  }, [executionMetric, chartContext, displayMetric]);

  const chart = useMemo(() => {
    if (!chartSpec || !displayMetric || !chartType) {
      return null;
    }

    const { localizedName, localizedDescription } = getAnalyticsMetricDisplayConfig(displayMetric);
    const titleKey = preset ? getTitleKeyFromPredefinedChart(preset) : localizedName;
    const tooltipKey = preset ? getTooltipKeyFromPredefinedChart(preset) : localizedDescription;

    if (!isExploreModeSupportedChartType(chartType)) {
      throw new Error(`Unsupported chart type ${chartType}`);
    }

    return (
      <GenericAnalyticsLayoutItem layout={RAQIV2SpecialLayoutType.FullWidthLayout}>
        <RAQIV2GenericChart
          titleKey={titleKey}
          definitionTooltipKey={tooltipKey}
          spec={chartSpec}
          chartKeyOrConfig={preset}
          onSelectChartRegion={onSelectChartRegion}
          chartType={chartType}
          chartStyleMode={ChartStyleMode.Normal}
          chartHeight={450}
          onChartDataUpdated={onChartDataUpdated}
        />
      </GenericAnalyticsLayoutItem>
    );
  }, [chartSpec, chartType, displayMetric, preset, onSelectChartRegion, onChartDataUpdated]);

  const rightSideControls = useMemo(() => {
    const breakdownDimensions = dimensions.filter(
      (dimension): dimension is TRAQIV2BreakdownDimension =>
        isSupportedBreakdownDimension(dimension) &&
        !getExploreModeFilterOnlyDimensions(chartType).includes(dimension),
    );

    return [
      <ExploreModeGranularityControl key='granularity' chartContext={chartContext} />,
      <Collapse key='breakdown' in={breakdownDimensions.length >= 1} orientation='horizontal'>
        <ExperienceAnalyticsPageBreakdownControl dimensions={breakdownDimensions} />
      </Collapse>,
      <Collapse
        key='annotations'
        // time series annotations are only available for time series charts
        in={chartType === ChartType.Spline || chartType === ChartType.Area}
        orientation='horizontal'>
        <AnalyticsPageAnnotationsControl resourceType={ChartResourceType.Universe} />
      </Collapse>,
    ];
  }, [chartContext, dimensions, chartType]);

  const exploreModeTitleOrBackLink = useMemo(() => {
    return (
      <ExperienceAnalyticsFullScreenModeTitleOrBackLink
        titleKey={analyticsExploreNavigationItem.title}
        prevPage={priorPage ?? analyticsCreationOverviewNavigationItem}
        priorUri={priorUri}
        showTitle={!priorUri}
      />
    );
  }, [priorPage, priorUri]);

  const exploreModeExitButton = useMemo(
    () => (
      <ExperienceAnalyticsFullScreenModeExitControl
        {...{
          priorUri,
          iconKey: translationKey(
            'Description.CloseExploreModeButton',
            TranslationNamespace.Analytics,
          ),
        }}
      />
    ),
    [priorUri],
  );

  const pageTitleAndExitButton = useMemo(() => {
    return (
      <Fragment>
        <span className={breadcrumbSpacingAdjustmentClass}>
          <AppBreadcrumbs />
        </span>
        <Grid className={titleContainerClass}>
          {exploreModeTitleOrBackLink}
          <Grid item>
            {displayMetric && exporter && !exporter.hasEmptyData && (
              <GenericChartExportButton
                kpiType={displayMetric}
                exporter={exporter}
                inExploreModePage
              />
            )}
            <ExperienceAnalyticsPermalinkIcon />
            {exploreModeExitButton}
          </Grid>
        </Grid>
      </Fragment>
    );
  }, [
    breadcrumbSpacingAdjustmentClass,
    titleContainerClass,
    exploreModeExitButton,
    exploreModeTitleOrBackLink,
    exporter,
    displayMetric,
  ]);

  return (
    <Dialog open fullScreen classes={{ paper: fullScreenClass }}>
      <NonConfigurationBasedSpecialExperienceAnalyticsPageLayout
        fullScreen
        title={pageTitleAndExitButton}
        heroElement={metricControlComponent}
        addHeroDivider={false}
        controls={leftSideControls}
        rightSideControls={rightSideControls}
        raqiDimensions={dimensions}
        resource={resource}>
        <Grid item className={bodyContainerClass}>
          {chart}
        </Grid>
      </NonConfigurationBasedSpecialExperienceAnalyticsPageLayout>
    </Dialog>
  );
};

const ExperienceAnalyticsExploreModePage: FC = () => {
  const { preset, metric, executionMetric, setMetric, priorUri, priorPage, allowedMetrics } =
    useExperienceAnalyticsExploreModeContext();
  const displayMetric = useMemo((): TExploreModeMetrics | null => {
    if (metric) {
      return metric;
    }
    if (!executionMetric) {
      return null;
    }
    const [atomicMetric] = getAtomicMetricsFromMetricLike(executionMetric);
    return isExploreModeMetric(atomicMetric) ? atomicMetric : null;
  }, [executionMetric, metric]);

  const dimensions = useMemo(() => {
    if (!displayMetric) {
      return [];
    }
    const exploreModeDimensions = getExploreModeDimensions();
    const metricDimensions = exploreModeDimensions[displayMetric] || [];
    return metricDimensions;
  }, [displayMetric]);

  const {
    classes: {
      fullScreen,
      dividerStyle,
      bodyContainer,
      breadcrumbSpacingAdjustment,
      metricControlContainer,
      titleContainer,
    },
  } = useExploreModePageStyles();

  const metricControlComponent = (
    <div className={metricControlContainer}>
      <ExperienceAnalyticsMetricControl
        key='metric'
        options={[...allowedMetrics]}
        value={displayMetric}
        setMetric={setMetric}
      />
      <hr className={dividerStyle} />
    </div>
  );

  const timeRangeOptions: AnalyticsPageConfigDateOptions = useMemo(() => {
    const exploreModeConfig = displayMetric
      ? getAnalyticsMetricDisplayConfig(displayMetric).exploreMode
      : undefined;

    if (exploreModeConfig?.disabled) {
      return {
        type: 'dateRange' as const,
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
      };
    }

    const supportedRanges = exploreModeConfig?.supportedDateRangeTypes || [
      ...DefaultExploreModeDateRanges,
    ];

    return {
      type: 'dateRange' as const,
      supportedRanges: [...supportedRanges],
      defaultRange: DateRangeType.Last28Days,
      minStartDate: new Date('06/01/2023'),
    };
  }, [displayMetric]);

  const resource = useUniverseResource();
  const pageConfig: CreatorAnalyticsPageSurfaceConfig = useMemo(
    () => ({
      resourceTypes: [resource.type],
      filterDimensions: dimensions,
      breakdownDimensions: dimensions,
      timeRangeOptions,
      surfaceAnnotationOptions: exploreSurfaceAnnotationOptions,
      body: [],
    }),
    [resource.type, timeRangeOptions, dimensions],
  );

  return (
    <UniversePerformanceRaqiClientProvider>
      <AnalyticsContextLayerInnerProvider config={pageConfig}>
        <ExploreModePageContent
          executionMetric={executionMetric}
          displayMetric={displayMetric}
          preset={preset}
          priorUri={priorUri}
          priorPage={priorPage}
          dimensions={dimensions}
          resource={resource}
          dateRangeOptions={
            timeRangeOptions.type === 'dateRange' ? timeRangeOptions.supportedRanges : []
          }
          fullScreenClass={fullScreen}
          bodyContainerClass={bodyContainer}
          breadcrumbSpacingAdjustmentClass={breadcrumbSpacingAdjustment}
          titleContainerClass={titleContainer}
          metricControlComponent={metricControlComponent}
        />
      </AnalyticsContextLayerInnerProvider>
    </UniversePerformanceRaqiClientProvider>
  );
};
export default withTranslation(ExperienceAnalyticsExploreModePage, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Navigation,
]);
