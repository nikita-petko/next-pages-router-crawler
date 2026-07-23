import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
  FeedbackBanner,
  Icon,
  IconButton,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  translationKey,
  useTranslationWrapper,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { EmptyGrid, EmptyState } from '@modules/miscellaneous/common';
import { Alert, CircularProgress, Snackbar } from '@rbx/ui';
import { RAQIV2ChartResourceType } from '@modules/clients/analytics';
import {
  AnalyticsFlagGatedContext,
  makeRAQIV2Request,
  useBestSupportedChartResourceOfTypes,
  useRAQIV2Client,
  useUniverseResource,
} from '@modules/experience-analytics-shared';
import {
  CreatorConfigsPublicApiConfigValueFull,
  getConfigRepositoryFull,
  updateDraft,
  publishDraft,
} from '@modules/clients/creatorConfigsPublicApi';
import type { RAQIV2MetricValue } from '@modules/clients/analytics';
import {
  RAQIV2Dimension,
  RAQIV2Metric,
  RAQIV2MetricGranularity,
} from '@rbx/creator-hub-analytics-config';
import generateRecommendationServiceSnippet from './utils/generateRecommendationServiceSnippet';
import { getNextLastUpdatedByKey, type LastUpdatedCacheEntry } from './utils/lastUpdatedCache';
import {
  buildDisplayRows,
  type SortColumn,
  type SortDirection,
  type SortState,
} from './utils/displayRows';
import styles from './RecommendationServiceConfigsLandingContent.module.css';

const isRecommendationServiceBaseTemplate = (value: unknown): boolean => {
  switch (value) {
    case 'MaximizeEngagement':
    case 'RecentlyAdded':
    case 'PlayerSpecific':
      return true;
    default:
      return false;
  }
};

type RecommendationServiceConfigsLandingContentProps = {
  experienceId: string;
  onCreate: () => void;
  createLabel: string;
  emptyTitle: string;
  emptyDescription: string;
};

const RecommendationServicesConfigsLandingInner: FC<
  RecommendationServiceConfigsLandingContentProps
> = ({ experienceId, onCreate, createLabel, emptyTitle, emptyDescription }) => {
  const router = useRouter();
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { id: universeId, isLoading: isUniverseLoading } = useUniverseResource();
  const queryClient = useQueryClient();
  const { client: raqiClient } = useRAQIV2Client(false);
  const universeResource = useBestSupportedChartResourceOfTypes([RAQIV2ChartResourceType.Universe]);
  const configsRepository = 'RecommendationServicesConfig' as const;

  const universeIdString = useMemo(() => {
    if (universeId == null) return null;
    return String(universeId);
  }, [universeId]);

  const lastUpdatedStorageKey = `creator-hub::recommendation-service::configs-last-updated::${universeIdString ?? 'unknown'}`;

  const isLastUpdatedStorageEnabled = universeIdString != null;

  const [lastUpdatedByKey, setLastUpdatedByKey] = useLocalStorage<
    Record<string, LastUpdatedCacheEntry>
  >(lastUpdatedStorageKey, {});

  const sortStorageKey = `creator-hub::recommendation-service::configs-sort::${universeIdString ?? 'unknown'}`;

  const [sortState, setSortState] = useLocalStorage<SortState>(sortStorageKey, {
    column: 'name',
    direction: 'asc',
  });

  const combosTimeSpec = useMemo(() => {
    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setDate(startTime.getDate() - 90);
    return {
      startTime,
      endTime,
      snapGranularity: RAQIV2MetricGranularity.OneDay,
    };
  }, []);

  const {
    data: repositoryFull,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['creator-configs-public', universeIdString, configsRepository, 'full'],
    enabled: Boolean(universeIdString) && !isUniverseLoading,
    queryFn: async () => {
      if (!universeIdString) return null;
      return getConfigRepositoryFull({
        universeId: universeIdString,
        repository: configsRepository,
      });
    },
    retry: 1,
  });

  const { data: analyticsCombosResponse } = useQuery({
    queryKey: [
      'analytics-raqi-v2',
      'recommendation-service',
      'config-location-combos',
      universeResource?.type,
      universeResource?.id,
    ],
    enabled: Boolean(universeResource?.id) && !universeResource.isLoading,
    queryFn: async () => {
      try {
        const response = await makeRAQIV2Request(
          {
            resource: universeResource,
            metric: RAQIV2Metric.RecommendationDau,
            granularity: RAQIV2MetricGranularity.OneDay,
            breakdown: [RAQIV2Dimension.LocationId, RAQIV2Dimension.ConfigName],
            timeSpec: combosTimeSpec,
            limit: 10000,
          },
          raqiClient,
          { allowComputedMetrics: false },
        );
        return response;
      } catch {
        return null;
      }
    },
    retry: 0,
    staleTime: 1000 * 60 * 10,
  });

  const locationsByConfigName = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const values: RAQIV2MetricValue[] = analyticsCombosResponse?.response?.values ?? [];
    values.forEach(({ breakdownValue }) => {
      const configName = breakdownValue?.find(
        ({ dimension }) => dimension === RAQIV2Dimension.ConfigName,
      )?.value;
      const locationId = breakdownValue?.find(
        ({ dimension }) => dimension === RAQIV2Dimension.LocationId,
      )?.value;
      if (typeof configName !== 'string' || configName.length === 0) return;
      if (typeof locationId !== 'string' || locationId.length === 0) return;
      const set = map.get(configName) ?? new Set<string>();
      set.add(locationId);
      map.set(configName, set);
    });

    return map;
  }, [analyticsCombosResponse?.response?.values]);

  const headerName = translate(
    translationKey('Label.Dimension.ConfigName', TranslationNamespace.RecommendationService),
  );
  const headerLocationIds = translate(
    translationKey('Label.Dimension.LocationId', TranslationNamespace.RecommendationService),
  );
  const headerUpdatedOn = translate(
    translationKey(
      'Title.Table.LastUpdated',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  const editTooltip = translate(
    translationKey('Action.Edit', TranslationNamespace.UniverseConfigAndExperimentation),
  );
  const moreActionsLabel = translate(
    translationKey('Title.Table.Actions', TranslationNamespace.UniverseConfigAndExperimentation),
  );

  const goToEditWizard = useCallback(
    (key: string) => {
      router
        .push({
          pathname: '/dashboard/creations/experiences/[id]/recommendation-service/edit',
          query: { id: experienceId, key },
        })
        .catch(() => undefined);
    },
    [experienceId, router],
  );

  const [actionsMenu, setActionsMenu] = useState<{
    key: string;
    anchorRect: DOMRect;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(0);

  const closeActionsMenu = useCallback(() => {
    setActionsMenu(null);
  }, []);

  useEffect(() => {
    if (!actionsMenu) return () => {};

    const handleClickOutside = (event: MouseEvent) => {
      if (event.target !== null && !(event.target instanceof Node)) return;
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      closeActionsMenu();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [actionsMenu, closeActionsMenu]);

  useEffect(() => {
    if (!actionsMenu) return;
    if (!menuRef.current) return;
    setMenuHeight(menuRef.current.offsetHeight);
  }, [actionsMenu]);

  const openActionsMenu = useCallback((key: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActionsMenu({ key, anchorRect: rect });
  }, []);

  const positionStyle: Pick<React.CSSProperties, 'top' | 'left' | 'transform'> = useMemo(() => {
    if (!actionsMenu) return {};
    const { anchorRect } = actionsMenu;
    const shouldAppearBelow =
      anchorRect.bottom + menuHeight <= window.innerHeight - 8; /* small margin */
    return {
      top: shouldAppearBelow ? anchorRect.bottom : anchorRect.top - menuHeight,
      left: anchorRect.right,
      transform: 'translateX(-100%)',
    };
  }, [actionsMenu, menuHeight]);

  const deleteLabel = tPendingTranslation(
    'Delete',
    'Context menu action to delete a recommendation service config',
    translationKey('Action.Delete', TranslationNamespace.Controls),
  );
  const copySnippetLabel = tPendingTranslation(
    'Copy code snippet',
    'Context menu action to copy the Luau code snippet for a config',
    translationKey('Menu.CopyCodeSnippet', TranslationNamespace.RecommendationService),
  );
  const previewJsonLabel = tPendingTranslation(
    'Preview JSON',
    'Context menu action to preview the JSON representation of a config',
    translationKey('Menu.PreviewJson', TranslationNamespace.RecommendationService),
  );

  const [deleteDialogKey, setDeleteDialogKey] = useState<string | null>(null);
  const [previewDialogKey, setPreviewDialogKey] = useState<string | null>(null);
  const previewDialogTitle = tPendingTranslation(
    'Preview JSON',
    'Title of the dialog that displays the JSON preview of a config',
    translationKey('Dialog.PreviewJson.Title', TranslationNamespace.RecommendationService),
  );
  const deleteDialogTitle = tPendingTranslation(
    'Delete',
    'Title of the confirmation dialog for deleting a config',
    translationKey('Dialog.Delete.Title', TranslationNamespace.RecommendationService),
  );
  const deleteDialogDescription = tPendingTranslation(
    'This will permanently delete this configuration.',
    'Warning text in the delete confirmation dialog',
    translationKey('Dialog.Delete.Description', TranslationNamespace.RecommendationService),
  );
  const cancelLabel = tPendingTranslation(
    'Cancel',
    'Button to dismiss the delete confirmation dialog without deleting',
    translationKey('Action.Cancel', TranslationNamespace.Controls),
  );
  const closeLabel = tPendingTranslation(
    'Close',
    'Button to close the JSON preview dialog',
    translationKey('Action.Close', TranslationNamespace.Controls),
  );

  const [isCopyToastOpen, setIsCopyToastOpen] = useState(false);
  const [copyToastKey, setCopyToastKey] = useState(0);
  const copySuccessToastMessage = tPendingTranslation(
    'Code snippet copied successfully',
    'Toast notification shown after the code snippet is copied to clipboard',
    translationKey('Toast.SnippetCopied', TranslationNamespace.RecommendationService),
  );

  const deleteMutation = useMutation({
    mutationFn: async (key: string) => {
      if (!universeIdString) throw new Error('Missing universeId');
      const repository = configsRepository;

      // Published entries can't be hard-deleted; represent deletion by setting to null.
      // Patch the single key so other configs keep their lastModifiedTime.
      const updateResponse = await updateDraft(
        { universeId: universeIdString, repository },
        { entries: { [key]: null } },
      );
      const { draftHash } = updateResponse;
      if (!draftHash) throw new Error('Missing draftHash');

      await publishDraft(
        { universeId: universeIdString, repository },
        {
          draftHash,
          message: `Deleted config ${key} through creator-hub`,
          deploymentStrategy: 'Immediate',
        },
      );

      // Optimistically remove from cached /full so it disappears immediately.
      queryClient.setQueryData(
        ['creator-configs-public', universeIdString, configsRepository, 'full'],
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const oldRepo = old as {
            entries?: Record<string, CreatorConfigsPublicApiConfigValueFull> | null;
          };
          const entries = oldRepo.entries ?? null;
          if (!entries || typeof entries !== 'object') return old;
          if (!Object.prototype.hasOwnProperty.call(entries, key)) return old;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- omit deleted key
          const { [key]: _deleted, ...rest } = entries;
          return { ...(old as object), entries: rest };
        },
      );

      await queryClient.invalidateQueries({
        queryKey: ['creator-configs-public', universeIdString, configsRepository, 'full'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['creator-configs-public', universeIdString, configsRepository, 'values'],
      });
      await refetch();
    },
  });

  const onCopySnippet = useCallback((key: string) => {
    const snippetText = generateRecommendationServiceSnippet(key);
    navigator.clipboard
      .writeText(snippetText)
      .then(() => {
        setCopyToastKey((prev) => prev + 1);
        setIsCopyToastOpen(true);
      })
      .catch(() => undefined);
  }, []);

  const previewJsonText = useMemo(() => {
    if (!previewDialogKey) return '';
    const entries = repositoryFull?.entries ?? null;
    if (!entries || typeof entries !== 'object') return '';
    if (!Object.prototype.hasOwnProperty.call(entries, previewDialogKey)) return '';
    const entry = (entries as Record<string, CreatorConfigsPublicApiConfigValueFull>)[
      previewDialogKey
    ];
    const raw = entry?.value ?? null;
    if (raw == null) return '';

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw) as unknown;
        return JSON.stringify(parsed, null, 2);
      } catch {
        return raw;
      }
    }

    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }, [previewDialogKey, repositoryFull?.entries]);

  const dateTimeFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, []);

  const formatDateTime = useCallback(
    (isoDateString: string | undefined): string => {
      if (!isoDateString) return '';
      const date = new Date(isoDateString);
      if (Number.isNaN(date.getTime())) return '';
      return dateTimeFormatter.format(date);
    },
    [dateTimeFormatter],
  );

  const allEntries = useMemo<
    Array<{ key: string; value: CreatorConfigsPublicApiConfigValueFull }>
  >(() => {
    const entriesMap = repositoryFull?.entries ?? null;
    if (!entriesMap) return [];

    return Object.entries(entriesMap)
      .filter(([, value]) => value.value != null)
      .map(([key, value]) => ({
        key,
        value,
      }));
  }, [repositoryFull?.entries]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isLastUpdatedStorageEnabled) return;
    const entriesMap = repositoryFull?.entries ?? null;
    if (!entriesMap) return;

    setLastUpdatedByKey((prev) => {
      return getNextLastUpdatedByKey(prev, entriesMap);
    });
  }, [isLastUpdatedStorageEnabled, repositoryFull?.entries, setLastUpdatedByKey]);

  const recommendationServiceEntries = useMemo(() => {
    const parseIfJsonLike = (value: unknown): unknown => {
      if (typeof value !== 'string') return null;
      try {
        return JSON.parse(value) as unknown;
      } catch {
        return null;
      }
    };

    return allEntries.filter(({ value }) => {
      let parsed: unknown = value.value ?? null;
      if (typeof parsed === 'string') {
        parsed = parseIfJsonLike(parsed);
      }

      const isRecommendationServicesConfig = (obj: Record<string, unknown>): boolean => {
        // New shape: flattened config stored directly.
        const baseTemplate = obj.base_template;
        return isRecommendationServiceBaseTemplate(baseTemplate);
      };

      return (
        typeof parsed === 'object' &&
        parsed != null &&
        isRecommendationServicesConfig(parsed as Record<string, unknown>)
      );
    });
  }, [allEntries]);

  const displayEntries =
    recommendationServiceEntries.length > 0 ? recommendationServiceEntries : allEntries;

  const toggleSort = useCallback(
    (column: SortColumn) => {
      const defaultDirection: SortDirection = column === 'lastUpdated' ? 'desc' : 'asc';
      const oppositeDirection: SortDirection = defaultDirection === 'asc' ? 'desc' : 'asc';
      setSortState((prev) => {
        if (prev.column !== column) {
          return { column, direction: defaultDirection };
        }
        if (prev.direction === defaultDirection) {
          return { column, direction: oppositeDirection };
        }
        // opposite -> unsorted
        return { column: null, direction: defaultDirection };
      });
    },
    [setSortState],
  );

  const displayRows = useMemo(() => {
    return buildDisplayRows({
      displayEntries,
      locationsByConfigName,
      sortState,
      lastUpdatedByKey,
    });
  }, [displayEntries, lastUpdatedByKey, locationsByConfigName, sortState]);

  if (isUniverseLoading || isLoading) {
    return (
      <EmptyGrid>
        <CircularProgress data-testid='loading' />
      </EmptyGrid>
    );
  }

  if (isError) {
    const errorTitle = translate(
      translationKey('Response.UnknownError', TranslationNamespace.Error),
    );
    const tryAgain = translate(
      translationKey('Action.FailedToLoadPage', TranslationNamespace.Error),
    );
    return (
      <div className='flex flex-col gap-medium padding-xlarge'>
        <FeedbackBanner severity='Error' layout='Inline' title={errorTitle} />
        <div>
          <Button variant='Standard' size='Small' onClick={() => refetch().catch(() => undefined)}>
            {tryAgain}
          </Button>
        </div>
      </div>
    );
  }

  if (displayRows.length === 0) {
    return (
      <div className='bg-surface-400 radius-large overflow-hidden'>
        <div
          className={`flex flex-col items-center justify-center padding-xlarge ${styles.emptyStateContainer}`}>
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            size='small'
            illustration='videos'>
            <Button variant='Standard' size='Medium' onClick={onCreate}>
              {createLabel}
            </Button>
          </EmptyState>
        </div>
      </div>
    );
  }

  const sortIndicatorFor = (column: SortColumn): React.ReactNode => {
    if (sortState.column !== column) return null;
    return (
      <Icon
        name={
          sortState.direction === 'asc'
            ? 'icon-regular-arrow-small-up'
            : 'icon-regular-arrow-small-down'
        }
        size='XSmall'
      />
    );
  };
  const nameSortIndicator = sortIndicatorFor('name');
  const locationSortIndicator = sortIndicatorFor('locationId');
  const updatedSortIndicator = sortIndicatorFor('lastUpdated');

  return (
    <div className='bg-surface-400 radius-large overflow-hidden'>
      <div className='border border-stroke-default radius-large overflow-hidden'>
        <div
          className={`grid bg-surface-200 border-b border-stroke-default ${styles.configsGrid} ${styles.gridHeaderShadow}`}>
          <button
            type='button'
            className={`padding-medium text-title-medium content-emphasis flex items-center gap-xsmall text-left ${styles.resetButton}`}
            onClick={() => toggleSort('name')}>
            <span>{headerName}</span>
            <span className='content-muted' aria-hidden='true'>
              {nameSortIndicator}
            </span>
          </button>
          <button
            type='button'
            className={`padding-medium text-title-medium content-emphasis flex items-center gap-xsmall text-left ${styles.resetButton}`}
            onClick={() => toggleSort('locationId')}>
            <span>{headerLocationIds}</span>
            <span className='content-muted' aria-hidden='true'>
              {locationSortIndicator}
            </span>
          </button>
          <button
            type='button'
            className={`padding-medium text-title-medium content-emphasis flex items-center gap-xsmall text-left ${styles.resetButton}`}
            onClick={() => toggleSort('lastUpdated')}>
            <span>{headerUpdatedOn}</span>
            <span className='content-muted' aria-hidden='true'>
              {updatedSortIndicator}
            </span>
          </button>
          <div className='padding-medium' />
        </div>

        {displayRows.map(({ rowKey, key, locationId, value }) => {
          const lastUpdatedIso = lastUpdatedByKey[key]?.updatedAtIso ?? value.lastModifiedTime;
          return (
            <div
              key={rowKey}
              className={`group grid items-center border-b border-stroke-default ${styles.configsGrid}`}>
              <div className='padding-medium text-body-medium content-emphasis text-left truncate'>
                {key}
              </div>
              <div className='padding-medium text-body-medium content-muted text-left truncate'>
                {locationId}
              </div>
              <div className='padding-medium text-body-medium content-muted'>
                {formatDateTime(lastUpdatedIso)}
              </div>
              <div className='padding-medium flex justify-end'>
                <div className='flex gap-xsmall opacity-0 group-hover:opacity-100'>
                  <Tooltip position='bottom-end' title={editTooltip}>
                    <TooltipTrigger asChild>
                      <IconButton
                        variant='Utility'
                        size='Small'
                        icon='icon-regular-pencil'
                        ariaLabel={editTooltip}
                        onClick={() => goToEditWizard(key)}
                      />
                    </TooltipTrigger>
                  </Tooltip>
                  <IconButton
                    variant='Utility'
                    size='Small'
                    icon='icon-regular-three-dots-vertical'
                    ariaLabel={moreActionsLabel}
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => openActionsMenu(key, e)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {actionsMenu ? (
        <div ref={menuRef} className='fixed z-50' style={positionStyle}>
          <div
            role='menu'
            className={`bg-surface-200 border border-stroke-default radius-large flex flex-col ${styles.actionsMenuPanel}`}>
            <button
              type='button'
              role='menuitem'
              className={`flex w-full items-center text-body-small content-emphasis text-left radius-medium hover:bg-surface-300 outline-none ${styles.resetButton} ${styles.menuItemButton}`}
              onClick={() => {
                setPreviewDialogKey(actionsMenu.key);
                closeActionsMenu();
              }}>
              {previewJsonLabel}
            </button>
            <button
              type='button'
              role='menuitem'
              className={`flex w-full items-center text-body-small content-emphasis text-left radius-medium hover:bg-surface-300 outline-none ${styles.resetButton} ${styles.menuItemButton}`}
              onClick={() => {
                onCopySnippet(actionsMenu.key);
                closeActionsMenu();
              }}>
              {copySnippetLabel}
            </button>
            <button
              type='button'
              role='menuitem'
              className={`flex w-full items-center text-body-small content-system-alert text-left radius-medium hover:bg-surface-300 outline-none ${styles.resetButton} ${styles.menuItemButton}`}
              onClick={() => {
                setDeleteDialogKey(actionsMenu.key);
                closeActionsMenu();
              }}>
              {deleteLabel}
            </button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={previewDialogKey != null}
        type='Default'
        size='Medium'
        isModal
        onOpenChange={(open) => {
          if (!open) setPreviewDialogKey(null);
        }}
        hasCloseAffordance
        closeLabel={closeLabel}>
        <DialogContent>
          <DialogBody className='flex flex-col gap-medium'>
            <DialogTitle className='text-heading-medium margin-none'>
              {previewDialogTitle}
            </DialogTitle>
            <pre
              className={`text-body-small content-default bg-surface-200 border border-stroke-default radius-large overflow-auto ${styles.previewJsonPre}`}>
              {previewJsonText}
            </pre>
          </DialogBody>
          <DialogFooter className='flex gap-x-small'>
            <Button
              variant='Standard'
              className='fill basis-0'
              onClick={() => setPreviewDialogKey(null)}>
              {closeLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogKey != null}
        type='Default'
        size='Small'
        isModal
        onOpenChange={(open) => {
          if (!open) setDeleteDialogKey(null);
        }}
        hasCloseAffordance
        closeLabel={cancelLabel}>
        <DialogContent>
          <DialogBody className='flex flex-col gap-medium'>
            <DialogTitle className='text-heading-medium margin-none'>
              {deleteDialogTitle}
            </DialogTitle>
            <div className='text-body-medium content-default'>{deleteDialogDescription}</div>
          </DialogBody>
          <DialogFooter className='flex gap-x-small'>
            <Button
              variant='Standard'
              className='fill basis-0'
              onClick={() => setDeleteDialogKey(null)}
              isDisabled={deleteMutation.isPending}>
              {cancelLabel}
            </Button>
            <Button
              variant='Emphasis'
              className='fill basis-0'
              onClick={() => {
                if (!deleteDialogKey) return;
                deleteMutation.mutate(deleteDialogKey, {
                  onSettled: () => setDeleteDialogKey(null),
                });
              }}
              isLoading={deleteMutation.isPending}>
              {deleteLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Snackbar
        key={copyToastKey}
        open={isCopyToastOpen}
        autoHide
        onClose={() => setIsCopyToastOpen(false)}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}>
        <Alert variant='standard' severity='success' className={styles.copyToastAlert}>
          {copySuccessToastMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

const RecommendationServiceConfigsLandingContent: FC<
  RecommendationServiceConfigsLandingContentProps
> = (props) => {
  return (
    <AnalyticsFlagGatedContext flag='recommendationServicesConfigEnabled'>
      <RecommendationServicesConfigsLandingInner {...props} />
    </AnalyticsFlagGatedContext>
  );
};

export default withNamespaceSwitchedTranslation(RecommendationServiceConfigsLandingContent, [
  TranslationNamespace.RecommendationService,
  TranslationNamespace.Controls,
  TranslationNamespace.UniverseConfigAndExperimentation,
  TranslationNamespace.Error,
]);
