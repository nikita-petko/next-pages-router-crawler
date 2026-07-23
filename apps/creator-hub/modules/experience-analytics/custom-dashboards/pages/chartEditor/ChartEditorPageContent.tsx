import React, { type FC, useCallback, useMemo, useState } from 'react';
import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import { Button, IconButton } from '@rbx/foundation-ui';
import { useAnalyticsCurrentDateRangeBundle } from '@modules/charts-generic/context/AnalyticsQueryDateRangeBundleContext';
import { AnnotationType } from '@modules/clients/analytics/annotations/annotations';
import { getSharedChartConfiguratorDimensions } from '@modules/experience-analytics-shared/chartConfigurator/ChartConfiguratorDimensions';
import type { TChartConfiguratorMetrics } from '@modules/experience-analytics-shared/chartConfigurator/chartConfiguratorMetricsConfig';
import { DefaultExploreModeDateRanges } from '@modules/experience-analytics-shared/chartConfigurator/resolveChartConfiguratorComputedMetricSources';
import ChartConfigurator from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfigurator';
import ChartConfiguratorPreview from '@modules/experience-analytics-shared/components/chartConfigurator/ChartConfiguratorPreview';
import { AnalyticsContextLayerInnerProvider } from '@modules/experience-analytics-shared/context/AnalyticsContextLayerProvider';
import { UniversePerformanceRaqiClientProvider } from '@modules/experience-analytics-shared/context/UniversePerformanceRaqiClientProvider';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useTextFilterValidation from '@modules/experience-analytics-shared/text-filter/useTextFilterValidation';
import type {
  AnalyticsPageConfigAnnotationOptions,
  AnalyticsPageConfigDateOptions,
  CreatorAnalyticsPageSurfaceConfig,
} from '@modules/experience-analytics-shared/types/RAQIV2PageConfig';
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
  findChartTileInConfig,
  isNewChartTileRoute,
  mintChartTileIdForSave,
} from './chartTileDraft';
import useChartEditorSidebarState from './useChartEditorSidebarState';
import styles from './ChartEditorPageContent.module.css';

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
  showAnnotationsControl: true,
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
      surfaceAnnotationOptions: exploreSurfaceAnnotationOptions,
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
  const {
    sidebarProps,
    metric,
    metricVariant,
    computedMetric,
    selectedChartType,
    breakdownDimension,
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
      breakdownDimension,
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
    breakdownDimension,
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
        existingTile: existingChartTile,
        draftTile,
      }),
    [draftTile, existingChartTile, isNewTile],
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
