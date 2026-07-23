import { FunctionComponent, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { TextInput, Button, Snackbar } from '@rbx/foundation-ui';
import { PlaceFilter, RestartsLaunchRestartRequest } from '@rbx/clients/serverManagementService';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { DEFAULT_VALUES, POLLING_CONSTANTS, UI_CONSTANTS } from '../../constants';
import useDebounce from '../../hooks/useDebounce';
import useUniversePlaces from '../../hooks/useUniversePlaces';
import ServerListTable from './ServerListTable';
import FilterSidebar, { defaultFilters } from './Filter/FilterSidebar';
import { GameServerFilters } from '../../types/GameServerControls';
import FilterChipRow from './Filter/FilterChipRow';
import RestartServersModalV2 from '../RestartServersModal/RestartServersModalV2';
import { validateFilter, isFilterRestartViable } from '../../utils/FilterUtils';
import useGameServerFilterOptions from '../../hooks/useGameServerFilterOptions';
import useServerManagementV2 from '../../hooks/useServerManagementV2';
import useToast from '../../utils/useToast';
import { syncPageStateToUrl, urlParamsToFilter } from '../../utils/urlParams';
import styles from './ServerListPage.module.css';

const ServerListPage: FunctionComponent = () => {
  const { translate, translateHTML } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const { placesInfo } = useUniversePlaces();
  const { gameDetails } = useCurrentGame();
  const { fetchFilterOptions } = useGameServerFilterOptions();
  const { handleLaunchRestart, handleForecastRestart } = useServerManagementV2();
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<GameServerFilters>();
  const [filterOpen, setFilterOpen] = useState(false);
  const [serverCount, setServerCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [restartJustCompleted, setRestartJustCompleted] = useState(false);
  const [showRestartSnackbar, setShowRestartSnackbar] = useState(false);
  const [engineVersions, setEngineVersions] = useState<string[] | undefined>(undefined);
  const [validRestartVersions, setValidRestartVersions] = useState<string[] | undefined>(undefined);
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
    if (!placeId || !placesInfo || placesInfo.length === 0) return null;
    const id = typeof placeId === 'string' ? parseInt(placeId, 10) : placeId;
    return placesInfo.find((p) => p.placeId === id);
  }, [placeId, placesInfo]);
  const placeDisplayId = placeId?.toString() ?? DEFAULT_VALUES.PLACE_ID.toString();
  const placeDisplayName = place?.name ?? placeDisplayId;
  const placeVersions = place?.allPublishedVersions?.map(String);

  // Fetch what place versions are running servers
  const fetchLivePlaceVersions = useCallback(async () => {
    if (!gameDetails?.id || !placeId) return;

    try {
      const forecastResponse = await handleForecastRestart();
      const { placeForecasts } = forecastResponse;

      if (!placeForecasts || typeof placeForecasts !== 'object') {
        setValidRestartVersions(undefined);
        return;
      }

      const currentPlace = placeForecasts[placeId];
      const versions = Object.keys(
        currentPlace.instancesPerVersion ?? currentPlace.playersPerVersion ?? [],
      );
      setValidRestartVersions(versions);
    } catch {
      setValidRestartVersions(undefined);
    }
  }, [gameDetails?.id, placeId, handleForecastRestart]);

  useEffect(() => {
    fetchLivePlaceVersions();
  }, [fetchLivePlaceVersions]);

  useEffect(() => {
    if (!placeId) return;
    fetchFilterOptions(placeId).then((response) => {
      const versions = response?.filters?.EngineVersion?.values;
      setEngineVersions(versions ?? undefined);
    });
  }, [placeId, fetchFilterOptions]);

  const debouncedSearch = useDebounce(search, POLLING_CONSTANTS.DEBOUNCE_DELAY_MS);

  const [pageUrlReady, setPageUrlReady] = useState(false);
  const skipDebounceRef = useRef(true);

  useEffect(() => {
    if (pageUrlReady || !router.isReady) return;
    const searchParam = Array.isArray(router.query.search)
      ? router.query.search[0]
      : router.query.search;
    if (searchParam) {
      setSearch(searchParam);
    }
    const parsedFilter = urlParamsToFilter(router.query);
    if (parsedFilter) setFilter(parsedFilter);
    setPageUrlReady(true);
  }, [pageUrlReady, router.isReady, router.query]);

  useEffect(() => {
    if (skipDebounceRef.current && pageUrlReady && debouncedSearch === search) {
      skipDebounceRef.current = false;
    }
  }, [debouncedSearch, search, pageUrlReady]);

  const effectiveSearch = skipDebounceRef.current ? search : debouncedSearch;

  useEffect(() => {
    if (!pageUrlReady) return;
    syncPageStateToUrl(routerRef.current, { search: effectiveSearch, filter });
  }, [effectiveSearch, filter, pageUrlReady]);

  const handleConfirmRestart = useCallback(
    async (options: { bleedOffMinutes?: string }) => {
      if (!placeId) return;

      setIsRestarting(true);
      setModalOpen(false);
      setShowRestartSnackbar(true);

      try {
        const strVersions = filter?.placeVersion ?? [];
        const versions = strVersions.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
        const placeFilter: PlaceFilter =
          filter && filter.placeVersion.length > 0
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
    [filter, handleLaunchRestart, placeId, translate, showToast],
  );

  const showRestartProgress = useCallback(() => {
    // Replace everything after 'server-management' with '?activeTab=RestartMonitor', regardless of what comes after
    const restartProgressPath = router.asPath.replace(
      /(server-management).*/,
      '$1?activeTab=RestartMonitor',
    );
    unifiedLogger.logClickEvent({ eventName: 'ServerList.ToRestartProgress.Click' });
    return router.push(restartProgressPath);
  }, [router, unifiedLogger]);

  const restartButtonText = useMemo(() => {
    if (restartJustCompleted) return translate('ServerListTable.Button.Restarted');

    if (filter?.placeVersion && filter.placeVersion.length > 0) {
      return translate('ServerListTable.Button.RestartXServers', { count: serverCount.toString() });
    }
    return translate('ServerListTable.Button.RestartAllServers');
  }, [restartJustCompleted, filter?.placeVersion, serverCount, translate]);

  const makeFiltersRestartViable = useCallback(() => {
    const versions = filter?.placeVersion ?? [];
    setFilter({
      ...defaultFilters,
      placeVersion: validRestartVersions
        ? versions.filter((v) => validRestartVersions.includes(v))
        : versions,
    });
  }, [filter?.placeVersion, validRestartVersions]);

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
      />
      <RestartServersModalV2
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirmRestart}
        placeId={placeId ?? DEFAULT_VALUES.PLACE_ID}
      />
      <div className='flex flex-col medium:flex-row medium:items-start medium:justify-between gap-large medium:gap-xxlarge'>
        <TextInput
          placeholder={translate('ServerListTable.Search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
          style={{ maxWidth: 440 }}
          id='search-servers'
          size='Large'
        />
        <div className='flex items-start justify-between gap-small width-full medium:width-auto'>
          <div className='shrink-0'>
            <Button
              aria-label='filter servers'
              variant='Utility'
              icon='icon-regular-three-bars-horizontal-narrowing'
              onClick={() => setFilterOpen(true)}>
              {translate('ServerListTable.Filter')}
            </Button>
          </div>
          <div className='flex flex-col items-end gap-xsmall min-width-0'>
            <Button
              variant='Emphasis'
              isLoading={isRestarting}
              isDisabled={!isFilterRestartViable(filter, validRestartVersions) || serverCount === 0}
              icon={restartJustCompleted ? 'icon-regular-check' : undefined}
              onClick={() => setModalOpen(true)}>
              {restartButtonText}
            </Button>
            {!isFilterRestartViable(filter, validRestartVersions) && (
              <div className='self-stretch text-align-x-end' style={{ overflow: 'hidden' }}>
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
      {filter && validateFilter(filter) && (
        <FilterChipRow
          filter={filter}
          setFilter={setFilter}
          validPlaceVersions={validRestartVersions}
        />
      )}
      <ServerListTable
        search={effectiveSearch}
        filter={filter}
        placeId={placeId}
        onTotalServersChange={setServerCount}
        urlReady={pageUrlReady}
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
