import React, { type FC, useCallback, useMemo, useState } from 'react';
import {
  RAQIV2DateRangeType,
  RAQIV2Dimension,
  RAQIV2UIPseudoDimension,
  RAQIV2UIMetric,
  type TRAQIV2APIMetric,
  type TRAQIV2UIMetricFanoutDimensionValues,
} from '@rbx/creator-hub-analytics-config';
import { Button, IconButton } from '@rbx/foundation-ui';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import {
  getChartConfiguratorDimensions,
  getSharedChartConfiguratorDimensions,
} from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorDimensions';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import { DefaultExploreModeDateRanges } from '@modules/experience-analytics-shared/chartConfigurator/resolveChartConfiguratorComputedMetricSources';
import ChartConfigurator from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfigurator';
import ChartConfiguratorPreview from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorPreview';
import { customEventsMetric } from '@modules/experience-analytics-shared/components/chartConfigurator/useChartConfiguratorSourceSelection';
import { SourceMetricContextProvider } from '@modules/experience-analytics-shared/components/RAQIV2/layout/RAQIV2ConfigurablePageContext';
import { isNumericUIMetric } from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import {
  getFilterBarDimensionForRAQIV2Dimension,
  type TSupportedFilterBarDimensions,
} from '@modules/experience-analytics-shared/constants/FilterDimensionConfig';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import { UniversePerformanceRaqiClientProvider } from '@modules/experience-analytics-shared/context/UniversePerformanceRaqiClientProvider';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import ExperienceAnalyticsPageFilterDrawerButton from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/ExperienceAnalyticsPageFilterDrawerButton';
import type {
  UIFilterChangeOptions,
  UIFilters,
} from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import useTextFilterValidation from '@modules/experience-analytics-shared/text-filter/useTextFilterValidation';
import {
  getUIMetricFromAtomicMetricLike,
  isComputedMetric,
  isCustomEventsAtomicMetricLike,
  type MetricLike,
} from '@modules/experience-analytics-shared/types/ComputedMetric';
import type {
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsPageSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
import { getAPIMetricFromUIMetric } from '@modules/experience-analytics-shared/utils/getAPIMetricFromUIMetric';
import { isValidEnumValue } from '@modules/miscellaneous/utils/enumUtils';
import CustomDashboardBreadcrumbRegistration from '../../components/CustomDashboardBreadcrumbRegistration';
import { CUSTOM_DASHBOARD_SURFACE_ANNOTATION_OPTIONS } from '../../constants/customDashboardSurfaceAnnotationOptions';
import { CustomDashboardNotFoundError } from '../../errors';
import { getChartRows, withChartRows } from '../../layout/dashboardLayout';
import { appendTileAsRow, flattenRows, replaceTile } from '../../layout/rowLayout';
import type { ChartTileConfig, CustomDashboardDocument } from '../../types';
import { MAX_CHART_TILES_PER_DASHBOARD, MAX_TILE_TITLE_LENGTH } from '../../types';
import { getCustomDashboardBreakdownDimensions } from '../../utils/breakdownDimensions';
import {
  createEditorWorkingCopyFromDocument,
  getEditorWorkingCopy,
  NEW_DASHBOARD_ROUTE_ID,
  updateEditorWorkingCopy,
  type EditorWorkingCopy,
} from '../../workingCopy/editorWorkingCopy';
import useDashboardDocumentQuery from '../edit/hooks/useDashboardDocumentQuery';
import useEditPageTranslations from '../edit/useEditPageTranslations';
import {
  buildChartTileFromEditor,
  createDefaultChartTileDraft,
  hasChartTileEditorChanges,
  hydrateChartTilePlaceFilter,
  findChartTileInConfig,
  isNewChartTileRoute,
  mintChartTileIdForSave,
} from './chartTileDraft';
import useChartEditorSidebarState from './useChartEditorSidebarState';
import styles from './ChartEditorPageContent.module.css';

const resolveApiMetric = (
  sourceMetric: TChartConfiguratorMetrics,
  pseudoDimensionValues: TRAQIV2UIMetricFanoutDimensionValues,
): TRAQIV2APIMetric =>
  isValidEnumValue(RAQIV2UIMetric, sourceMetric)
    ? getAPIMetricFromUIMetric(sourceMetric, pseudoDimensionValues)
    : sourceMetric;

const getChartContextApiMetrics = (metricLike: MetricLike | null): TRAQIV2APIMetric[] => {
  if (!metricLike) {
    return [];
  }
  const seen = new Set<TRAQIV2APIMetric>();
  const out: TRAQIV2APIMetric[] = [];
  const collect = (
    sourceMetric: TChartConfiguratorMetrics,
    pseudoDimensionValues: TRAQIV2UIMetricFanoutDimensionValues,
  ) => {
    const apiMetric = resolveApiMetric(sourceMetric, pseudoDimensionValues);
    if (!seen.has(apiMetric)) {
      seen.add(apiMetric);
      out.push(apiMetric);
    }
  };
  if (isComputedMetric(metricLike)) {
    metricLike.sources.forEach((source) => {
      const sourceMetric = getUIMetricFromAtomicMetricLike(source.metric);
      if (!isNumericUIMetric(sourceMetric)) {
        return;
      }
      const pseudoDimensionValues = isCustomEventsAtomicMetricLike(source.metric)
        ? {
            aggregationType:
              source.metric.aggregationType ??
              source.pseudoDimensionValues?.aggregationType ??
              null,
            percentile: source.pseudoDimensionValues?.percentile ?? null,
          }
        : (source.pseudoDimensionValues ?? { aggregationType: null, percentile: null });
      collect(sourceMetric, pseudoDimensionValues);
    });
    return out;
  }
  const sourceMetric = getUIMetricFromAtomicMetricLike(metricLike);
  if (!isNumericUIMetric(sourceMetric)) {
    return out;
  }
  const pseudoDimensionValues = isCustomEventsAtomicMetricLike(metricLike)
    ? { aggregationType: metricLike.aggregationType ?? null, percentile: null }
    : { aggregationType: null, percentile: null };
  collect(sourceMetric, pseudoDimensionValues);
  return out;
};

type ChartEditorPageContentProps = {
  readonly universeId: number;
  readonly dashboardId: string;
  readonly draftId: string | undefined;
  readonly tileIdParam: string | undefined;
  readonly allowedMetrics: readonly TChartConfiguratorMetrics[];
  readonly onBackToEditor: (draftId?: string) => void;
};

const ChartEditorPageContent: FC<ChartEditorPageContentProps> = ({
  universeId,
  dashboardId,
  draftId,
  tileIdParam,
  allowedMetrics,
  onBackToEditor,
}) => {
  const t = useEditPageTranslations();
  const resource = useUniverseResource();
  const [activeSession, setActiveSession] = useState<EditorWorkingCopy | null>(() =>
    getEditorWorkingCopy(draftId),
  );
  const [trackedDraftId, setTrackedDraftId] = useState(draftId);
  const workingCopyFromRoute = getEditorWorkingCopy(draftId);
  if (draftId !== trackedDraftId) {
    setTrackedDraftId(draftId);
    if (workingCopyFromRoute) {
      setActiveSession(workingCopyFromRoute);
    }
  }
  const isNewDashboard = dashboardId === NEW_DASHBOARD_ROUTE_ID;
  const documentQuery = useDashboardDocumentQuery(
    universeId,
    activeSession || isNewDashboard ? undefined : dashboardId,
  );
  const document = documentQuery.data ?? null;
  const activeConfig = activeSession?.config ?? document?.config ?? null;
  const isNewTile = isNewChartTileRoute(tileIdParam);
  const existingChartTile = useMemo(() => {
    if (!activeConfig || isNewTile || !tileIdParam) {
      return null;
    }
    return findChartTileInConfig(activeConfig, tileIdParam);
  }, [activeConfig, isNewTile, tileIdParam]);

  const initialTile = useMemo(
    () => existingChartTile ?? createDefaultChartTileDraft('draft-preview'),
    [existingChartTile],
  );
  const dimensions = useMemo(
    () => getSharedChartConfiguratorDimensions(allowedMetrics),
    [allowedMetrics],
  );
  const breakdownDimensions = useMemo(
    () => getCustomDashboardBreakdownDimensions(dimensions),
    [dimensions],
  );
  const defaultDateRangeOptions = useMemo(
    () => [...DefaultExploreModeDateRanges, RAQIV2DateRangeType.Custom],
    [],
  );
  const timeRangeOptions: AnalyticsPageConfigDateOptions = useMemo(
    () => ({
      type: 'dateRange',
      supportedRanges: defaultDateRangeOptions,
      defaultRange: RAQIV2DateRangeType.Last28Days,
      minStartDate: new Date('06/01/2023'),
    }),
    [defaultDateRangeOptions],
  );
  const pageConfig: CreatorAnalyticsPageSurfaceConfig = useMemo(
    () => ({
      resourceTypes: [resource.type],
      filterDimensions: dimensions,
      breakdownDimensions,
      timeRangeOptions,
      surfaceAnnotationOptions: CUSTOM_DASHBOARD_SURFACE_ANNOTATION_OPTIONS,
      body: [],
    }),
    [breakdownDimensions, dimensions, resource.type, timeRangeOptions],
  );

  if (documentQuery.isLoading && !activeSession) {
    return <ChartEditorStatus variant='status'>{t.chartEditorLoadingLabel}</ChartEditorStatus>;
  }

  if (documentQuery.isError && !activeSession) {
    if (documentQuery.error instanceof CustomDashboardNotFoundError) {
      return (
        <ChartEditorStatus variant='alert'>
          <p className='text-heading-small content-emphasis margin-none'>{t.notFoundHeadline}</p>
          <Button type='button' variant='Emphasis' size='Medium' onClick={() => onBackToEditor()}>
            {t.notFoundCtaLabel}
          </Button>
        </ChartEditorStatus>
      );
    }
    return (
      <ChartEditorStatus variant='alert'>
        <p className='text-body-medium content-muted margin-none'>{t.loadErrorHeadline}</p>
        <Button
          type='button'
          variant='Standard'
          size='Small'
          onClick={() => documentQuery.refetch()}>
          {t.loadErrorRetryLabel}
        </Button>
      </ChartEditorStatus>
    );
  }

  if (!activeConfig) {
    return null;
  }

  if (!isNewTile && tileIdParam && !existingChartTile) {
    return (
      <ChartEditorStatus variant='alert'>
        <p className='text-heading-small content-emphasis margin-none'>
          {t.chartEditorTileNotFoundHeadline}
        </p>
        <Button type='button' variant='Emphasis' size='Medium' onClick={() => onBackToEditor()}>
          {t.chartEditorBackLabel}
        </Button>
      </ChartEditorStatus>
    );
  }

  return (
    <UniversePerformanceRaqiClientProvider>
      <AnalyticsContextLayerInnerProvider config={pageConfig}>
        <CustomDashboardBreadcrumbRegistration
          dashboardName={activeSession?.name ?? document?.name}
        />
        <ChartEditorSurface
          dashboardId={dashboardId}
          document={document}
          activeSession={activeSession}
          setActiveSession={setActiveSession}
          isNewTile={isNewTile}
          initialTile={initialTile}
          existingChartTile={existingChartTile}
          allowedMetrics={allowedMetrics}
          onBackToEditor={onBackToEditor}
        />
      </AnalyticsContextLayerInnerProvider>
    </UniversePerformanceRaqiClientProvider>
  );
};

type ChartEditorSurfaceProps = {
  readonly dashboardId: string;
  readonly document: CustomDashboardDocument | null;
  readonly activeSession: EditorWorkingCopy | null;
  readonly setActiveSession: (session: EditorWorkingCopy) => void;
  readonly isNewTile: boolean;
  readonly initialTile: ChartTileConfig;
  readonly existingChartTile: ChartTileConfig | null;
  readonly allowedMetrics: readonly TChartConfiguratorMetrics[];
  readonly onBackToEditor: (draftId?: string) => void;
};

const ChartEditorSurface: FC<ChartEditorSurfaceProps> = ({
  dashboardId,
  document,
  activeSession,
  setActiveSession,
  isNewTile,
  initialTile,
  existingChartTile,
  allowedMetrics,
  onBackToEditor,
}) => {
  const t = useEditPageTranslations();
  const resource = useUniverseResource();
  const dateRange = useAnalyticsCurrentDateRangeBundle();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [hydratedExistingByTileId, setHydratedExistingByTileId] = useState<{
    readonly tileId: string;
    readonly tile: ChartTileConfig;
  } | null>(null);
  const hydratedExistingTile =
    hydratedExistingByTileId !== null &&
    hydratedExistingByTileId.tileId === existingChartTile?.tileId
      ? hydratedExistingByTileId.tile
      : null;
  const {
    sidebarProps,
    metric,
    metricVariant,
    computedMetric,
    selectedChartType,
    breakdownDimensions,
    effectiveGranularity,
    overlayOption,
    benchmarkType,
    comparisonOffset,
    comparisonCustomStartDate,
    persistedSmoothingOption,
    customEventFilters,
    tableAdditionalColumns,
    dateRangeOptions,
    chartPreview,
  } = useChartEditorSidebarState({
    allowedMetrics,
    resource,
    dateRange,
    initialTile: existingChartTile,
  });

  // The surface only mounts once `existingChartTile` is resolved (the parent
  // guards the loading / not-found states), so the initializer captures the
  // persisted title directly — no post-mount sync effect is needed.
  const [chartTitle, setChartTitle] = useState(() => existingChartTile?.title ?? '');

  const {
    confirmedValue: confirmedChartTitle,
    status: chartTitleFilterStatus,
    isBlocked: isChartTitleBlocked,
  } = useTextFilterValidation(chartTitle, {
    initialConfirmedValue: existingChartTile?.title ?? '',
  });
  const chartTitleError = isChartTitleBlocked ? t.tileTitleBlockedError : undefined;
  const isChartTitlePending = chartTitleFilterStatus === 'pending';
  const pageTitle = isNewTile ? t.chartEditorAddHeadline : t.chartEditorHeadline;

  const filterDrawerDimensions = useMemo<TSupportedFilterBarDimensions[]>(() => {
    if (!metric) {
      return [];
    }
    const chartConfiguratorDimensions = getChartConfiguratorDimensions();
    const metricDimensions = chartConfiguratorDimensions[metric] ?? [];
    return Array.from(
      new Set(
        metricDimensions
          .filter((dim) => {
            if (dim === RAQIV2Dimension.CustomEventName) {
              return false;
            }
            if (dim === RAQIV2UIPseudoDimension.AggregationType && metric === customEventsMetric) {
              return false;
            }
            return true;
          })
          .flatMap((dim) => {
            const filterDim = getFilterBarDimensionForRAQIV2Dimension(dim);
            return filterDim ? [filterDim] : [];
          }),
      ),
    );
  }, [metric]);

  const onTileFiltersChange = useCallback(
    (filters: UIFilters, options?: UIFilterChangeOptions) => {
      sidebarProps.dispatch({ type: 'set-custom-event-filters', filters });
      if (!options?.hydrate || !existingChartTile) {
        return;
      }
      const placeFilter = filters.find((filter) => filter.dimension === RAQIV2Dimension.Place);
      setHydratedExistingByTileId({
        tileId: existingChartTile.tileId,
        tile: hydrateChartTilePlaceFilter(existingChartTile, placeFilter?.values ?? []),
      });
    },
    [existingChartTile, sidebarProps],
  );

  const chartContextApiMetrics = useMemo<TRAQIV2APIMetric[]>(
    () => getChartContextApiMetrics(chartPreview.chartSpec?.metric ?? null),
    [chartPreview.chartSpec],
  );

  const filterControlSlot = useMemo(() => {
    if (filterDrawerDimensions.length === 0) {
      return undefined;
    }
    return (
      <SourceMetricContextProvider metrics={chartContextApiMetrics}>
        <ExperienceAnalyticsPageFilterDrawerButton
          resource={resource}
          dimensions={filterDrawerDimensions}
          filters={customEventFilters}
          onFiltersChange={onTileFiltersChange}
          triggerVariant='plain'
        />
      </SourceMetricContextProvider>
    );
  }, [
    chartContextApiMetrics,
    customEventFilters,
    filterDrawerDimensions,
    onTileFiltersChange,
    resource,
  ]);

  const draftTile = useMemo(() => {
    if (!metric) {
      return null;
    }
    return buildChartTileFromEditor({
      tileId: initialTile.tileId,
      metric,
      metricVariant,
      computedMetric,
      chartType: selectedChartType,
      breakdownDimensions,
      granularity: effectiveGranularity,
      title: confirmedChartTitle,
      overlayOption,
      benchmarkType,
      comparisonOffset,
      comparisonCustomStartDate,
      smoothingOption: persistedSmoothingOption,
      filters: customEventFilters,
      tableAdditionalColumns,
      existing: existingChartTile ?? undefined,
    });
  }, [
    benchmarkType,
    breakdownDimensions,
    comparisonCustomStartDate,
    comparisonOffset,
    confirmedChartTitle,
    computedMetric,
    customEventFilters,
    effectiveGranularity,
    existingChartTile,
    initialTile.tileId,
    metric,
    metricVariant,
    overlayOption,
    persistedSmoothingOption,
    selectedChartType,
    tableAdditionalColumns,
  ]);
  const hasUnsavedChanges = useMemo(
    () =>
      hasChartTileEditorChanges({
        isNewTile,
        existingTile: hydratedExistingTile ?? existingChartTile,
        draftTile,
      }),
    [draftTile, existingChartTile, hydratedExistingTile, isNewTile],
  );

  const handleSave = useCallback(async () => {
    if (!draftTile || !metric || !hasUnsavedChanges) {
      return;
    }
    // `draftTile` is already the fully-built tile for the live editor state;
    // saving only needs to stamp the persisted tile id (mint a fresh one for a
    // new tile, reuse the existing one otherwise) rather than rebuild it.
    const tileId = mintChartTileIdForSave(isNewTile, existingChartTile?.tileId);
    const nextTile: ChartTileConfig = { ...draftTile, tileId };
    setIsSaving(true);
    setSaveError(null);
    try {
      const session =
        activeSession ?? (document ? createEditorWorkingCopyFromDocument(document) : null);
      if (!session) {
        throw new CustomDashboardNotFoundError(dashboardId);
      }

      const chartRows = getChartRows(session.config);
      const flatCount = flattenRows(chartRows).length;
      if (isNewTile && flatCount >= MAX_CHART_TILES_PER_DASHBOARD) {
        throw new Error(t.chartEditorMaxTilesError);
      }

      const nextConfig = isNewTile
        ? withChartRows(session.config, appendTileAsRow(chartRows, nextTile))
        : withChartRows(
            session.config,
            replaceTile(chartRows, existingChartTile?.tileId ?? '', nextTile),
          );
      const updatedSession = updateEditorWorkingCopy(session.draftId, {
        name: session.name,
        config: nextConfig,
      });
      if (!updatedSession) {
        throw new CustomDashboardNotFoundError(dashboardId);
      }
      setActiveSession(updatedSession);
      onBackToEditor(updatedSession.draftId);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[ChartEditorPageContent] save failed', error);
      }
      setSaveError(error);
    } finally {
      setIsSaving(false);
    }
  }, [
    activeSession,
    dashboardId,
    document,
    draftTile,
    existingChartTile,
    hasUnsavedChanges,
    isNewTile,
    metric,
    onBackToEditor,
    setActiveSession,
    t.chartEditorMaxTilesError,
  ]);

  const resolvedDateRangeOptions = useMemo(
    () => (dateRangeOptions.length > 0 ? dateRangeOptions : [...DefaultExploreModeDateRanges]),
    [dateRangeOptions],
  );
  const chartConfiguratorSidebarProps = useMemo(
    () => ({
      ...sidebarProps,
      titleControls: {
        value: chartTitle,
        onChange: setChartTitle,
        label: t.chartEditorTitleLabel,
        placeholder: t.chartEditorTitlePlaceholder,
        error: chartTitleError,
        maxLength: MAX_TILE_TITLE_LENGTH,
      },
    }),
    [
      chartTitle,
      chartTitleError,
      sidebarProps,
      t.chartEditorTitleLabel,
      t.chartEditorTitlePlaceholder,
    ],
  );

  return (
    <div className={`${styles.chartEditorRoot} flex flex-col gap-medium width-full min-width-0`}>
      <header className='flex flex-col gap-small'>
        <div className='flex flex-row items-center width-full gap-medium'>
          <IconButton
            icon='icon-regular-chevron-large-left'
            variant='Utility'
            size='Small'
            ariaLabel={t.chartEditorBackLabel}
            onClick={() => onBackToEditor()}
          />
          <div className='flex flex-row wrap items-center justify-between gap-medium grow-1 min-width-0'>
            <h1 className='text-heading-large content-emphasis margin-none'>{pageTitle}</h1>
            <div className='flex flex-row wrap gap-small'>
              <Button
                type='button'
                variant='Emphasis'
                size='Medium'
                onClick={() => {
                  handleSave().catch(() => undefined);
                }}
                isDisabled={
                  isSaving ||
                  isChartTitlePending ||
                  isChartTitleBlocked ||
                  !draftTile ||
                  !hasUnsavedChanges
                }>
                {t.chartEditorSaveLabel}
              </Button>
            </div>
          </div>
        </div>
        {saveError ? (
          <p className='text-body-small content-muted margin-none' role='alert'>
            {t.chartEditorSaveErrorLabel}
          </p>
        ) : null}
      </header>
      <ChartConfigurator
        sidebarProps={chartConfiguratorSidebarProps}
        className={styles.chartConfigurator}
        contentClassName={styles.chartConfiguratorContent}
        previewClassName='[grid-column:2] [grid-row:1] grow-1 min-width-0 min-height-0 padding-none'
        preview={
          <ChartConfiguratorPreview
            {...chartPreview}
            chartTitleLabel={confirmedChartTitle}
            dateRangeOptions={resolvedDateRangeOptions}
            filterControlSlot={filterControlSlot}
          />
        }
      />
    </div>
  );
};

const ChartEditorStatus: FC<{
  readonly children: React.ReactNode;
  readonly variant: 'status' | 'alert';
}> = ({ children, variant }) => {
  const className = 'flex flex-col items-center text-align-x-center padding-y-xlarge gap-small';
  if (variant === 'status') {
    return <output className={className}>{children}</output>;
  }
  return (
    <div role='alert' className={className}>
      {children}
    </div>
  );
};

export default ChartEditorPageContent;
