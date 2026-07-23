import { Button, Checkbox } from '@rbx/foundation-ui';
import { useLocalization } from '@rbx/intl';
import { Autocomplete, FormControl, Grid, TextField } from '@rbx/ui';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AdIntegrationsCampaignTable from '@components/adIntegrations/AdIntegrationsCampaignTable';
import useAdIntegrationsListPageStyles from '@components/adIntegrations/AdIntegrationsListPage.styles';
import AdIntegrationAssetsDrawer, {
  AdIntegrationAssetsDrawerCampaignInfoHeader,
} from '@components/adIntegrations/assetsDrawer/AdIntegrationAssetsDrawer';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import { openEntitySubmitErrorDialog } from '@components/common/dialog/entitySubmitErrorDialog';
import GenericNoDataPage from '@components/common/GenericNoDataPage';
import UniverseFilterAvatar from '@components/common/UniverseFilterAvatar';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import { defaultAdvertisedUniverse } from '@constants/universeConstants';
import useAdAccountAutoCreateCreateAction from '@hooks/account/useAdAccountAutoCreateCreateAction';
import useAdIntegrationCampaignApi from '@hooks/adIntegrations/useAdIntegrationCampaignApi';
import useRevenueShareEstimatePreview from '@hooks/adIntegrations/useRevenueShareEstimatePreview';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import {
  addPlacementToAdIntegration,
  parseAdIntegrationCampaignModerationStatus,
  removePlacementFromAdIntegration,
} from '@services/ads/adIntegrationCampaignService';
import { useAdIntegrationCampaignStore } from '@stores/adIntegrationCampaignStoreProvider';
import { useAppStore } from '@stores/appStoreProvider';
import { ThumbnailStoreType, useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { AdIntegrationCampaignListItem } from '@type/adIntegrations';
import { AMAErrorResponseType } from '@type/errorResponse';
import { AdvertisedUniverse } from '@type/universe';
import {
  isAdIntegrationCampaignEndedByTimestamp,
  isAdIntegrationCampaignStatusArchived,
} from '@utils/adIntegrationCampaign';
import { getCampaignModerationStatusLabelKey } from '@utils/adIntegrationModerationTooltip';
import { formatMicroUsdToUsdDisplay } from '@utils/revenueShareEstimate';

type PageLoadState = 'loading' | 'loaded' | 'redirecting';
type ManagedCampaignStatusPresentation = {
  label: string;
  tone: AdIntegrationAssetsDrawerCampaignInfoHeader['statusTone'];
};

// The managed-campaign status label key can resolve from one of several
// namespaces depending on moderation status, so map each possible key to its
// owning namespace to bind the correct namespaced translator at the call site.
const StatusLabelNamespace: Record<string, TranslationNamespace> = {
  'Label.InReview': TranslationNamespace.CreativeLibrary,
  'Label.ModerationStatusLimited': TranslationNamespace.Account,
  'Label.NoAssets': TranslationNamespace.Account,
  'Label.Rejected': TranslationNamespace.CreativeLibrary,
  'Status.Completed': TranslationNamespace.Report,
};

const getDateDisplayValue = (timestampMs?: number, locale?: string | null): string => {
  if (!timestampMs) {
    return UNAVAILABLE_VALUE_DISPLAY;
  }

  return new Date(timestampMs).toLocaleDateString(locale || undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getManagedCampaignStatusPresentation = (
  campaign: AdIntegrationCampaignListItem | undefined,
  fallbackModerationStatus?: string,
  fallbackEndTimestampMs?: number,
): ManagedCampaignStatusPresentation => {
  const moderationStatus = parseAdIntegrationCampaignModerationStatus(
    campaign?.moderationStatus ?? fallbackModerationStatus,
  );
  const isCompleted =
    isAdIntegrationCampaignEndedByTimestamp(campaign?.endTimestampMs ?? fallbackEndTimestampMs) &&
    moderationStatus !== 'REJECTED';

  if (isCompleted) {
    return { label: 'Status.Completed', tone: 'disabled' };
  }

  switch (moderationStatus) {
    case 'APPROVED':
    case 'LIMITED':
      return {
        label: getCampaignModerationStatusLabelKey(moderationStatus) ?? 'Label.NoAssets',
        tone: 'active',
      };
    case 'REJECTED':
      return {
        label: getCampaignModerationStatusLabelKey(moderationStatus) ?? 'Label.NoAssets',
        tone: 'important',
      };
    case 'IN_REVIEW':
    default:
      return {
        label: getCampaignModerationStatusLabelKey(moderationStatus) ?? 'Label.NoAssets',
        tone: 'notice',
      };
  }
};

const AdIntegrationsListPage = () => {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const managedCampaignIdRef = useRef<string | null>(null);
  const { locale } = useLocalization();
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const authenticatedUser = useAuthenticatedUser();
  const {
    classes: { filterControl, headerRow, pageContainer },
  } = useAdIntegrationsListPageStyles();
  const {
    archiveCampaign,
    campaignCreatedTimestampMs,
    campaignDetails,
    campaignEndTimestampMs,
    campaignList,
    campaignModerationStatus,
    campaignPlacements,
    campaignStartTimestampMs,
    campaignStatus,
    campaignStatusToggleLoadingMap,
    getCampaignDetailsById,
    getCampaignListBySelectedUniverse,
    getUniversesCanAdvertise,
    isCampaignListError,
    isCampaignListLoading,
    isUniversesError,
    selectedUniverseId,
    setSelectedUniverseId,
    toggleCampaignStatus,
    universesCanAdvertise,
  } = useAdIntegrationCampaignApi();
  const [showArchivedCampaigns, setShowArchivedCampaigns] = useState<boolean>(false);

  const visibleCampaignList = useMemo(
    () =>
      showArchivedCampaigns
        ? campaignList
        : campaignList.filter(
            (campaign) => !isAdIntegrationCampaignStatusArchived(campaign.status),
          ),
    [campaignList, showArchivedCampaigns],
  );

  const handleArchiveCampaign = useCallback(
    (campaignId: string) => {
      archiveCampaign(campaignId).catch((error) => {
        openEntitySubmitErrorDialog(
          (error as { response?: { data?: AMAErrorResponseType } })?.response
            ?.data as AMAErrorResponseType,
          { editMode: false },
        );
      });
    },
    [archiveCampaign],
  );
  const thumbnailsByUniverseId = useThumbnailStore(
    (state: ThumbnailStoreType) => state.thumbnailsByUniverseId,
  );

  const universeOptions = useMemo<AdvertisedUniverse[]>(
    () => [
      defaultAdvertisedUniverse,
      ...universesCanAdvertise.map(({ universe_id, universe_name }) => ({
        universe_id,
        universe_name,
      })),
    ],
    [universesCanAdvertise],
  );

  const selectedUniverse = useMemo<AdvertisedUniverse>(
    () =>
      universeOptions.find((option) => option.universe_id === selectedUniverseId) ??
      defaultAdvertisedUniverse,
    [selectedUniverseId, universeOptions],
  );

  const campaignIdFromQuery = router.query.campaignId;
  const managedCampaignId = typeof campaignIdFromQuery === 'string' ? campaignIdFromQuery : null;
  managedCampaignIdRef.current = managedCampaignId;
  const managedCampaign = useMemo<AdIntegrationCampaignListItem | undefined>(
    () => campaignList.find((campaign) => campaign.campaignId === managedCampaignId),
    [campaignList, managedCampaignId],
  );
  const managedCampaignStatusPresentation = useMemo<ManagedCampaignStatusPresentation>(
    () =>
      getManagedCampaignStatusPresentation(
        managedCampaign,
        campaignModerationStatus ?? campaignStatus,
        campaignEndTimestampMs,
      ),
    [campaignEndTimestampMs, campaignModerationStatus, campaignStatus, managedCampaign],
  );
  const managedCampaignEnded = isAdIntegrationCampaignEndedByTimestamp(
    managedCampaign?.endTimestampMs ?? campaignEndTimestampMs,
  );
  const managedCampaignExperienceName = useMemo<string>(
    () =>
      managedCampaign?.universeName ??
      universesCanAdvertise.find((universe) => universe.universe_id === campaignDetails?.experience)
        ?.universe_name ??
      UNAVAILABLE_VALUE_DISPLAY,
    [managedCampaign?.universeName, universesCanAdvertise, campaignDetails?.experience],
  );

  const isRevenueShareEstimateEnabled = useAppStore(
    (state) => state.appMetadataState?.data?.isAdIntegrationRevenueShareEstimateEnabled ?? false,
  );
  const managedCampaignUniverseId = managedCampaign?.universeId ?? campaignDetails?.experience;
  // The detail drawer always fetches fresh signals for the selected campaign's
  // universe rather than reusing the store-wide saved snapshot: that snapshot is
  // whichever campaign's details loaded last, so reusing it would show stale
  // numbers when switching between campaigns that share a universe. The preview
  // fetch is cheap and idempotent, so refetching on open is the simpler, correct
  // choice. (The edit form still reuses its own campaign's snapshot.)
  const { maxRevenueShareMicroUsd, weightedCptvMicroUsd } = useRevenueShareEstimatePreview({
    endTimestampMs: managedCampaign?.endTimestampMs ?? campaignEndTimestampMs,
    startTimestampMs: managedCampaign?.startTimestampMs ?? campaignStartTimestampMs,
    // Gated behind the revenue share estimate flag: passing undefined keeps the
    // hook from issuing any network request while the feature is disabled.
    universeId:
      isRevenueShareEstimateEnabled && managedCampaignId ? managedCampaignUniverseId : undefined,
  });
  const managedCampaignCptvDisplay =
    weightedCptvMicroUsd !== undefined
      ? formatMicroUsdToUsdDisplay(weightedCptvMicroUsd)
      : undefined;
  const managedCampaignMaxCostDisplay =
    maxRevenueShareMicroUsd !== undefined
      ? formatMicroUsdToUsdDisplay(maxRevenueShareMicroUsd)
      : undefined;
  const managedCampaignInfoHeader = useMemo<
    AdIntegrationAssetsDrawerCampaignInfoHeader | undefined
  >(() => {
    if (!managedCampaignId) {
      return undefined;
    }

    const statusLabelKey = managedCampaignStatusPresentation.label;
    const statusLabelNamespace =
      StatusLabelNamespace[statusLabelKey] ?? TranslationNamespace.Report;
    let statusLabel: string;
    if (statusLabelNamespace === TranslationNamespace.Account) {
      statusLabel = translateAccount(statusLabelKey);
    } else if (statusLabelNamespace === TranslationNamespace.CreativeLibrary) {
      statusLabel = translateCreativeLibrary(statusLabelKey);
    } else {
      statusLabel = translateReport(statusLabelKey);
    }

    return {
      advertiserName: campaignDetails?.advertiserName || UNAVAILABLE_VALUE_DISPLAY,
      campaignId: managedCampaignId,
      campaignName: managedCampaign?.campaignName ?? campaignDetails?.campaignName ?? '',
      cptvDisplay: managedCampaignCptvDisplay,
      endDate:
        managedCampaign?.endTimestampMs != null
          ? getDateDisplayValue(managedCampaign.endTimestampMs, locale)
          : campaignDetails?.endDate || getDateDisplayValue(campaignEndTimestampMs, locale),
      experienceName: managedCampaignExperienceName,
      experienceThumbnailUrl:
        thumbnailsByUniverseId[managedCampaign?.universeId ?? campaignDetails?.experience ?? 0]
          ?.data?.imageUrl,
      maxCostDisplay: managedCampaignMaxCostDisplay,
      registrationDate: getDateDisplayValue(
        managedCampaign?.createdTimestampMs ?? campaignCreatedTimestampMs,
        locale,
      ),
      startDate:
        managedCampaign?.startTimestampMs != null
          ? getDateDisplayValue(managedCampaign.startTimestampMs, locale)
          : campaignDetails?.startDate || getDateDisplayValue(campaignStartTimestampMs, locale),
      statusLabel,
      statusTone: managedCampaignStatusPresentation.tone,
    };
  }, [
    campaignCreatedTimestampMs,
    campaignDetails?.campaignName,
    campaignDetails?.advertiserName,
    campaignDetails?.endDate,
    campaignDetails?.experience,
    campaignDetails?.startDate,
    campaignEndTimestampMs,
    campaignStartTimestampMs,
    locale,
    managedCampaignId,
    managedCampaign,
    managedCampaignCptvDisplay,
    managedCampaignExperienceName,
    managedCampaignMaxCostDisplay,
    managedCampaignStatusPresentation.label,
    managedCampaignStatusPresentation.tone,
    thumbnailsByUniverseId,
    translateAccount,
    translateCreativeLibrary,
    translateReport,
  ]);

  const navigateToCreate = useCallback(() => {
    router.push(Routes.AD_INTEGRATIONS_CREATE);
  }, [router]);
  const handleCreateClick = useAdAccountAutoCreateCreateAction(
    navigateToCreate,
    'adIntegrationsList',
  );

  const closeManagedCampaignDrawer = useCallback(() => {
    const nextQuery = { ...routerRef.current.query };
    delete nextQuery.campaignId;

    routerRef.current.replace(
      {
        pathname: Routes.AD_INTEGRATIONS,
        query: nextQuery,
      },
      undefined,
      { shallow: true },
    );
  }, []);

  const handleSaveManagedCampaignPlacements = useCallback(
    async (additions: number[], removals: string[]) => {
      if (!managedCampaignId) {
        return;
      }

      await Promise.all([
        ...additions.map((assetId) => addPlacementToAdIntegration(managedCampaignId, assetId)),
        ...removals.map((placementId) =>
          removePlacementFromAdIntegration(managedCampaignId, placementId),
        ),
      ]);

      await Promise.all([
        getCampaignDetailsById(managedCampaignId, true),
        getCampaignListBySelectedUniverse(true),
      ]);
    },
    [getCampaignDetailsById, getCampaignListBySelectedUniverse, managedCampaignId],
  );

  const [pageLoadState, setPageLoadState] = useState<PageLoadState>('loading');
  const hasCampaigns = visibleCampaignList.length > 0;
  const hasAnyCampaigns = campaignList.length > 0;
  const hasUniverseCampaignOptions = universesCanAdvertise.length > 0;
  const showCampaignListLoadingState =
    hasUniverseCampaignOptions && isCampaignListLoading && !hasAnyCampaigns;
  const prevSelectedUniverseIdRef = useRef<number>(selectedUniverseId);

  useEffect(() => {
    if (!router.isReady) {
      return undefined;
    }

    let isMounted = true;

    const loadPage = async () => {
      await getUniversesCanAdvertise(true);
      if (!isMounted) {
        return;
      }

      const { universesCanAdvertise: universeState } = useAdIntegrationCampaignStore.getState();

      if (universeState.isError || universeState.data.length === 0) {
        setPageLoadState('loaded');
        return;
      }

      await getCampaignListBySelectedUniverse(true);
      if (!isMounted) {
        return;
      }

      const { campaignList: campaignState } = useAdIntegrationCampaignStore.getState();

      if (
        !managedCampaignIdRef.current &&
        campaignState.data.length === 0 &&
        !campaignState.isError
      ) {
        setPageLoadState('redirecting');
        routerRef.current.replace(Routes.AD_INTEGRATIONS_LANDING);
        return;
      }

      setPageLoadState('loaded');
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [getCampaignListBySelectedUniverse, getUniversesCanAdvertise, router.isReady]);

  useEffect(() => {
    if (pageLoadState !== 'loaded') {
      return;
    }

    if (prevSelectedUniverseIdRef.current === selectedUniverseId) {
      prevSelectedUniverseIdRef.current = selectedUniverseId;
      return;
    }
    prevSelectedUniverseIdRef.current = selectedUniverseId;

    getCampaignListBySelectedUniverse(true);
  }, [getCampaignListBySelectedUniverse, pageLoadState, selectedUniverseId]);

  useEffect(() => {
    if (pageLoadState !== 'loaded' || !managedCampaignId) {
      return;
    }

    getCampaignDetailsById(managedCampaignId, true);
  }, [getCampaignDetailsById, managedCampaignId, pageLoadState]);

  if (pageLoadState === 'loading' || pageLoadState === 'redirecting') {
    return <CenteredCircularProgress />;
  }

  if (isUniversesError) {
    return (
      <GenericNoDataPage
        subtitle={translateReport('Description.FailedToFetchTryRefreshing')}
        title={translateReport('Heading.UnableToLoadCampaigns')}
      />
    );
  }

  return (
    <div className={pageContainer}>
      <Grid className={headerRow} container>
        <Grid item>
          <Grid alignItems='center' container gap={2}>
            <Grid item>
              <Autocomplete
                disableClearable
                getOptionLabel={({ universe_name }) => universe_name}
                id='ad-integrations-universe-picker'
                onChange={(_event, universeObj) => {
                  if (!universeObj) {
                    return;
                  }

                  setSelectedUniverseId(universeObj.universe_id);
                }}
                options={universeOptions}
                renderInput={(params) => (
                  <FormControl className={filterControl} variant='outlined'>
                    <TextField
                      {...params}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment:
                          selectedUniverse.universe_id !== defaultAdvertisedUniverse.universe_id ? (
                            <UniverseFilterAvatar
                              src={
                                thumbnailsByUniverseId[selectedUniverse.universe_id]?.data?.imageUrl
                              }
                            />
                          ) : null,
                      }}
                      label={translateReport('Label.Experience')}
                    />
                  </FormControl>
                )}
                value={selectedUniverse}
              />
            </Grid>
            {!isCampaignListError && hasAnyCampaigns && (
              <Grid item>
                <Checkbox
                  isChecked={showArchivedCampaigns}
                  label={translateMisc('Action.ShowArchivedCampaigns')}
                  onCheckedChange={(checked) => setShowArchivedCampaigns(checked === true)}
                  placement='Start'
                  size='Small'
                />
              </Grid>
            )}
          </Grid>
        </Grid>
        <Grid item>
          <Button onClick={handleCreateClick} size='Medium' variant='Emphasis'>
            {translateAccount('Action.RegisterAdIntegration')}
          </Button>
        </Grid>
      </Grid>

      {showCampaignListLoadingState && <CenteredCircularProgress />}

      {!showCampaignListLoadingState && isCampaignListError && (
        <GenericNoDataPage
          subtitle={translateReport('Description.FailedToFetchTryRefreshing')}
          title={translateReport('Heading.UnableToLoadCampaigns')}
        />
      )}

      {!showCampaignListLoadingState && !isCampaignListError && !hasCampaigns && (
        <GenericNoDataPage
          subtitle={translateReport('Description.NoResultsFound')}
          title={translateReport('Heading.NoCampaigns')}
        />
      )}

      {!isCampaignListError && hasCampaigns && (
        <AdIntegrationsCampaignTable
          campaigns={visibleCampaignList}
          onArchiveCampaign={handleArchiveCampaign}
          onToggleCampaignStatus={toggleCampaignStatus}
          toggleLoadingMap={campaignStatusToggleLoadingMap}
        />
      )}

      <AdIntegrationAssetsDrawer
        campaignId={managedCampaignId || undefined}
        campaignInfoHeader={managedCampaignInfoHeader}
        campaignStartTimestampMs={campaignStartTimestampMs}
        disableSave={!managedCampaignId || managedCampaignEnded}
        mode='edit'
        onClose={closeManagedCampaignDrawer}
        onSavePlacements={handleSaveManagedCampaignPlacements}
        open={Boolean(managedCampaignId)}
        placements={campaignPlacements}
        universeId={managedCampaign?.universeId ?? campaignDetails?.experience}
        userId={authenticatedUser?.id}
      />
    </div>
  );
};

export default AdIntegrationsListPage;
