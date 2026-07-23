import { type FC, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useFlag } from '@rbx/flags';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  isClientScriptCpuTimeEnabled as isClientScriptCPUTimeEnabledFlag,
  isRotraceMetricEnabled as isRotraceMetricEnabledFlag,
} from '@generated/flags/creatorAnalytics';
import { isHomeAcquisitionSignalsEnabled as isHomeAcquisitionSignalsEnabledFlag } from '@generated/flags/gameDiscoveryServing';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import getEnabledChartConfiguratorMetrics from '@modules/experience-analytics-shared/chartConfigurator/getEnabledChartConfiguratorMetrics';
import { customEventsMetric } from '@modules/experience-analytics-shared/components/chartConfigurator/useChartConfiguratorSourceSelection';
import {
  filterBarDimensionToQueryKey,
  type UIFilterDimension,
} from '@modules/experience-analytics-shared/layout/ExperienceAnalyticsPageControlBar/filterUtils';
import InternalSandboxBanner from '../../components/InternalSandboxBanner';
import {
  CustomDashboardNotAvailableError,
  CustomDashboardNotFoundError,
  CustomDashboardVersionConflictError,
} from '../../errors';
import { customDashboardQueryKeys } from '../../hooks/customDashboardsQueryConfig';
import { getSummaryCards, withSummaryCards } from '../../layout/dashboardLayout';
import {
  useCanMutateCustomDashboards,
  useCustomDashboardService,
} from '../../service/CustomDashboardServiceProvider';
import {
  MAX_SUMMARY_CARDS_PER_DASHBOARD,
  SummaryCardTitleSource,
  type CustomDashboardDocument,
  type CustomDashboardConfig,
  type SummaryCardTileConfig,
  type TileId,
} from '../../types';
import { createTileId } from '../../utils/createTileId';
import { createDuplicateDashboardNameSuffixes } from '../../utils/duplicateDashboardNameSuffixes';
import { buildDuplicateDashboardName } from '../../utils/suggestDefaultName';
import {
  attachDashboardIdToWorkingCopy,
  deleteEditorWorkingCopy,
  getEditorWorkingCopy,
  NEW_DASHBOARD_ROUTE_ID,
  updateEditorWorkingCopy,
  type EditorWorkingCopy,
} from '../../workingCopy/editorWorkingCopy';
import {
  buildSummaryCardTileFromEditor,
  customEventFiltersToMetricVariant,
  mergeMetricVariantIntoFilters,
  normalizeSummaryCardEditorAggregation,
  selectionsToMetricVariant,
} from '../chartEditor/chartTileDraft';
import AddSummaryCardDialog, {
  type AddSummaryCardDialogValue,
} from './components/AddSummaryCardDialog';
import EditConflictDialog from './components/EditConflictDialog';
import EditPageCanvas from './components/EditPageCanvas';
import EditPageHeaderStack from './components/EditPageHeaderStack';
import { getDashboardDraftSignature, type DashboardDraft } from './hooks/dashboardDraftState';
import useDashboardDocumentQuery from './hooks/useDashboardDocumentQuery';
import useDashboardEditHistory from './hooks/useDashboardEditHistory';
import { persistExistingDashboardUpdate } from './persistExistingDashboardUpdate';
import { resolveActiveSession } from './resolveActiveSession';
import useEditPageTranslations from './useEditPageTranslations';

/**
 * Editor render-state machine: Loading / NotFound / NotAvailable / generic
 * error / Loaded. Sits inside `CustomDashboardsShell`.
 */
type EditPageContentProps = {
  readonly universeId: number;
  readonly dashboardId: string | undefined;
  readonly draftId: string | undefined;
  readonly onBackToManage: () => void;
  /** `tileId` is undefined for new chart tiles; special route ids select other editor modes. */
  readonly onOpenChartEditor: (tileId: string | undefined, draftId: string) => void;
  readonly onOpenPreview: (draftId: string) => void;
  readonly onOpenView: (dashboardId: string) => void;
  /**
   * Called once a working session exists whose `draftId` isn't yet reflected in
   * the route. The page mirrors it into the URL (shallow) so a refetch or a
   * full reload can re-attach to the same in-memory session instead of
   * rebuilding one from the server config (which would drop in-progress edits).
   */
  readonly onDraftSessionReady?: (draftId: string) => void;
};

function isUIFilterDimension(dimension: string): dimension is UIFilterDimension {
  return dimension in filterBarDimensionToQueryKey;
}

const EditPageContent: FC<EditPageContentProps> = ({
  universeId,
  dashboardId,
  draftId,
  onBackToManage,
  onOpenChartEditor,
  onOpenPreview,
  onOpenView,
  onDraftSessionReady,
}) => {
  const t = useEditPageTranslations();
  const service = useCustomDashboardService();
  const canMutateDashboards = useCanMutateCustomDashboards();
  const queryClient = useQueryClient();
  // Synchronous guard against a double-submit between the click and the
  // `isSaving` state flush; `isSaving` still drives the disabled UI.
  const publishInFlightRef = useRef(false);
  const baselineVersionRef = useRef(new Map<string, number | null>());
  const isNewDashboard = dashboardId === NEW_DASHBOARD_ROUTE_ID;
  const persistedDashboardId = isNewDashboard ? undefined : dashboardId;
  const documentQuery = useDashboardDocumentQuery(universeId, persistedDashboardId);
  const persistedDocument = documentQuery.data ?? null;
  const [activeSessionState, setActiveSession] = useState<EditorWorkingCopy | null>(() =>
    getEditorWorkingCopy(draftId),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>(null);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [summaryCardDialogMode, setSummaryCardDialogMode] = useState<
    { readonly type: 'add' } | { readonly type: 'edit'; readonly tileId: TileId } | null
  >(null);
  const { ready: isClientScriptCPUTimeReady, value: isClientScriptCPUTimeEnabledValue } = useFlag(
    isClientScriptCPUTimeEnabledFlag,
  );
  const { ready: isRotraceMetricReady, value: isRotraceMetricEnabledValue } = useFlag(
    isRotraceMetricEnabledFlag,
    {
      universeId,
    },
  );
  const isClientScriptCPUTimeEnabled =
    isClientScriptCPUTimeReady && isClientScriptCPUTimeEnabledValue;
  const isRotraceMetricEnabled = isRotraceMetricReady && isRotraceMetricEnabledValue;
  const { ready: isHomeAcquisitionSignalsReady, value: isHomeAcquisitionSignalsEnabledValue } =
    useFlag(isHomeAcquisitionSignalsEnabledFlag, {
      universeId,
    });
  const isHomeAcquisitionSignalsEnabled =
    isHomeAcquisitionSignalsReady && isHomeAcquisitionSignalsEnabledValue;
  const allowedMetrics = useMemo(() => {
    const metrics = getEnabledChartConfiguratorMetrics({
      isClientScriptCPUTimeEnabled,
      isRotraceMetricEnabled,
      isHomeAcquisitionSignalsEnabled,
    });
    if (!metrics.includes(customEventsMetric)) {
      return [...metrics, customEventsMetric];
    }
    return metrics;
  }, [isClientScriptCPUTimeEnabled, isRotraceMetricEnabled, isHomeAcquisitionSignalsEnabled]);
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const duplicateNameSuffixes = useMemo(
    () => createDuplicateDashboardNameSuffixes({ tPendingTranslation }),
    [tPendingTranslation],
  );
  const activeSession = resolveActiveSession({
    current: activeSessionState,
    draftId,
    isNewDashboard,
    persistedDocument,
  });
  if (activeSession !== activeSessionState) {
    setActiveSession(activeSession);
  }

  const persistedDraft = useMemo<DashboardDraft | null>(
    () =>
      activeSession
        ? {
            name: activeSession.name,
            config: activeSession.config,
          }
        : null,
    [activeSession],
  );
  const {
    draft: currentDraft,
    canUndo: canUndoDraft,
    canRedo: canRedoDraft,
    commitDraft,
    undoDraft,
    redoDraft,
  } = useDashboardEditHistory({
    historyKey: activeSession?.draftId ?? null,
    persistedDraft,
  });

  const activeSessionDraftSignature = useMemo(
    () =>
      activeSession
        ? getDashboardDraftSignature({
            name: activeSession.name,
            config: activeSession.config,
          })
        : null,
    [activeSession],
  );
  const currentDraftSignature = useMemo(
    () => (currentDraft ? getDashboardDraftSignature(currentDraft) : null),
    [currentDraft],
  );
  const renderedActiveSession = useMemo(
    () =>
      activeSession && currentDraft && currentDraftSignature !== activeSessionDraftSignature
        ? (updateEditorWorkingCopy(activeSession.draftId, currentDraft) ?? {
            ...activeSession,
            ...currentDraft,
          })
        : activeSession,
    [activeSession, activeSessionDraftSignature, currentDraft, currentDraftSignature],
  );
  if (renderedActiveSession !== activeSession) {
    setActiveSession(renderedActiveSession);
  }
  const activeSessionDashboardId = renderedActiveSession?.dashboardId;
  const activeSessionDraftId = renderedActiveSession?.draftId;

  useEffect(() => {
    if (
      !activeSessionDashboardId ||
      !activeSessionDraftId ||
      baselineVersionRef.current.has(activeSessionDraftId)
    ) {
      return undefined;
    }
    let cancelled = false;
    void service.getVersion(universeId, activeSessionDashboardId).then((version) => {
      if (!cancelled) {
        baselineVersionRef.current.set(activeSessionDraftId, version);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeSessionDashboardId, activeSessionDraftId, service, universeId]);

  // Mirror the live session's draftId into the URL so a reload / refetch can
  // re-attach to it (see `onDraftSessionReady`).
  useEffect(() => {
    if (activeSessionDraftId && activeSessionDraftId !== draftId) {
      onDraftSessionReady?.(activeSessionDraftId);
    }
  }, [activeSessionDraftId, draftId, onDraftSessionReady]);

  const draftConfig = currentDraft?.config ?? null;
  const draftDashboardName = currentDraft?.name ?? null;
  const getCurrentSummaryCards = useCallback(
    (config: CustomDashboardConfig) => getSummaryCards(config),
    [],
  );

  const handleRetry = useCallback(() => {
    documentQuery.refetch().catch(() => undefined);
  }, [documentQuery]);

  const handleAddSummaryCard = useCallback(() => {
    const currentConfig = draftConfig ?? persistedDocument?.config;
    if (!renderedActiveSession || !currentConfig) {
      return;
    }
    if (getCurrentSummaryCards(currentConfig).length >= MAX_SUMMARY_CARDS_PER_DASHBOARD) {
      return;
    }
    setSummaryCardDialogMode({ type: 'add' });
  }, [renderedActiveSession, draftConfig, getCurrentSummaryCards, persistedDocument?.config]);
  const handleEditSummaryCard = useCallback(
    (tileId: TileId) => {
      const currentConfig = draftConfig ?? persistedDocument?.config;
      if (
        !currentConfig ||
        !getCurrentSummaryCards(currentConfig).some((tile) => tile.tileId === tileId)
      ) {
        return;
      }
      setSummaryCardDialogMode({ type: 'edit', tileId });
    },
    [draftConfig, getCurrentSummaryCards, persistedDocument?.config],
  );
  const handleCancelSummaryCardDialog = useCallback(() => {
    setSummaryCardDialogMode(null);
  }, []);
  const handleConfirmSummaryCardDialog = useCallback(
    ({ title, titleSource, metric, aggregation, filters }: AddSummaryCardDialogValue) => {
      const currentConfig = draftConfig ?? persistedDocument?.config;
      const currentName = draftDashboardName ?? persistedDocument?.name;
      if (!renderedActiveSession || !currentConfig || !currentName || !summaryCardDialogMode) {
        return;
      }
      if (
        summaryCardDialogMode.type === 'add' &&
        getCurrentSummaryCards(currentConfig).length >= MAX_SUMMARY_CARDS_PER_DASHBOARD
      ) {
        return;
      }
      const currentSummaryCards = getCurrentSummaryCards(currentConfig);
      const existingSummaryCard =
        summaryCardDialogMode.type === 'edit'
          ? currentSummaryCards.find((tile) => tile.tileId === summaryCardDialogMode.tileId)
          : null;
      if (summaryCardDialogMode.type === 'edit' && !existingSummaryCard) {
        return;
      }
      const nextSummaryCard = buildSummaryCardTileFromEditor({
        tileId: existingSummaryCard?.tileId ?? createTileId(),
        title,
        titleSource,
        metric,
        metricVariant: customEventFiltersToMetricVariant(filters),
        aggregation,
        filters,
        existing: existingSummaryCard ?? undefined,
      });
      if (!nextSummaryCard) {
        return;
      }
      commitDraft({
        name: currentName,
        config: withSummaryCards(
          currentConfig,
          summaryCardDialogMode.type === 'edit'
            ? currentSummaryCards.map((tile) =>
                tile.tileId === summaryCardDialogMode.tileId ? nextSummaryCard : tile,
              )
            : [...currentSummaryCards, nextSummaryCard],
        ),
      });
      setSummaryCardDialogMode(null);
    },
    [
      commitDraft,
      renderedActiveSession,
      draftConfig,
      draftDashboardName,
      getCurrentSummaryCards,
      persistedDocument,
      summaryCardDialogMode,
    ],
  );
  const handleOpenChartEditor = useCallback(
    (tileId: string | undefined) => {
      if (!renderedActiveSession) {
        return;
      }
      onOpenChartEditor(tileId, renderedActiveSession.draftId);
    },
    [renderedActiveSession, onOpenChartEditor],
  );
  const handleAddChart = useCallback(
    () => handleOpenChartEditor(undefined),
    [handleOpenChartEditor],
  );
  const handleConfigChange = useCallback(
    (nextConfig: CustomDashboardConfig) => {
      const currentName = draftDashboardName ?? renderedActiveSession?.name;
      if (!renderedActiveSession || !currentName) {
        return;
      }
      commitDraft({
        name: currentName,
        config: nextConfig,
      });
    },
    [renderedActiveSession, commitDraft, draftDashboardName],
  );
  const handleRenameDashboard = useCallback(
    (nextName: string) => {
      if (!renderedActiveSession) {
        return;
      }
      const currentConfig = draftConfig ?? renderedActiveSession.config;
      const trimmedName = nextName.trim();
      commitDraft({
        name: trimmedName.length > 0 ? trimmedName : renderedActiveSession.name,
        config: currentConfig,
      });
    },
    [renderedActiveSession, commitDraft, draftConfig],
  );
  const handleCancel = useCallback(() => {
    deleteEditorWorkingCopy(activeSessionDraftId);
    onBackToManage();
  }, [activeSessionDraftId, onBackToManage]);
  const handleOpenPreview = useCallback(() => {
    if (!renderedActiveSession) {
      return;
    }
    onOpenPreview(renderedActiveSession.draftId);
  }, [renderedActiveSession, onOpenPreview]);

  const finishSuccessfulSave = useCallback(
    async (savedDocument: CustomDashboardDocument, sessionDraftId: string) => {
      queryClient.setQueryData(
        customDashboardQueryKeys.detail(universeId, savedDocument.id),
        savedDocument,
      );
      await queryClient.invalidateQueries({
        queryKey: customDashboardQueryKeys.detail(universeId, savedDocument.id),
      });
      await queryClient.invalidateQueries({
        queryKey: customDashboardQueryKeys.list(universeId),
      });
      baselineVersionRef.current.delete(sessionDraftId);
      deleteEditorWorkingCopy(sessionDraftId);
      setIsConflictDialogOpen(false);
      onOpenView(savedDocument.id);
    },
    [onOpenView, queryClient, universeId],
  );

  const persistExistingDraft = useCallback(
    async (
      draft: DashboardDraft,
      session: EditorWorkingCopy,
      mode: 'default' | 'overwrite' | 'save-as-new',
    ): Promise<CustomDashboardDocument> => {
      const actor = {
        userId: session.createdByUserId,
        username: session.createdByUsername,
      };
      if (mode === 'save-as-new') {
        const list = await service.list(universeId);
        const name = buildDuplicateDashboardName(
          list.items.map((item) => item.name),
          draft.name,
          duplicateNameSuffixes,
        );
        return service.createAndPublish({
          universeId,
          name,
          config: draft.config,
          createdByUserId: session.createdByUserId,
          createdByUsername: session.createdByUsername,
        });
      }
      const persistedId = session.dashboardId;
      if (!persistedId) {
        throw new Error('persistExistingDraft requires a persisted dashboard id');
      }
      const baselineVersion = baselineVersionRef.current.get(session.draftId) ?? null;
      const expectedVersion =
        mode === 'overwrite' || baselineVersion === null ? undefined : baselineVersion;
      // Omit unchanged name so API saves skip the metadata PATCH (content-only
      // publish). When a rename is included, sequence metadata then content —
      // ApiCustomDashboardService rejects combined name+config updates.
      const persistedName = persistedDocument?.name;
      const shouldUpdateName =
        persistedName === undefined || draft.name.trim() !== persistedName.trim();
      let savedDocument = await persistExistingDashboardUpdate(service, {
        universeId,
        dashboardId: persistedId,
        ...(shouldUpdateName ? { name: draft.name } : {}),
        config: draft.config,
        options: {
          ...(expectedVersion !== undefined ? { expectedVersion } : {}),
          actor,
        },
      });
      if (savedDocument.status !== 'published') {
        savedDocument = await service.publish(universeId, savedDocument.id);
      }
      return savedDocument;
    },
    [duplicateNameSuffixes, persistedDocument?.name, service, universeId],
  );

  const runConflictResolution = useCallback(
    (mode: 'overwrite' | 'save-as-new' | 'revert') => {
      const draft = currentDraft;
      if (!renderedActiveSession || !draft || isSaving || publishInFlightRef.current) {
        return;
      }
      publishInFlightRef.current = true;
      setIsSaving(true);
      setSaveError(null);
      const { draftId: sessionDraftId, dashboardId: persistedId } = renderedActiveSession;
      void (async () => {
        try {
          if (mode === 'revert') {
            if (!persistedId) {
              return;
            }
            const serverDocument = await service.get(universeId, persistedId);
            commitDraft({ name: serverDocument.name, config: serverDocument.config });
            updateEditorWorkingCopy(sessionDraftId, {
              name: serverDocument.name,
              config: serverDocument.config,
            });
            queryClient.setQueryData(
              customDashboardQueryKeys.detail(universeId, persistedId),
              serverDocument,
            );
            baselineVersionRef.current.set(
              sessionDraftId,
              await service.getVersion(universeId, persistedId),
            );
            setIsConflictDialogOpen(false);
            return;
          }
          const savedDocument = await persistExistingDraft(draft, renderedActiveSession, mode);
          await finishSuccessfulSave(savedDocument, sessionDraftId);
        } catch (error) {
          setSaveError(error);
        } finally {
          publishInFlightRef.current = false;
          setIsSaving(false);
        }
      })();
    },
    [
      currentDraft,
      commitDraft,
      finishSuccessfulSave,
      isSaving,
      persistExistingDraft,
      queryClient,
      renderedActiveSession,
      service,
      universeId,
    ],
  );

  const handlePublish = useCallback(() => {
    const draft = currentDraft;
    if (
      !canMutateDashboards ||
      !renderedActiveSession ||
      !draft ||
      isSaving ||
      publishInFlightRef.current
    ) {
      return;
    }
    publishInFlightRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    const { draftId: sessionDraftId } = renderedActiveSession;
    void (async () => {
      try {
        if (renderedActiveSession.dashboardId === null) {
          // Atomic create+publish so a failure can't strand a draft, and a
          // retry can't create a second dashboard.
          const savedDocument = await service.createAndPublish({
            universeId,
            name: draft.name,
            config: draft.config,
            createdByUserId: renderedActiveSession.createdByUserId,
            createdByUsername: renderedActiveSession.createdByUsername,
          });
          // Bind the new id to the live session right away: if anything after
          // this throws, a retry takes the update path below instead of
          // creating a duplicate.
          attachDashboardIdToWorkingCopy(sessionDraftId, savedDocument.id);
          setActiveSession((current) =>
            current && current.draftId === sessionDraftId
              ? { ...current, dashboardId: savedDocument.id }
              : current,
          );
          await finishSuccessfulSave(savedDocument, sessionDraftId);
          return;
        }
        const savedDocument = await persistExistingDraft(draft, renderedActiveSession, 'default');
        await finishSuccessfulSave(savedDocument, sessionDraftId);
      } catch (error) {
        if (error instanceof CustomDashboardVersionConflictError) {
          setIsConflictDialogOpen(true);
          return;
        }
        setSaveError(error);
      } finally {
        publishInFlightRef.current = false;
        setIsSaving(false);
      }
    })();
  }, [
    canMutateDashboards,
    currentDraft,
    finishSuccessfulSave,
    isSaving,
    persistExistingDraft,
    renderedActiveSession,
    service,
    universeId,
  ]);

  const renderConfig =
    draftConfig ?? renderedActiveSession?.config ?? persistedDocument?.config ?? null;
  const editingSummaryCard = useMemo<SummaryCardTileConfig | null>(() => {
    if (!summaryCardDialogMode || summaryCardDialogMode.type !== 'edit') {
      return null;
    }
    return (() => {
      const config = draftConfig ?? persistedDocument?.config;
      return config
        ? (getCurrentSummaryCards(config).find(
            (tile) => tile.tileId === summaryCardDialogMode.tileId,
          ) ?? null)
        : null;
    })();
  }, [draftConfig, getCurrentSummaryCards, persistedDocument, summaryCardDialogMode]);
  const summaryCardDialogInitialValue = useMemo(() => {
    if (!editingSummaryCard) {
      return undefined;
    }
    const metricKey = editingSummaryCard.metric.metricKey;
    const metric = metricKey && allowedMetrics.includes(metricKey) ? metricKey : null;
    const persistedVariant = selectionsToMetricVariant(editingSummaryCard.metric.variantSelections);
    const filters = mergeMetricVariantIntoFilters(
      editingSummaryCard.filters.flatMap((filter) => {
        if (!isUIFilterDimension(filter.dimension)) {
          return [];
        }
        return [
          {
            dimension: filter.dimension,
            values: [...filter.values],
          },
        ];
      }),
      persistedVariant,
    );
    return {
      title: editingSummaryCard.title,
      titleSource:
        editingSummaryCard.titleSource ??
        (editingSummaryCard.title ? SummaryCardTitleSource.Custom : SummaryCardTitleSource.Auto),
      metric,
      aggregation: normalizeSummaryCardEditorAggregation(editingSummaryCard.aggregation),
      filters,
    };
  }, [allowedMetrics, editingSummaryCard]);

  const hasUnsavedChanges = useMemo(() => {
    if (!currentDraft) {
      return false;
    }
    if (isNewDashboard || !persistedDocument) {
      return true;
    }
    return (
      getDashboardDraftSignature(currentDraft) !==
      getDashboardDraftSignature({
        name: persistedDocument.name,
        config: persistedDocument.config,
      })
    );
  }, [currentDraft, isNewDashboard, persistedDocument]);

  // Warn before a full unload (reload / tab close / external link) drops the
  // in-memory working copy. In-app editor navigation (preview, chart editor)
  // keeps the session alive via the module-level store, so it's intentionally
  // not guarded here; Cancel discards by design.
  useEffect(() => {
    if (!hasUnsavedChanges) {
      return undefined;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Returning a string is the cross-browser way to trigger the native
      // confirm prompt (the text itself is ignored by modern browsers).
      return t.unsavedChangesLabel;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, t.unsavedChangesLabel]);

  // Disabled queries report `isLoading: false` in RQ v5; `isPending` stays
  // true until the query is enabled. Treat unresolved route ids and pending
  // detail fetches as loading so chart-editor → edit navigation doesn't flash
  // the not-found state before `draftId` / document data resolve.
  const isDocumentLoading =
    dashboardId == null ||
    (!isNewDashboard &&
      (documentQuery.isPending || (documentQuery.isFetching && documentQuery.data === undefined)));

  const renderBody = (): ReactNode => {
    if (isDocumentLoading) {
      return (
        <output
          aria-busy='true'
          className='flex flex-col items-center text-align-x-center padding-y-xlarge gap-small'
        />
      );
    }
    if (isNewDashboard && !renderedActiveSession) {
      // Wait for the draft query param before declaring the session missing —
      // soft navigation from the chart editor can mount this page for a frame
      // before `router.query.draftId` is populated.
      if (draftId == null) {
        return (
          <output
            aria-busy='true'
            className='flex flex-col items-center text-align-x-center padding-y-xlarge gap-small'
          />
        );
      }
      return (
        <div
          role='alert'
          className='flex flex-col items-center text-align-x-center padding-y-xlarge gap-small'>
          <p className='text-heading-small content-emphasis margin-none'>{t.notFoundHeadline}</p>
          <p className='text-body-medium content-muted margin-none max-width-[520px]'>
            {t.notFoundDescription}
          </p>
          <Button variant='Emphasis' size='Medium' onClick={onBackToManage}>
            {t.notFoundCtaLabel}
          </Button>
        </div>
      );
    }
    // A live working copy wins over a transient document query error (e.g.
    // returning from the chart editor while the detail query re-attaches).
    if (documentQuery.isError && !renderedActiveSession) {
      const { error } = documentQuery;
      if (error instanceof CustomDashboardNotFoundError) {
        return (
          <div
            role='alert'
            className='flex flex-col items-center text-align-x-center padding-y-xlarge gap-small'>
            <p className='text-heading-small content-emphasis margin-none'>{t.notFoundHeadline}</p>
            <p className='text-body-medium content-muted margin-none max-width-[520px]'>
              {t.notFoundDescription}
            </p>
            <Button variant='Emphasis' size='Medium' onClick={onBackToManage}>
              {t.notFoundCtaLabel}
            </Button>
          </div>
        );
      }
      if (error instanceof CustomDashboardNotAvailableError) {
        return (
          <div
            role='alert'
            className='flex flex-col items-center text-align-x-center padding-y-xlarge gap-small'>
            <p className='text-heading-small content-emphasis margin-none'>
              {t.notAvailableHeadline}
            </p>
          </div>
        );
      }
      return (
        <div
          role='alert'
          className='flex flex-col items-center text-align-x-center padding-y-xlarge gap-small'>
          <p className='text-body-medium content-muted margin-none'>{t.loadErrorHeadline}</p>
          <Button variant='Standard' size='Small' onClick={handleRetry}>
            {t.loadErrorRetryLabel}
          </Button>
        </div>
      );
    }
    if (!canMutateDashboards || persistedDocument?.hybridOrigin === 'server') {
      return (
        <div
          role='alert'
          className='flex flex-col items-center text-align-x-center padding-y-xlarge gap-small'>
          <p className='text-heading-small content-emphasis margin-none'>
            {t.serverEditBlockedHeadline}
          </p>
          <p className='text-body-medium content-muted margin-none max-width-[520px]'>
            {t.serverEditBlockedDescription}
          </p>
          <Button variant='Emphasis' size='Medium' onClick={onBackToManage}>
            {t.serverEditBlockedCtaLabel}
          </Button>
        </div>
      );
    }
    if (!renderConfig) {
      // Route param not resolved yet.
      return null;
    }
    return (
      <EditPageCanvas
        config={renderConfig}
        onConfigChange={handleConfigChange}
        onAddSummaryCard={handleAddSummaryCard}
        onAddChart={handleAddChart}
        onEditSummaryCard={handleEditSummaryCard}
        onEditChart={handleOpenChartEditor}
        canUndo={canUndoDraft}
        canRedo={canRedoDraft}
        onUndo={undoDraft}
        onRedo={redoDraft}
      />
    );
  };

  return (
    <>
      <div className='flex flex-col gap-medium'>
        <InternalSandboxBanner />
        <EditPageHeaderStack
          dashboardName={draftDashboardName}
          createdByUsername={
            renderedActiveSession
              ? renderedActiveSession.createdByUsername || t.unknownCreatorLabel
              : null
          }
          hasUnsavedChanges={canMutateDashboards && hasUnsavedChanges}
          isSaving={isSaving}
          saveError={saveError}
          canRename={canMutateDashboards && persistedDocument?.hybridOrigin !== 'server'}
          onCancel={handleCancel}
          onPreview={handleOpenPreview}
          onPublish={handlePublish}
          primaryActionLabel={isNewDashboard ? t.publishButtonLabel : t.saveChangesButtonLabel}
          onRenameDashboard={handleRenameDashboard}
        />
        {renderBody()}
      </div>
      {summaryCardDialogMode ? (
        <AddSummaryCardDialog
          key={
            summaryCardDialogMode.type === 'edit'
              ? `edit-${summaryCardDialogMode.tileId}`
              : 'add-summary-card'
          }
          allowedMetrics={allowedMetrics}
          mode={summaryCardDialogMode.type}
          initialValue={summaryCardDialogInitialValue}
          onCancel={handleCancelSummaryCardDialog}
          onConfirm={handleConfirmSummaryCardDialog}
        />
      ) : null}
      <EditConflictDialog
        open={isConflictDialogOpen}
        isSubmitting={isSaving}
        onClose={() => setIsConflictDialogOpen(false)}
        onRevert={() => runConflictResolution('revert')}
        onSaveAsNew={() => runConflictResolution('save-as-new')}
        onOverwrite={() => runConflictResolution('overwrite')}
      />
    </>
  );
};

export default EditPageContent;
