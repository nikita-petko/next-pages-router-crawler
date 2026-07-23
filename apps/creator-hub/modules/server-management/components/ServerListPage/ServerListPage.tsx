import type { ChangeEvent, FunctionComponent } from 'react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import type {
  PlaceFilter,
  RestartsLaunchRestartRequest,
} from '@rbx/client-server-management-service/v1';
import { TextInput, Button, Snackbar } from '@rbx/foundation-ui';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { DEFAULT_VALUES, POLLING_CONSTANTS, UI_CONSTANTS } from '../../constants';
import useDebounce from '../../hooks/useDebounce';
import useGameServerFilterOptions from '../../hooks/useGameServerFilterOptions';
import useServerManagementV2 from '../../hooks/useServerManagementV2';
import useShowShutdownServers from '../../hooks/useShowShutdownServers';
import useUniversePlaces from '../../hooks/useUniversePlaces';
import type { GameServerFilters } from '../../types/GameServerControls';
import { isFilterRestartViable } from '../../utils/FilterUtils';
import looksLikeIdSearch from '../../utils/looksLikeIdSearch';
import {
  ACTIVE_ONLY_SERVER_STATUS_FILTER,
  DEFAULT_SERVER_STATUS_FILTER,
} from '../../utils/serverStatus';
import {
  syncServerFilterStateToUrl,
  urlParamsToServerFilter,
} from '../../utils/urlServerFilterParams';
import useToast from '../../utils/useToast';
import RestartServersModalV2 from '../RestartServersModal/RestartServersModalV2';
import FilterChipRow from './Filter/FilterChipRow';
import FilterSidebar, { defaultFilters } from './Filter/FilterSidebar';
import ServerListTable from './ServerListTable';
import styles from './ServerListPage.module.css';

const ServerListPage: FunctionComponent = () => {
  const { translate, translateHTML } = useTranslation();
  const { locale } = useLocalization();
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale ?? Locale.English), [locale]);
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const { placesInfo } = useUniversePlaces();
  const { gameDetails } = useCurrentGame();
  const { fetchFilterOptions } = useGameServerFilterOptions();
  const { handleLaunchRestart, handleForecastRestart } = useServerManagementV2();
  const showShutdownServers = useShowShutdownServers();
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  });

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GameServerFilters>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [serverCount, setServerCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartJustCompleted, setRestartJustCompleted] = useState(false);
  const [showRestartSnackbar, setShowRestartSnackbar] = useState(false);
  const [engineVersions, setEngineVersions] = useState<string[] | undefined>(undefined);
  const restartConfirmedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const showToast = useToast();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (restartConfirmedTimeoutRef.current != null) {
        clearTimeout(restartConfirmedTimeoutRef.current);
        restartConfirmedTimeoutRef.current = null;
      }
    };
  }, []);

  const { placeId: queryPlaceId } = router.query;
  const rawPlaceId = Array.isArray(queryPlaceId) ? queryPlaceId[0] : queryPlaceId;
  const placeId = rawPlaceId != null && rawPlaceId !== '' ? parseInt(rawPlaceId, 10) : null;

  const place = useMemo(() => {
    if (!placeId || !placesInfo || placesInfo.length === 0) {
      return null;
    }
    const id = typeof placeId === 'string' ? parseInt(placeId, 10) : placeId;
    return placesInfo.find((p) => p.placeId === id);
  }, [placeId, placesInfo]);
  const placeDisplayId = placeId?.toString() ?? DEFAULT_VALUES.PLACE_ID.toString();
  const placeDisplayName = place?.name ?? placeDisplayId;
  const placeVersions = place?.allPublishedVersions?.map(String);

  const { data: validRestartVersions } = useQuery({
    queryKey: ['serverManagement', 'validRestartVersions', gameDetails?.id, placeId],
    enabled: Boolean(gameDetails?.id && placeId),
    queryFn: async () => {
      const { placeForecasts } = await handleForecastRestart();

      if (!placeForecasts || typeof placeForecasts !== 'object' || placeId == null) {
        return null;
      }

      const currentPlace = placeForecasts[placeId];
      return Object.keys(currentPlace.instancesPerVersion ?? currentPlace.playersPerVersion ?? []);
    },
    select: (versions) => versions ?? undefined,
  });

  useEffect(() => {
    if (!placeId) {
      return;
    }
    void fetchFilterOptions(placeId).then((response) => {
      const versions = response?.filters?.EngineVersion?.values;
      setEngineVersions(versions ?? undefined);
    });
  }, [placeId, fetchFilterOptions]);

  const [preIdSearchFilter, setPreIdSearchFilter] = useState<GameServerFilters | null>(null);
  const [pageUrlReady, setPageUrlReady] = useState(false);

  const idSearchTableFilter = useMemo(
    () => ({
      ...defaultFilters,
      serverStatus: showShutdownServers
        ? { ...DEFAULT_SERVER_STATUS_FILTER }
        : { ...ACTIVE_ONLY_SERVER_STATUS_FILTER },
    }),
    [showShutdownServers],
  );

  if (!pageUrlReady && router.isReady) {
    const searchParam = Array.isArray(router.query.search)
      ? router.query.search[0]
      : router.query.search;
    const urlFilter = urlParamsToServerFilter(router.query) ?? { ...defaultFilters };
    const urlIdSearch = looksLikeIdSearch(searchParam ?? '');

    if (searchParam) {
      setSearch(searchParam);
    }
    if (urlIdSearch) {
      setPreIdSearchFilter(urlFilter);
      setFilter(idSearchTableFilter);
    } else {
      setFilter(urlFilter);
    }
    setPageUrlReady(true);
  }

  const debouncedSearch = useDebounce(
    search,
    POLLING_CONSTANTS.DEBOUNCE_DELAY_MS,
    pageUrlReady,
  ).trim();

  const rawLooksLikeIdSearch = looksLikeIdSearch(search);

  const tableFilter = useMemo(() => {
    const base = filter ?? defaultFilters;
    if (rawLooksLikeIdSearch) {
      return idSearchTableFilter;
    }
    if (!showShutdownServers) {
      return { ...base, serverStatus: ACTIVE_ONLY_SERVER_STATUS_FILTER };
    }
    return base;
  }, [showShutdownServers, filter, rawLooksLikeIdSearch, idSearchTableFilter]);

  const debouncedTableFilter = useDebounce(
    tableFilter,
    POLLING_CONSTANTS.DEBOUNCE_DELAY_MS,
    pageUrlReady,
  );

  const updateSearch = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      const looksLikeId = looksLikeIdSearch(value);

      setSearch(value);

      if (looksLikeId) {
        setPreIdSearchFilter((saved) => saved ?? filter ?? defaultFilters);
        setFilter(idSearchTableFilter);
        return;
      }

      if (preIdSearchFilter) {
        setFilter(preIdSearchFilter);
        setPreIdSearchFilter(null);
      }
    },
    [filter, preIdSearchFilter, idSearchTableFilter],
  );

  useEffect(() => {
    if (!pageUrlReady) {
      return;
    }
    syncServerFilterStateToUrl(routerRef.current, { search, filter });
  }, [search, filter, pageUrlReady]);

  // restart scope must match the rows the table is actually showing
  const restartFilter = debouncedTableFilter;

  const handleConfirmRestart = useCallback(
    async (options: { bleedOffMinutes?: string; customPayload?: string }) => {
      if (!placeId) {
        return;
      }

      setIsRestarting(true);
      setModalOpen(false);
      setShowRestartSnackbar(true);

      try {
        const strVersions = restartFilter?.placeVersion ?? [];
        const versions = strVersions.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
        const placeFilter: PlaceFilter =
          restartFilter && restartFilter.placeVersion.length > 0
            ? {
                versions,
              }
            : {
                excludeCurrentVersion: false,
              };

        const launchRequest: RestartsLaunchRestartRequest = {
          ...(options.bleedOffMinutes && {
            bleedOffDurationMinutes: parseInt(options.bleedOffMinutes, 10),
          }),
          ...(options.customPayload && {
            attributes: JSON.parse(options.customPayload) as unknown,
          }),
          places: {
            [placeId.toString()]: placeFilter,
          },
        };

        const response = await handleLaunchRestart(launchRequest);

        if (response) {
          setRestartJustCompleted(true);
        }
      } catch {
        showToast(translate('SelectablePlacesTable.Snackbar.ErrorLaunchingRestart'));
      } finally {
        setIsRestarting(false);
      }

      if (restartConfirmedTimeoutRef.current != null) {
        clearTimeout(restartConfirmedTimeoutRef.current);
      }
      restartConfirmedTimeoutRef.current = setTimeout(() => {
        restartConfirmedTimeoutRef.current = null;
        if (isMountedRef.current) {
          setRestartJustCompleted(false);
        }
      }, UI_CONSTANTS.RESTART_CONFIRMED_DURATION_MS);
    },
    [restartFilter, handleLaunchRestart, placeId, translate, showToast],
  );

  const showRestartProgress = useCallback(() => {
    const restartProgressPath = router.asPath.replace(
      /(server-management).*/,
      '$1?activeTab=RestartMonitor',
    );
    unifiedLogger.logClickEvent({ eventName: 'ServerList.ToRestartProgress.Click' });
    return router.push(restartProgressPath);
  }, [router, unifiedLogger]);

  const restartButtonText = useMemo(() => {
    if (restartJustCompleted) {
      return translate('ServerListTable.Button.Restarted');
    }

    if (restartFilter?.placeVersion && restartFilter.placeVersion.length > 0) {
      return translate('ServerListTable.Button.RestartXServers', {
        count: numberFormatter.format(serverCount),
      });
    }
    return translate('ServerListTable.Button.RestartAllServers');
  }, [restartJustCompleted, restartFilter, serverCount, numberFormatter, translate]);

  const makeFiltersRestartViable = useCallback(() => {
    const versions = restartFilter?.placeVersion ?? [];
    setFilter({
      ...defaultFilters,
      placeVersion: validRestartVersions
        ? versions.filter((v) => validRestartVersions.includes(v))
        : versions,
    });
  }, [restartFilter, validRestartVersions]);

  return (
    <div className='flex flex-col gap-large medium:gap-xxlarge padding-top-medium'>
      <FilterSidebar
        onOpenChange={setFilterOpen}
        setFilters={setFilter}
        existingFilters={filter}
        open={filterOpen}
        placeName={placeDisplayName}
        validPlaceVersions={placeVersions}
        validEngineVersions={engineVersions}
        showShutdownServers={showShutdownServers}
      />
      <RestartServersModalV2
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmRestart}
        placeId={placeId ?? DEFAULT_VALUES.PLACE_ID}
        filter={restartFilter}
      />
      <div className='flex flex-col medium:flex-row medium:items-start medium:justify-between gap-large medium:gap-xxlarge'>
        <TextInput
          placeholder={translate('ServerListTable.Search')}
          value={search}
          onChange={updateSearch}
          className={styles.searchInput}
          style={{ maxWidth: 440 }}
          id='search-servers'
          size='Large'
        />
        <div className='flex items-start justify-between gap-small width-full'>
          <div className='shrink-0'>
            <Button
              aria-label='filter servers'
              variant='Utility'
              icon='icon-regular-three-bars-horizontal-narrowing'
              onClick={() => setFilterOpen(true)}>
              {translate('ServerListTable.Filter')}
            </Button>
          </div>
          {/* absolute helper so restart-disabled copy can't shove FilterChipRow down */}
          <div className='relative flex flex-col items-end min-width-0'>
            <Button
              variant='Emphasis'
              isLoading={isRestarting}
              isDisabled={
                !isFilterRestartViable(restartFilter, validRestartVersions) ||
                serverCount === 0 ||
                rawLooksLikeIdSearch
              }
              icon={restartJustCompleted ? 'icon-regular-check' : undefined}
              onClick={() => setModalOpen(true)}>
              {restartButtonText}
            </Button>
            {!isFilterRestartViable(restartFilter, validRestartVersions) &&
              !rawLooksLikeIdSearch && (
                <div className='absolute text-align-x-end top-[100%] right-[0] margin-top-[var(--gap-xsmall)] [overflow:hidden] max-width-full [z-index:1]'>
                  <Typography variant='smallLabel1'>
                    {translateHTML('ServerListPage.Error.RestartDisabled', [
                      {
                        opening: 'linkStart',
                        closing: 'linkEnd',
                        content(chunks) {
                          return (
                            <button
                              className='inline bg-none padding-none cursor-pointer underline'
                              style={{ border: 'none', font: 'inherit', color: 'inherit' }}
                              onClick={makeFiltersRestartViable}
                              type='button'>
                              {chunks}
                            </button>
                          );
                        },
                      },
                    ])}
                  </Typography>
                </div>
              )}
          </div>
        </div>
      </div>
      {/* keep one chip-row tall so the table doesn't jump when chips appear/clear */}
      <div className='min-height-[53px]' data-testid='filter-chip-row'>
        {filter != null && (
          <FilterChipRow
            filter={filter}
            setFilter={setFilter}
            showShutdownServers={showShutdownServers}
          />
        )}
      </div>
      <ServerListTable
        search={debouncedSearch}
        filter={debouncedTableFilter}
        placeId={placeId}
        onTotalServersChange={setServerCount}
        urlReady={pageUrlReady}
        showShutdownServers={showShutdownServers}
      />
      {showRestartSnackbar && (
        <div
          className='fixed pointer-events-none'
          style={{
            bottom: 'max(var(--padding-xxlarge, 32px), env(safe-area-inset-bottom))',
            right: 'max(var(--padding-xxlarge, 32px), env(safe-area-inset-right))',
            zIndex: 50,
            width: 600,
            maxWidth:
              'calc(100vw - max(var(--padding-xxlarge, 32px), env(safe-area-inset-right)) - max(var(--padding-xxlarge, 32px), env(safe-area-inset-left)))',
          }}>
          <Snackbar
            title={translate('ServerListPage.RestartSnackbar.Title')}
            icon='icon-regular-circle-check'
            actions={
              <Button variant='Link' size='Medium' onClick={showRestartProgress}>
                {translate('ServerListPage.RestartSnackbar.Action')}
              </Button>
            }
            onClose={() => setShowRestartSnackbar(false)}
            shouldAutoDismiss={false}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              left: 'auto',
              paddingTop: 4,
              paddingBottom: 4,
              paddingLeft: 12,
              paddingRight: 8,
              pointerEvents: 'auto',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default ServerListPage;
