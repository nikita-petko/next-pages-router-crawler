import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { Button, Checkbox, Icon, Link } from '@rbx/foundation-ui';
import { useLocalization } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AdIntegrationsCampaignTable from '@components/adIntegrations/AdIntegrationsCampaignTable';
import useAdIntegrationsListPageStyles from '@components/adIntegrations/AdIntegrationsListPage.styles';
import AdIntegrationAssetsDrawer, {
  AdIntegrationAssetsDrawerCampaignInfoHeader,
} from '@components/adIntegrations/assetsDrawer/AdIntegrationAssetsDrawer';
import CenteredCircularProgress from '@components/common/CenteredCircularProgress';
import GameUniverseDropdown from '@components/common/creative/GameUniverseDropdown';
import { openEntitySubmitErrorDialog } from '@components/common/dialog/entitySubmitErrorDialog';
import GenericNoDataPage from '@components/common/GenericNoDataPage';
import {
  AdIntegrationsDocsUrl,
  getAdIntegrationEligibilityUrl,
} from '@constants/adIntegrationsUrls';
import { UNAVAILABLE_VALUE_DISPLAY } from '@constants/displayConstants';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import { defaultAdvertisedUniverse } from '@constants/universeConstants';
import useAdAccountAutoCreateCreateAction from '@hooks/account/useAdAccountAutoCreateCreateAction';
import useAdIntegrationCampaignApi from '@hooks/adIntegrations/useAdIntegrationCampaignApi';
import useRevenueShareEstimatePreview from '@hooks/adIntegrations/useRevenueShareEstimatePreview';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useShouldUseWorkspaceUniverseFiltering from '@hooks/useShouldUseWorkspaceUniverseFiltering';
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
import {
  isAdIntegrationCampaignEndedByTimestamp,
  isAdIntegrationCampaignStatusArchived,
} from '@utils/adIntegrationCampaign';
import { getCampaignModerationStatusLabelKey } from '@utils/adIntegrationModerationTooltip';
import { formatMicroUsdToUsdDisplay } from '@utils/revenueShareEstimate';

type PageLoadState = 'loading' | 'loaded';
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

const AdIntegrationsIcon = ({ className }: { className: string }) => (
  <Icon className={className} name='icon-regular-megaphone' size='XLarge' />
);

const AdIntegrationsListPage = () => {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const managedCampaignIdRef = useRef<string | null>(null);
  const { locale } = useLocalization();
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { translate: translateAccount } = useNamespacedTranslation(TranslationNamespace.Account);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const authenticatedUser = useAuthenticatedUser();
  const {
    classes: { archivedCampaignsFilter, filterControl, headerRow, pageContainer },
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
    isUniversesLoading,
    publisherEligibleUniverseIds,
    selectedUniverseId,
    setSelectedUniverseId,
    toggleCampaignStatus,
    universesCanAdvertise,
  } = useAdIntegrationCampaignApi({ loadUniversesOnMount: false });
  const [showArchivedCampaigns, setShowArchivedCampaigns] = useState<boolean>(false);
  const shouldUseWorkspaceUniverseFiltering = useShouldUseWorkspaceUniverseFiltering();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();

  const workspace = useMemo(
    () =>
      currentWorkspace?.creatorId
        ? {
            creatorTargetId: currentWorkspace.creatorId,
            creatorType: currentWorkspace.creatorType,
          }
        : undefined,
    [currentWorkspace?.creatorId, currentWorkspace?.creatorType],
  );

  const initialUniverseId = useMemo(() => {
    const universeIdQuery = router.query.universe_id;
    if (typeof universeIdQuery !== 'string') {
      return undefined;
    }
    const parsedUniverseId = Number.parseInt(universeIdQuery, 10);
    return Number.isNaN(parsedUniverseId) ? undefined : parsedUniverseId;
  }, [router.query.universe_id]);

  const eligibleUniverseIdSet = useMemo(
    () => new Set(publisherEligibleUniverseIds),
    [publisherEligibleUniverseIds],
  );
  const hasAnyEligibleOwned = useMemo(
    () => universesCanAdvertise.some((universe) => eligibleUniverseIdSet.has(universe.universe_id)),
    [eligibleUniverseIdSet, universesCanAdvertise],
  );
  const isSelectionCreatable =
    selectedUniverseId === defaultAdvertisedUniverse.universe_id
      ? hasAnyEligibleOwned
      : eligibleUniverseIdSet.has(selectedUniverseId);
  const showIneligibleNotice = universesCanAdvertise.length > 0 && !isSelectionCreatable;
  const shouldShowArchivedCampaigns = showArchivedCampaigns || showIneligibleNotice;
  const ineligibleEligibilityUrl = useMemo(() => {
    if (selectedUniverseId !== defaultAdvertisedUniverse.universe_id) {
      return getAdIntegrationEligibilityUrl(selectedUniverseId);
    }
    const firstOwnedUniverseId = universesCanAdvertise[0]?.universe_id;
    return firstOwnedUniverseId != null
      ? getAdIntegrationEligibilityUrl(firstOwnedUniverseId)
      : AdIntegrationsDocsUrl;
  }, [selectedUniverseId, universesCanAdvertise]);

  const visibleCampaignList = useMemo(
    () =>
      shouldShowArchivedCampaigns
        ? campaignList
        : campaignList.filter(
            (campaign) => !isAdIntegrationCampaignStatusArchived(campaign.status),
          ),
    [campaignList, shouldShowArchivedCampaigns],
  );

  const archivedCampaignCount = useMemo(
    () =>
      campaignList.filter((campaign) => isAdIntegrationCampaignStatusArchived(campaign.status))
        .length,
    [campaignList],
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

  const handleUniverseFilterChange = useCallback(
    (value: string) => {
      const universeId = Number.parseInt(value, 10);
      if (Number.isNaN(universeId)) {
        return;
      }

      setSelectedUniverseId(universeId);
      const query = { ...router.query };
      if (universeId === defaultAdvertisedUniverse.universe_id) {
        delete query.universe_id;
      } else {
        query.universe_id = String(universeId);
      }
      router.replace({ pathname: Routes.AD_INTEGRATIONS, query }, undefined, {
        shallow: true,
      });
    },
    [router, setSelectedUniverseId],
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
  const hasUniverseOptions = universesCanAdvertise.length > 0;
  const sortedPickerUniverses = useMemo(() => {
    const eligibleUniverses = universesCanAdvertise.filter((universe) =>
      eligibleUniverseIdSet.has(universe.universe_id),
    );
    const ineligibleUniverses = universesCanAdvertise.filter(
      (universe) => !eligibleUniverseIdSet.has(universe.universe_id),
    );
    return [...eligibleUniverses, ...ineligibleUniverses];
  }, [eligibleUniverseIdSet, universesCanAdvertise]);
  const allUniverseStaticOptions = useMemo(
    () =>
      sortedPickerUniverses.length > 1
        ? [
            {
              label: defaultAdvertisedUniverse.universe_name,
              value: String(defaultAdvertisedUniverse.universe_id),
            },
          ]
        : [],
    [sortedPickerUniverses.length],
  );
  const showNoUniversesState =
    pageLoadState === 'loaded' && !isUniversesLoading && !hasUniverseOptions;
  const showCampaignListLoadingState =
    hasUniverseOptions && isCampaignListLoading && !hasAnyCampaigns;
  const showLandingEmptyState =
    !showNoUniversesState &&
    !showCampaignListLoadingState &&
    !isCampaignListError &&
    !hasAnyCampaigns &&
    isSelectionCreatable;
  const showNoCampaignsEmptyState =
    !showNoUniversesState &&
    !showCampaignListLoadingState &&
    !isCampaignListError &&
    !hasCampaigns &&
    !showLandingEmptyState;
  const prevSelectedUniverseIdRef = useRef<number>(selectedUniverseId);
  const lastFetchedWorkspaceKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!router.isReady) {
      return undefined;
    }
    if (shouldUseWorkspaceUniverseFiltering && isWorkspaceLoading) {
      return undefined;
    }
    if (shouldUseWorkspaceUniverseFiltering && !workspace) {
      return undefined;
    }

    const workspaceKey = workspace
      ? `${workspace.creatorType}:${workspace.creatorTargetId}`
      : 'workspace-universe-filtering-off';
    if (lastFetchedWorkspaceKeyRef.current === workspaceKey) {
      return undefined;
    }
    lastFetchedWorkspaceKeyRef.current = workspaceKey;

    let isMounted = true;
    setPageLoadState('loading');

    const loadPage = async () => {
      await getUniversesCanAdvertise(true, {
        initialUniverseId,
        workspace: shouldUseWorkspaceUniverseFiltering ? workspace : undefined,
      });
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

      const { selectedUniverseId: loadedSelectedUniverseId } =
        useAdIntegrationCampaignStore.getState();
      prevSelectedUniverseIdRef.current = loadedSelectedUniverseId;

      setPageLoadState('loaded');
    };

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [
    getCampaignListBySelectedUniverse,
    getUniversesCanAdvertise,
    initialUniverseId,
    isWorkspaceLoading,
    router.isReady,
    shouldUseWorkspaceUniverseFiltering,
    workspace,
  ]);

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

  if (pageLoadState === 'loading') {
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
          <div>
            <Grid alignItems='flex-end' container gap={2}>
              {hasUniverseOptions && (
                <Grid item>
                  <div className={filterControl} data-testid='ad-integrations-universe-picker'>
                    <GameUniverseDropdown
                      advertisableUniverses={sortedPickerUniverses}
                      hasError={showIneligibleNotice}
                      label={translateReport('Label.Experience')}
                      onValueChange={handleUniverseFilterChange}
                      placeholder={translateReport('Label.Experience')}
                      staticOptions={allUniverseStaticOptions}
                      value={String(selectedUniverseId)}
                    />
                  </div>
                </Grid>
              )}
              {!isCampaignListError && hasAnyCampaigns && (
                <Grid item>
                  <div className={archivedCampaignsFilter}>
                    <Checkbox
                      isChecked={shouldShowArchivedCampaigns}
                      isDisabled={showIneligibleNotice}
                      label={`${translateMisc('Action.ShowArchivedCampaigns')} (${String(archivedCampaignCount)})`}
                      onCheckedChange={(checked) => setShowArchivedCampaigns(checked === true)}
                      placement='Start'
                      size='Small'
                    />
                  </div>
                </Grid>
              )}
            </Grid>
            {showIneligibleNotice && (
              <p
                className={`text-body-small content-system-alert margin-[0px] ${filterControl}`}
                data-testid='ineligible-universe-error'>
                {translateCampaign('Description.ExperienceNoLongerEligible')}{' '}
                <Link
                  href={ineligibleEligibilityUrl}
                  rel='noopener noreferrer'
                  target='_blank'
                  underline='always'>
                  {translateReport('Action.LearnMoreManage')}
                </Link>
              </p>
            )}
          </div>
        </Grid>
        <Grid item>
          <Button
            isDisabled={!isSelectionCreatable}
            onClick={handleCreateClick}
            size='Medium'
            variant='Emphasis'>
            {translateAccount('Action.RegisterAdIntegration')}
          </Button>
        </Grid>
      </Grid>

      {showCampaignListLoadingState && <CenteredCircularProgress />}

      {showNoUniversesState && (
        <GenericNoDataPage
          subtitle={translateCampaign('Description.NoEligibleExperiencesForSelectedCreator')}
          title={translateCampaign('Heading.NoEligibleExperiencesFound')}
        />
      )}

      {!showCampaignListLoadingState && isCampaignListError && (
        <GenericNoDataPage
          subtitle={translateReport('Description.FailedToFetchTryRefreshing')}
          title={translateReport('Heading.UnableToLoadCampaigns')}
        />
      )}

      {showLandingEmptyState && (
        <GenericNoDataPage
          CustomIconComponent={AdIntegrationsIcon}
          outlined
          primaryButton={
            <Button onClick={handleCreateClick} size='Medium' variant='Emphasis'>
              {translateAccount('Action.RegisterAdIntegration')}
            </Button>
          }
          secondaryButton={
            <Button
              as='a'
              href={AdIntegrationsDocsUrl}
              rel='noopener noreferrer'
              size='Medium'
              target='_blank'
              variant='Standard'>
              {translateReport('Action.LearnMoreManage')}
            </Button>
          }
          subtitle={translateAccount('Description.AdIntegrationsLanding')}
          title={translateAccount('Heading.AdIntegrations')}
        />
      )}

      {showNoCampaignsEmptyState && (
        <GenericNoDataPage
          subtitle={translateReport('Description.NoResultsFound')}
          title={translateReport('Heading.NoCampaigns')}
        />
      )}

      {!showNoUniversesState &&
        !isCampaignListError &&
        !showLandingEmptyState &&
        !showNoCampaignsEmptyState &&
        hasCampaigns && (
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
