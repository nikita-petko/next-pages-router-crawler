import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import {
  EventName,
  logNativeClickEvent,
  logNativeErrorEvent,
  logNativeImpressionEvent,
} from '@clients/unifiedLogger';
import { ServerAdStatusType } from '@constants/ad';
import {
  isAdCreditPaymentType,
  ServerCampaignStatusType,
  ServerPaymentType,
} from '@constants/campaign';
import { AdDisplayStatusType, CampaignDisplayStatusType } from '@constants/campaignStatus';
import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { EntityType } from '@constants/entity';
import { REPORTING_TIMEZONE_DB_NAME } from '@constants/reportingStatsConstants';
import ReportingViewType from '@constants/reportingViewType';
import { defaultAdvertisedUniverse } from '@constants/universeConstants';
import {
  AnalyticsReportingResource,
  isValidatedRoasEligible,
} from '@services/ads/analyticsQueryBuilder';
import {
  FRONTEND_REPORTING_CAAS_START_DATE,
  getFrontendReportingTimeSeriesRange,
} from '@services/ads/campaignTimeSeriesDateRange';
import { getFilteredCampaignIds } from '@services/ads/filterService';
import {
  CampaignRoas,
  getAdAccountCaaSReportingStats,
  getCampaignRoas,
  getUniverseCaaSReportingStats,
} from '@services/ads/frontendReportingStatsService';
import { getCampaignTimeSeries } from '@services/ads/getCampaignTimeSeriesService';
import {
  getDateFilteredAds,
  getDateFilteredCampaigns,
  getSimplifiedCampaign,
} from '@services/ads/getEntitiesService';
import { getAdStatus, getCampaignStatus, getUpdatedStatuses } from '@services/ads/getStatusService';
import { getAdAccountSummary } from '@services/ads/getSummaryService';
import { listAdvertisedUniverses, searchOwnedUniverses } from '@services/ads/getUniversesService';
import { updateAdStatus } from '@services/ads/patchAdService';
import { updateCampaignStatus } from '@services/ads/patchCampaignService';
import { useAppStore } from '@stores/appStoreProvider';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { Ad } from '@type/ad';
import {
  Campaign,
  GetAdStatusResponseType,
  GetCampaignStatusResponseType,
  GetUpdatedStatusesResponseType,
  UpdatedAdStatus,
  UpdatedCampaignStatus,
} from '@type/campaign';
import { FiltersOnEntity } from '@type/filter';
import {
  AdAccountSummary,
  CaaSReportingStatsResult,
  EntityPerformance,
  FrontendReportingStatsById,
} from '@type/reportingStats';
import { CampaignTimeSeries } from '@type/timeSeries';
import { AdvertisedUniverse } from '@type/universe';
import { SimplifiedUploadedCreative } from '@type/uploadedCreative';
import { shouldUseCustomDateRange } from '@utils/customDateRange';
import {
  parseDateSelectionFromWindowLocation,
  resolveDefaultTreatmentSelection,
} from '@utils/dateSelectionUrl';
import { CaptureException } from '@utils/error';
import {
  buildFrontendReportingStats,
  getDisplaySpendUsd,
  shouldUseCaaSReportingStats,
} from '@utils/frontendReportingStats';
import {
  buildPickerUniversesWithAllOption,
  resolveInitialUniverseFilter,
  resolveUniverseIdsForDateFilter,
} from '@utils/manageUniverseFilter';
import { createRequestManager } from '@utils/requestManager';
import {
  EmptyRequestStateType,
  GetEmptyRequestState,
  GetInitialRequestState,
  RequestStateType,
} from '@utils/zustandUtils';

interface DisplayStatusesStateType {
  adStatuses: Map<string, GetAdStatusResponseType>;
  // Loading is handled by just having an empty map
  // Error is handled by putting error statuses into the map
  campaignStatuses: Map<string, GetCampaignStatusResponseType>;
  updatedAdStatuses: Map<string, GetAdStatusResponseType>;
  updatedCampaignStatuses: Map<string, GetCampaignStatusResponseType>;
}

interface CampaignDetailsStateType {
  // If undefined, drawer is closed
  adsState: RequestStateType<Ad[]>;
  campaign?: Campaign;
  offPlatformMetrics?: Record<string, EntityPerformance>;
  timeSeriesPeriod: DateFilteringTimePeriod;
  timeSeriesState: EmptyRequestStateType<CampaignTimeSeries>;
  uploadedCreatives?: SimplifiedUploadedCreative[];
  visibleStatsState: VisibleStatsState;
}

interface VisibleStatsState extends RequestStateType<FrontendReportingStatsById> {
  requestKey?: string;
}

// Stores validated + estimated ROAS for the currently-visible campaigns.
// Populated by fetchVisibleCampaignRoas; consumed by CampaignManagementTable.
type CampaignRoasById = Record<string, CampaignRoas>;
interface VisibleCampaignRoasState extends RequestStateType<CampaignRoasById> {
  requestKey?: string;
}

interface CampaignFetchResult {
  campaigns: Campaign[];
  requestTimestamp: string;
}

interface FilterState {
  filteredCampaignIds?: Set<string>;
  isLoading: boolean;
}

interface TableRowsStateType {
  adToggleLoadingMap: Map<string, boolean>;
  campaignToggleLoadingDueToAdToggleMap: Map<string, boolean>;
  campaignToggleLoadingMap: Map<string, boolean>;
}

interface DateSelectionStateType {
  currentSelection: DateFilteringTimePeriod;
  // YYYY-MM-DD strings; only populated when currentSelection === CUSTOM. These
  // are threaded straight through to AMA (`custom_start_date` / `custom_end_date`)
  // and to the CAaaS chart query range in the advertiser timezone.
  customEndDate?: string;
  customStartDate?: string;
  isError: boolean;
}

interface ReportingViewStateType {
  currentSelection: ReportingViewType;
  isError: boolean;
}

interface CampaignNameFilterState {
  campaignNameSearch?: string;
  isError: boolean;
}

interface UniversePickerFilterState {
  isError: boolean;
  universeFilter: AdvertisedUniverse;
}

interface SponsoredAdsPageStateType {
  advertisedUniversesState: RequestStateType<AdvertisedUniverse[]>;
  campaignDetailsState: CampaignDetailsStateType;
  campaignNameFilterState: CampaignNameFilterState;
  campaignsState: RequestStateType<Campaign[]>;
  dateSelectionState: DateSelectionStateType;
  filteredIdsState: FilterState;
  reportingRequestTimestamp: string;
  reportingViewState: ReportingViewStateType;
  statusesState: DisplayStatusesStateType;
  summaryRequestTimestamp: string;
  summaryStatsState: EmptyRequestStateType<AdAccountSummary>;
  tableRowsState: TableRowsStateType;
  universePickerFilterState: UniversePickerFilterState;
  visibleCampaignRoasState: VisibleCampaignRoasState;
  visibleCampaignStatsState: VisibleStatsState;
}

interface FilteredCampaignIdsRequest {
  abortSignal?: AbortSignal;
  newCampaignNameSearch?: string;
  newUniverseId?: number;
}

/** Mirrors AMS wildcard text search on campaign.name.keyword: case-insensitive substring match. */
const matchesCampaignNameSearch = (campaignName: string, searchTerm: string): boolean =>
  campaignName.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase());

const filterCampaignIdsLocally = (
  campaigns: Campaign[],
  campaignNameSearch?: string,
  universeId?: number,
): Set<string> | undefined => {
  if (!campaignNameSearch && !universeId) {
    return undefined;
  }

  const matchingIds = campaigns
    .filter((campaign) => {
      if (universeId !== undefined && campaign.universe_id !== universeId) {
        return false;
      }
      if (campaignNameSearch && !matchesCampaignNameSearch(campaign.name, campaignNameSearch)) {
        return false;
      }
      return true;
    })
    .map((campaign) => campaign.id);

  return new Set(matchingIds);
};

export interface FetchInitialDataOptions {
  initialUniverseId?: number;
  workspace?: {
    creatorId: number;
    creatorType: 'Group' | 'User';
  };
}

const getShouldUseWorkspaceUniverseFiltering = (): boolean =>
  useAppStore.getState().shouldUseWorkspaceUniverseFiltering();

const getShouldUseCaaSReportingStats = (): boolean =>
  shouldUseCaaSReportingStats(useAppStore.getState());

const getShouldUseCustomDateRange = (): boolean => shouldUseCustomDateRange(useAppStore.getState());

const getIsCampaignRoasEnabled = (): boolean =>
  useAppStore.getState().appMetadataState.data?.isCampaignRoasEnabled ?? false;

const getSummaryUniverseId = (universe: AdvertisedUniverse): number | undefined =>
  universe.universe_id === 0 ? undefined : universe.universe_id;

interface SponsoredAdsPageActionType {
  cancelCampaign: (campaignId: string) => Promise<void>;
  // Resets
  closeDrawer: () => void;
  // Commit half of the control-arm date-change flow (fetch half is
  // `refetchForDateSelection`). On error, keeps the prior selection and
  // only flips `isError` so retry re-dispatches the same request.
  commitDateSelection: (
    newDateSelection: DateFilteringTimePeriod,
    customStartDate: string | undefined,
    customEndDate: string | undefined,
    isError: boolean,
  ) => void;
  commitPendingStatusChanges: (entityType: EntityType) => void;
  fetchCampaignTimeSeries: (
    timePeriod: DateFilteringTimePeriod,
    customStartDate?: string,
    customEndDate?: string,
  ) => Promise<void>;
  fetchInitialData: (
    createdFirstCampaign: boolean,
    campaignId?: string,
    options?: FetchInitialDataOptions,
  ) => Promise<void>;
  fetchVisibleAdStats: (adIds: string[]) => Promise<void>;
  fetchVisibleCampaignReporting: (campaignIds: string[]) => Promise<void>;
  fetchVisibleCampaignRoas: (campaignIds: string[]) => Promise<void>;
  fetchVisibleCampaignStats: (campaignIds: string[]) => Promise<void>;
  getAdsAndOpenDrawer: (
    campaignId: string,
    openDrawer?: boolean,
    isOffPlatformCampaign?: boolean,
  ) => void;

  getAndUpdateDisplayStatuses: (
    campaignId: string,
    adId?: string,
  ) => Promise<GetUpdatedStatusesResponseType>;

  getCampaignStatuses: (campaignIds: string[]) => void;
  getDateFilteredCampaigns: (
    dateSelection: DateFilteringTimePeriod,
    reportingView: ReportingViewType,
    abortSignal?: AbortSignal,
    customStartDate?: string,
    customEndDate?: string,
    universeIds?: number[],
    requestTimestamp?: string,
  ) => Promise<CampaignFetchResult>;
  getFilteredCampaignIds: (request: FilteredCampaignIdsRequest) => Promise<Set<string> | undefined>;
  getSummaryStats: (
    dateSelection: DateFilteringTimePeriod,
    reportingView: ReportingViewType,
    universeId?: number,
    abortSignal?: AbortSignal,
    customStartDate?: string,
    customEndDate?: string,
    requestTimestamp?: string,
  ) => Promise<AdAccountSummary | undefined>;
  // --> Promise.all(getFilteredCampaignIds, getSummaryStats, getDateFilteredCampaigns)
  handleCampaignNameSearchChange: (newCampaignNameSearch: string) => void;
  // Control-arm entry point: `refetchForDateSelection` + `commitDateSelection`.
  // Treatment arm calls `refetchForDateSelection` directly (URL is the source
  // of truth, no store commit).
  handleDateSelectionChange: (
    newDateSelection: DateFilteringTimePeriod,
    customStartDate?: string,
    customEndDate?: string,
  ) => void;
  // --> Promise.all(getDateFilteredCampaigns, getSummaryStats)
  handleReportingViewChange: (newReportingView: ReportingViewType) => void;
  handleUniversePickerChange: (universe: AdvertisedUniverse) => void;
  refetchCampaignsAndSummary: (params: {
    customEndDate?: string;
    customStartDate?: string;
    dateSelection: DateFilteringTimePeriod;
    onError: (draft: NewFlowStoreType) => void;
    onSuccess: (
      fetchedCampaigns: Campaign[],
      summaryStats: AdAccountSummary | undefined,
      draft: NewFlowStoreType,
    ) => void;
    reportingView: ReportingViewType;
    universeIds?: number[];
    universeId?: number;
  }) => Promise<boolean>;
  // Fetches campaigns + summary (and best-effort drawer sync on success).
  // Does not write `dateSelectionState`; callers can chain
  // `commitDateSelection`. Resolves to the fetch success flag.
  refetchForDateSelection: (
    newDateSelection: DateFilteringTimePeriod,
    customStartDate?: string,
    customEndDate?: string,
  ) => Promise<boolean>;
  resetFilterState: () => void;
  retryCampaigns: () => Promise<void>;
  retrySummaryStats: () => Promise<void>;
  toggleAd: (
    adId: string,
    toggleTo: ServerAdStatusType.STOPPED | ServerAdStatusType.ENABLED,
  ) => Promise<void>;

  toggleCampaign: (
    campaignId: string,
    toggleTo: ServerCampaignStatusType.STOPPED | ServerCampaignStatusType.ENABLED,
  ) => Promise<void>;
  // --> getFilteredCampaignIds
  updateCampaignStatus: (
    campaignId: string,
    updateStatusTo: UpdatedCampaignStatus,
  ) => Promise<void>;
}

export interface NewFlowStoreType extends SponsoredAdsPageStateType, SponsoredAdsPageActionType {}

// Create request manager outside the store to persist across renders
// Shared by date, reporting view, and universe picker to ensure only the most recent filter change is applied
const dateReportingViewRequestManager = createRequestManager();
const frontendSummaryRequestManager = createRequestManager();
const initialBackendSummaryRequestManager = createRequestManager();
const campaignTimeSeriesRequestManager = createRequestManager();
const visibleAdStatsRequestManager = createRequestManager();
const visibleCampaignStatsRequestManager = createRequestManager();
const visibleCampaignRoasRequestManager = createRequestManager();

const fetchFrontendStatsForEntities = async ({
  customEndDate,
  customStartDate,
  entities,
  entityType,
  reportingView,
  requestTimestamp,
  timePeriod,
}: {
  customEndDate?: string;
  customStartDate?: string;
  entities: { id: string; paymentType: ServerPaymentType; universeId?: number }[];
  entityType: 'ad' | 'campaign';
  reportingView: ReportingViewType;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
}): Promise<FrontendReportingStatsById> => {
  const shouldUseWorkspaceUniverseFiltering = getShouldUseWorkspaceUniverseFiltering();
  const adAccountId = useAppStore.getState().appData?.adAccountId;
  if (!shouldUseWorkspaceUniverseFiltering && !adAccountId) {
    return {};
  }
  const entitiesByUniverse = new Map<
    number,
    { id: string; paymentType: ServerPaymentType; universeId?: number }[]
  >();
  entities.forEach((entity) => {
    if (entity.universeId === undefined) {
      return;
    }
    const existing = entitiesByUniverse.get(entity.universeId) ?? [];
    existing.push(entity);
    entitiesByUniverse.set(entity.universeId, existing);
  });

  const caasResults = shouldUseWorkspaceUniverseFiltering
    ? await Promise.all(
        Array.from(entitiesByUniverse.entries()).map(async ([universeId, groupedEntities]) => {
          const context = {
            customEndDate,
            customStartDate,
            entityIds: groupedEntities.map(({ id }) => id),
            entityType,
            reportingView,
            requestTimestamp,
            timePeriod,
            universeId,
          };
          return getUniverseCaaSReportingStats(context);
        }),
      )
    : [
        await getAdAccountCaaSReportingStats({
          adAccountId: adAccountId!,
          customEndDate,
          customStartDate,
          entityIds: entities.map(({ id }) => id),
          entityType,
          reportingView,
          requestTimestamp,
          timePeriod,
        }),
      ];

  const frontendStats: FrontendReportingStatsById = {};
  caasResults.forEach((results) => {
    Object.entries(results).forEach(([id, caas]) => {
      const entity = entities.find((candidate) => candidate.id === id);
      frontendStats[id] = buildFrontendReportingStats({
        caas,
        paymentType: entity?.paymentType,
      });
    });
  });
  return frontendStats;
};

const fetchFrontendSummaryStats = async ({
  abortSignal,
  backendSummary,
  campaigns,
  customEndDate,
  customStartDate,
  reportingView,
  requestTimestamp,
  timePeriod,
  universeId,
  universeIds: requestedUniverseIds,
}: {
  abortSignal?: AbortSignal;
  backendSummary?: AdAccountSummary;
  campaigns: Campaign[];
  customEndDate?: string;
  customStartDate?: string;
  reportingView: ReportingViewType;
  requestTimestamp: string;
  timePeriod: DateFilteringTimePeriod;
  universeId?: number;
  universeIds?: number[];
}): Promise<AdAccountSummary | undefined> => {
  const shouldUseWorkspaceUniverseFiltering = getShouldUseWorkspaceUniverseFiltering();
  const adAccountId = useAppStore.getState().appData?.adAccountId;
  const universeIds =
    requestedUniverseIds ??
    (universeId
      ? [universeId]
      : Array.from(
          new Set(
            campaigns
              .map((campaign) => campaign.universe_id)
              .filter((id): id is number => id !== undefined),
          ),
        ));
  const universeIdSet = new Set(universeIds);
  let scopedCampaigns = campaigns;
  if (shouldUseWorkspaceUniverseFiltering) {
    scopedCampaigns = campaigns.filter(
      (campaign) => campaign.universe_id !== undefined && universeIdSet.has(campaign.universe_id),
    );
  } else if (universeId !== undefined) {
    scopedCampaigns = campaigns.filter((campaign) => campaign.universe_id === universeId);
  }
  if (shouldUseWorkspaceUniverseFiltering && universeIds.length === 0) {
    return backendSummary;
  }
  if (!shouldUseWorkspaceUniverseFiltering && !adAccountId) {
    return backendSummary;
  }
  const scopedAdAccountCampaignIds =
    !shouldUseWorkspaceUniverseFiltering && universeId !== undefined
      ? scopedCampaigns.map(({ id }) => id)
      : undefined;
  let caasResults: CaaSReportingStatsResult[];
  if (shouldUseWorkspaceUniverseFiltering) {
    caasResults = await Promise.all(
      universeIds.map(async (id) => {
        const results = await getUniverseCaaSReportingStats({
          abortSignal,
          customEndDate,
          customStartDate,
          reportingView,
          requestTimestamp,
          timePeriod,
          universeId: id,
        });
        return results.summary!;
      }),
    );
  } else if (scopedAdAccountCampaignIds?.length === 0) {
    caasResults = [];
  } else {
    const results = await getAdAccountCaaSReportingStats({
      abortSignal,
      adAccountId: adAccountId!,
      customEndDate,
      customStartDate,
      entityIds: scopedAdAccountCampaignIds,
      entityType: scopedAdAccountCampaignIds ? 'campaign' : undefined,
      reportingView,
      requestTimestamp,
      timePeriod,
    });
    caasResults = scopedAdAccountCampaignIds
      ? Object.entries(results).map(([campaignId, result]) => ({
          ...result,
          campaignSpendMicroUsd: {
            [campaignId]: result.stats.spendMicroUsd,
          },
        }))
      : [results.summary!];
  }
  const caasTotal = caasResults.reduce<CaaSReportingStatsResult>(
    (total, result) => ({
      campaignSpendMicroUsd: {
        ...total.campaignSpendMicroUsd,
        ...result.campaignSpendMicroUsd,
      },
      failedMetrics: Array.from(new Set([...total.failedMetrics, ...result.failedMetrics])),
      stats: {
        clickCount: total.stats.clickCount + result.stats.clickCount,
        fifteenSecVideoViewCount:
          total.stats.fifteenSecVideoViewCount + result.stats.fifteenSecVideoViewCount,
        impressionCount: total.stats.impressionCount + result.stats.impressionCount,
        playCount: total.stats.playCount + result.stats.playCount,
        playTimeSeconds7d: total.stats.playTimeSeconds7d + result.stats.playTimeSeconds7d,
        robuxRevenue30d: total.stats.robuxRevenue30d + result.stats.robuxRevenue30d,
        spendMicroUsd: total.stats.spendMicroUsd + result.stats.spendMicroUsd,
        twoSecVideoViewCount: total.stats.twoSecVideoViewCount + result.stats.twoSecVideoViewCount,
      },
    }),
    {
      campaignSpendMicroUsd: {},
      failedMetrics: [],
      stats: {
        clickCount: 0,
        fifteenSecVideoViewCount: 0,
        impressionCount: 0,
        playCount: 0,
        playTimeSeconds7d: 0,
        robuxRevenue30d: 0,
        spendMicroUsd: 0,
        twoSecVideoViewCount: 0,
      },
    },
  );
  const frontendStats = buildFrontendReportingStats({ caas: caasTotal });
  const campaignsById = new Map(scopedCampaigns.map((campaign) => [campaign.id, campaign]));
  let adCreditSpendMicroUsd = 0;
  let usdSpendMicroUsd = 0;
  const addCampaignSpend = (campaignId: string, spendMicroUsd: number): void => {
    if (spendMicroUsd === 0) {
      return;
    }
    const paymentType = campaignsById.get(campaignId)?.payment_type;
    if (paymentType !== undefined && isAdCreditPaymentType(paymentType)) {
      adCreditSpendMicroUsd += spendMicroUsd;
    } else if (
      paymentType === ServerPaymentType.PAYMENT_TYPE_CARD ||
      paymentType === ServerPaymentType.PAYMENT_TYPE_INVOICE
    ) {
      usdSpendMicroUsd += spendMicroUsd;
    }
  };
  Object.entries(caasTotal.campaignSpendMicroUsd ?? {}).forEach(([campaignId, spendMicroUsd]) => {
    addCampaignSpend(campaignId, spendMicroUsd);
  });
  const hasSpendQueryFailure = caasTotal.failedMetrics.includes('spendMicroUsd');
  const adCreditDisplaySpending = hasSpendQueryFailure
    ? backendSummary?.ad_credit_display_spending
    : getDisplaySpendUsd(adCreditSpendMicroUsd);
  const usdDisplaySpending = hasSpendQueryFailure
    ? backendSummary?.usd_display_spending
    : getDisplaySpendUsd(usdSpendMicroUsd);

  const frontendSummary = {
    ad_credit_display_spending: adCreditDisplaySpending,
    impression_count: frontendStats.performance?.impression,
    play_count: frontendStats.performance?.play_count,
    total_play_time_hours_7d: frontendStats.performance?.total_play_time_hours_7d,
    usd_display_spending: usdDisplaySpending,
  };
  return frontendSummary;
};

export const useNewFlowStore = create<NewFlowStoreType>()(
  immer((set, get) => ({
    advertisedUniversesState: GetInitialRequestState<AdvertisedUniverse[]>([]),
    campaignDetailsState: {
      adsState: GetInitialRequestState<Ad[]>([]),
      campaign: undefined,
      timeSeriesPeriod: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_SEVEN_DAYS,
      timeSeriesState: GetEmptyRequestState<CampaignTimeSeries>(),
      uploadedCreatives: undefined,
      visibleStatsState: GetInitialRequestState<FrontendReportingStatsById>({}),
    },
    campaignNameFilterState: { isError: false },
    campaignsState: GetInitialRequestState<Campaign[]>([]),
    cancelCampaign: async (campaignId: string) =>
      get().updateCampaignStatus(campaignId, ServerCampaignStatusType.CANCELLED),
    closeDrawer: () => {
      set((draft) => {
        draft.campaignDetailsState.campaign = undefined;
        draft.campaignDetailsState.adsState = GetInitialRequestState<Ad[]>([]);
        draft.campaignDetailsState.timeSeriesPeriod = get().dateSelectionState.currentSelection;
        draft.campaignDetailsState.timeSeriesState = GetEmptyRequestState<CampaignTimeSeries>();
        draft.campaignDetailsState.uploadedCreatives = undefined;
        draft.campaignDetailsState.visibleStatsState =
          GetInitialRequestState<FrontendReportingStatsById>({});
        campaignTimeSeriesRequestManager.cancel();
        visibleAdStatsRequestManager.cancel();
      });
    },
    commitDateSelection: (
      newDateSelection: DateFilteringTimePeriod,
      customStartDate: string | undefined,
      customEndDate: string | undefined,
      isError: boolean,
    ) => {
      const isCustom =
        newDateSelection === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
      set((draft) => {
        if (isError) {
          // Preserve prior selection so retry re-dispatches the same request.
          draft.dateSelectionState.isError = true;
          return;
        }
        draft.dateSelectionState = {
          currentSelection: newDateSelection,
          customEndDate: isCustom ? customEndDate : undefined,
          customStartDate: isCustom ? customStartDate : undefined,
          isError: false,
        };
      });
    },
    commitPendingStatusChanges: (entityType: EntityType) => {
      // Zustand is smart and doesn't trigger re-render if object reference is the same
      if (entityType === EntityType.ENTITY_TYPE_AD) {
        set((draft) => {
          draft.statusesState.adStatuses = get().statusesState.updatedAdStatuses;
        });
      } else if (entityType === EntityType.ENTITY_TYPE_CAMPAIGN) {
        set((draft) => {
          draft.statusesState.campaignStatuses = get().statusesState.updatedCampaignStatuses;
        });
      }
    },
    // Control-arm default. Treatment reads from the URL and seeds first-load
    // fetches via `resolveDefaultTreatmentSelection`; delete slice at 100%.
    dateSelectionState: {
      currentSelection: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_SEVEN_DAYS,
      isError: false,
    },
    fetchCampaignTimeSeries: async (
      timePeriod: DateFilteringTimePeriod,
      customStartDate?: string,
      customEndDate?: string,
    ) => {
      const { campaign } = get().campaignDetailsState;
      const adAccountId = useAppStore.getState().appData?.adAccountId;
      const shouldUseWorkspaceUniverseFiltering = getShouldUseWorkspaceUniverseFiltering();
      let resource: AnalyticsReportingResource | undefined;
      if (shouldUseWorkspaceUniverseFiltering && campaign?.universe_id !== undefined) {
        resource = { id: campaign.universe_id, type: 'universe' };
      } else if (adAccountId) {
        resource = { id: adAccountId, type: 'adAccount' };
      }
      if (!campaign || !resource) {
        set((draft) => {
          draft.campaignDetailsState.timeSeriesState = {
            data: undefined,
            isError: false,
            isLoading: false,
          };
        });
        return;
      }

      const requestCampaignId = campaign.id;
      const requestReportingView = get().reportingViewState.currentSelection;
      const isStale = () => {
        const s = get().campaignDetailsState;
        return (
          s.campaign?.id !== requestCampaignId ||
          s.timeSeriesPeriod !== timePeriod ||
          get().reportingViewState.currentSelection !== requestReportingView
        );
      };

      set((draft) => {
        draft.campaignDetailsState.timeSeriesPeriod = timePeriod;
        draft.campaignDetailsState.timeSeriesState = {
          data: undefined,
          isError: false,
          isLoading: true,
        };
      });

      try {
        const reportingMetadata = useAppStore.getState().appMetadataState?.data;

        const timeSeries = await campaignTimeSeriesRequestManager.executeRequest(() =>
          getCampaignTimeSeries({
            aggregationType: reportingMetadata?.isAttributionDateAggregationEnabled
              ? 'attributionDate'
              : 'default',
            campaignId: requestCampaignId,
            customEndDate,
            customStartDate,
            isRoasEnabled: reportingMetadata?.isCampaignRoasEnabled ?? false,
            reportingView: requestReportingView,
            requestTimestamp: get().reportingRequestTimestamp,
            resource,
            timePeriod,
            timezoneDbName: REPORTING_TIMEZONE_DB_NAME,
            unifiedAttributionCutoverDate: getShouldUseCaaSReportingStats()
              ? FRONTEND_REPORTING_CAAS_START_DATE
              : reportingMetadata?.unifiedAttributionCutoverDate,
          }),
        );
        if (!timeSeries || isStale()) {
          return;
        }
        set((draft) => {
          draft.campaignDetailsState.timeSeriesState = {
            data: timeSeries,
            isError: false,
            isLoading: false,
          };
        });
      } catch (error) {
        if (isStale()) {
          return;
        }
        set((draft) => {
          draft.campaignDetailsState.timeSeriesState = {
            data: undefined,
            isError: true,
            isLoading: false,
          };
        });
        CaptureException(error, { context: 'fetchCampaignTimeSeries' });
      }
    },
    fetchInitialData: (createdFirstCampaign: boolean, campaignId?: string, options?) => {
      const shouldUseWorkspaceUniverseFiltering = getShouldUseWorkspaceUniverseFiltering();
      // Treatment: honor bookmarked URL, else fall back to the default.
      // Control: ignore URL, use the slice's own SEVEN_DAYS default.
      const treatmentSelection = getShouldUseCustomDateRange()
        ? (parseDateSelectionFromWindowLocation() ?? resolveDefaultTreatmentSelection())
        : undefined;
      const initialDateSelection =
        treatmentSelection?.currentSelection ?? get().dateSelectionState.currentSelection;
      const initialCustomStart =
        treatmentSelection?.customStartDate ?? get().dateSelectionState.customStartDate;
      const initialCustomEnd =
        treatmentSelection?.customEndDate ?? get().dateSelectionState.customEndDate;
      const initialReportingView = get().reportingViewState.currentSelection;
      const { initialUniverseId, workspace } = options ?? {};

      set((draft) => {
        draft.campaignsState.isLoading = true;
        draft.summaryStatsState.isLoading = true;
        draft.advertisedUniversesState.isLoading = true;
        if (shouldUseWorkspaceUniverseFiltering) {
          draft.filteredIdsState = {
            isLoading: false,
          };
        }
      });

      const fetchCampaignsAndSummary = (
        universeFilter: AdvertisedUniverse,
        pickerUniverses: AdvertisedUniverse[],
      ): Promise<void> => {
        const universeIds = shouldUseWorkspaceUniverseFiltering
          ? resolveUniverseIdsForDateFilter(universeFilter, pickerUniverses)
          : undefined;
        const summaryUniverseId = getSummaryUniverseId(universeFilter);
        const reportingRequestTimestamp = new Date().toISOString();

        const campaignsPromise = get().getDateFilteredCampaigns(
          initialDateSelection,
          initialReportingView,
          undefined,
          initialCustomStart,
          initialCustomEnd,
          universeIds,
          reportingRequestTimestamp,
        );
        const shouldUseFrontendSummary = getShouldUseCaaSReportingStats();
        const summaryPromise =
          shouldUseFrontendSummary && shouldUseWorkspaceUniverseFiltering
            ? Promise.resolve(undefined)
            : initialBackendSummaryRequestManager
                .executeRequest((abortSignal) =>
                  get().getSummaryStats(
                    initialDateSelection,
                    initialReportingView,
                    summaryUniverseId,
                    abortSignal,
                    initialCustomStart,
                    initialCustomEnd,
                    reportingRequestTimestamp,
                  ),
                )
                .then((summary) => summary ?? undefined);

        const filteredIdsPromise =
          !shouldUseWorkspaceUniverseFiltering && universeFilter.universe_id !== 0
            ? get().getFilteredCampaignIds({
                newCampaignNameSearch: undefined,
                newUniverseId: universeFilter.universe_id,
              })
            : Promise.resolve(undefined);

        set((draft) => {
          draft.reportingRequestTimestamp = reportingRequestTimestamp;
          draft.summaryRequestTimestamp = reportingRequestTimestamp;
          draft.universePickerFilterState.universeFilter = universeFilter;
          draft.universePickerFilterState.isError = false;
        });

        const campaignsUpdate = campaignsPromise
          .then((fetchResult) => {
            if (get().summaryRequestTimestamp !== reportingRequestTimestamp) {
              return;
            }
            set((draft) => {
              draft.campaignsState.data = fetchResult.campaigns;
              draft.campaignsState.isError = false;
            });
            if (campaignId) {
              get().getAdsAndOpenDrawer(campaignId);
            }
          })
          .catch(() => {
            if (get().summaryRequestTimestamp !== reportingRequestTimestamp) {
              return;
            }
            set((draft) => {
              draft.campaignsState.isError = true;
            });
          })
          .finally(() => {
            if (get().summaryRequestTimestamp !== reportingRequestTimestamp) {
              return;
            }
            set((draft) => {
              draft.campaignsState.isLoading = false;
            });
          });

        const summaryUpdate = summaryPromise
          .then(async (backendSummary) => {
            let frontendSummary: AdAccountSummary | undefined;
            if (shouldUseFrontendSummary) {
              try {
                frontendSummary =
                  (await frontendSummaryRequestManager.executeRequest(async (abortSignal) =>
                    fetchFrontendSummaryStats({
                      abortSignal,
                      backendSummary,
                      campaigns: (await campaignsPromise).campaigns,
                      customEndDate: initialCustomEnd,
                      customStartDate: initialCustomStart,
                      reportingView: initialReportingView,
                      requestTimestamp: reportingRequestTimestamp,
                      timePeriod: initialDateSelection,
                      universeId: summaryUniverseId,
                      universeIds,
                    }),
                  )) ?? undefined;
              } catch (error) {
                CaptureException(error, { context: 'fetchInitialFrontendSummary' });
                if (!backendSummary) {
                  throw error;
                }
              }
            }
            if (get().summaryRequestTimestamp !== reportingRequestTimestamp) {
              return;
            }
            set((draft) => {
              draft.summaryStatsState.data =
                shouldUseFrontendSummary && frontendSummary ? frontendSummary : backendSummary;
              draft.summaryStatsState.isError = false;
            });
          })
          .catch((error) => {
            if (get().summaryRequestTimestamp !== reportingRequestTimestamp) {
              return;
            }
            set((draft) => {
              draft.summaryStatsState.isError = true;
            });
            CaptureException(error, { context: 'fetchInitialSummary' });
          })
          .finally(() => {
            if (get().summaryRequestTimestamp !== reportingRequestTimestamp) {
              return;
            }
            set((draft) => {
              draft.summaryStatsState.isLoading = false;
            });
          });

        const filteredIdsUpdate = filteredIdsPromise
          .then((filteredCampaignIds) => {
            if (get().summaryRequestTimestamp !== reportingRequestTimestamp) {
              return;
            }
            set((draft) => {
              draft.filteredIdsState = {
                filteredCampaignIds,
                isLoading: false,
              };
            });
          })
          .catch(() => {
            if (get().summaryRequestTimestamp !== reportingRequestTimestamp) {
              return;
            }
            set((draft) => {
              draft.filteredIdsState.isLoading = false;
            });
          });

        return Promise.all([campaignsUpdate, summaryUpdate, filteredIdsUpdate]).then(
          () => undefined,
        );
      };

      const markAdvertisedUniversesReady = () => {
        set((draft) => {
          draft.advertisedUniversesState.isLoading = false;
        });
      };

      const applyUniversesToPicker = (
        rawUniverses: AdvertisedUniverse[],
        onUniversesReady: (pickerUniverses: AdvertisedUniverse[]) => void | Promise<void>,
      ): void | Promise<void> => {
        useThumbnailStore
          .getState()
          .getThumbnailsBatch(rawUniverses.map((universe) => universe.universe_id));

        if (rawUniverses.length === 0) {
          if (shouldUseWorkspaceUniverseFiltering && workspace) {
            set((draft) => {
              draft.advertisedUniversesState.data = [];
              draft.advertisedUniversesState.isError = false;
              draft.campaignsState = {
                data: [],
                isError: false,
                isLoading: false,
              };
              draft.summaryStatsState = {
                data: undefined,
                isError: false,
                isLoading: false,
              };
              draft.universePickerFilterState = {
                isError: false,
                universeFilter: defaultAdvertisedUniverse,
              };
            });
            markAdvertisedUniversesReady();
            return undefined;
          }
          if (createdFirstCampaign) {
            const fallbackUniverses = [defaultAdvertisedUniverse];
            set((draft) => {
              draft.advertisedUniversesState.data = fallbackUniverses;
              draft.advertisedUniversesState.isError = false;
            });
            logNativeImpressionEvent(EventName.NoAdvertisedUniversesFetched);
            markAdvertisedUniversesReady();
            return onUniversesReady(fallbackUniverses);
          }
          set((draft) => {
            draft.advertisedUniversesState.data = [];
            draft.advertisedUniversesState.isError = true;
          });
          markAdvertisedUniversesReady();
          return onUniversesReady([defaultAdvertisedUniverse]);
        }

        const pickerUniverses = shouldUseWorkspaceUniverseFiltering
          ? rawUniverses
          : buildPickerUniversesWithAllOption(rawUniverses);
        set((draft) => {
          draft.advertisedUniversesState.data = pickerUniverses;
          draft.advertisedUniversesState.isError = false;
        });
        markAdvertisedUniversesReady();
        return onUniversesReady(pickerUniverses);
      };

      if (shouldUseWorkspaceUniverseFiltering && workspace) {
        return searchOwnedUniverses({
          creatorTargetId: workspace.creatorId,
          creatorType: workspace.creatorType,
        })
          .then((ownedUniverses) =>
            applyUniversesToPicker(ownedUniverses, (pickerUniverses) => {
              const universeFilter = resolveInitialUniverseFilter(
                pickerUniverses,
                initialUniverseId,
              );
              return fetchCampaignsAndSummary(universeFilter, pickerUniverses);
            }),
          )
          .catch(() => {
            set((draft) => {
              draft.advertisedUniversesState = {
                data: [],
                isError: true,
                isLoading: false,
              };
              draft.campaignsState = {
                data: [],
                isError: false,
                isLoading: false,
              };
              draft.summaryStatsState = {
                data: undefined,
                isError: false,
                isLoading: false,
              };
              draft.universePickerFilterState = {
                isError: true,
                universeFilter: defaultAdvertisedUniverse,
              };
            });
            return undefined;
          });
      }

      return listAdvertisedUniverses()
        .then((fetchedUniverses) =>
          applyUniversesToPicker(fetchedUniverses.advertised_universes, (pickerUniverses) => {
            const universeFilter = resolveInitialUniverseFilter(pickerUniverses, initialUniverseId);
            return fetchCampaignsAndSummary(universeFilter, pickerUniverses);
          }),
        )
        .catch(() => {
          set((draft) => {
            draft.advertisedUniversesState.isError = true;
            draft.advertisedUniversesState.isLoading = false;
          });
          return fetchCampaignsAndSummary(defaultAdvertisedUniverse, [defaultAdvertisedUniverse]);
        });
    },
    fetchVisibleAdStats: async (adIds: string[]) => {
      if (!getShouldUseCaaSReportingStats() || adIds.length === 0) {
        return;
      }
      const { campaign } = get().campaignDetailsState;
      if (!campaign) {
        return;
      }
      const {
        currentSelection: timePeriod,
        customEndDate: storedCustomEndDate,
        customStartDate: storedCustomStartDate,
      } = get().dateSelectionState;
      const isCustom = timePeriod === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
      const customEndDate = isCustom ? storedCustomEndDate : undefined;
      const customStartDate = isCustom ? storedCustomStartDate : undefined;
      const requestKey = JSON.stringify({
        adIds,
        campaignId: campaign.id,
        customEndDate,
        customStartDate,
        reportingView: get().reportingViewState.currentSelection,
        requestTimestamp: get().reportingRequestTimestamp,
        timePeriod,
      });
      if (get().campaignDetailsState.visibleStatsState.requestKey === requestKey) {
        return;
      }
      set((draft) => {
        draft.campaignDetailsState.visibleStatsState = {
          data: draft.campaignDetailsState.visibleStatsState.data ?? {},
          isError: false,
          isLoading: true,
          requestKey,
        };
      });
      try {
        const ads = get().campaignDetailsState.adsState.data ?? [];
        const adsById = new Map(ads.map((ad) => [ad.id, ad]));
        const result = await visibleAdStatsRequestManager.executeRequest(() =>
          fetchFrontendStatsForEntities({
            customEndDate,
            customStartDate,
            entities: adIds
              .map((id) => adsById.get(id))
              .filter((ad): ad is Ad => ad !== undefined)
              .map((ad) => ({
                id: ad.id,
                paymentType: campaign.payment_type,
                universeId: campaign.universe_id,
              })),
            entityType: 'ad',
            reportingView: get().reportingViewState.currentSelection,
            requestTimestamp: get().reportingRequestTimestamp,
            timePeriod,
          }),
        );
        if (result === null) {
          return;
        }
        set((draft) => {
          draft.campaignDetailsState.visibleStatsState = {
            data: result,
            isError: false,
            isLoading: false,
            requestKey,
          };
        });
      } catch (error) {
        set((draft) => {
          draft.campaignDetailsState.visibleStatsState.isError = true;
          draft.campaignDetailsState.visibleStatsState.isLoading = false;
        });
        CaptureException(error, { context: 'fetchVisibleAdStats' });
      }
    },
    // Composite viewport loader for CampaignManagementTable. Each callee
    // self-gates on its feature flag, so this is safe to invoke unconditionally.
    fetchVisibleCampaignReporting: async (campaignIds: string[]) => {
      await Promise.all([
        get().fetchVisibleCampaignStats(campaignIds),
        get().fetchVisibleCampaignRoas(campaignIds),
      ]);
    },
    fetchVisibleCampaignRoas: async (campaignIds: string[]) => {
      // Sole loader for the ROAS column; always sources from AQG.
      const reportingView = get().reportingViewState.currentSelection;
      if (
        !getIsCampaignRoasEnabled() ||
        reportingView !== ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT ||
        campaignIds.length === 0
      ) {
        return;
      }
      const shouldUseWorkspaceUniverseFiltering = getShouldUseWorkspaceUniverseFiltering();
      const adAccountId = useAppStore.getState().appData?.adAccountId;
      const campaigns = get().campaignsState.data ?? [];
      const campaignsById = new Map(campaigns.map((c) => [c.id, c]));
      const {
        currentSelection: timePeriod,
        customEndDate: storedCustomEndDate,
        customStartDate: storedCustomStartDate,
      } = get().dateSelectionState;
      const isCustom = timePeriod === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
      const customEndDate = isCustom ? storedCustomEndDate : undefined;
      const customStartDate = isCustom ? storedCustomStartDate : undefined;
      const requestTimestamp = get().reportingRequestTimestamp;
      const { endTime } = getFrontendReportingTimeSeriesRange(
        requestTimestamp,
        timePeriod,
        customStartDate,
        customEndDate,
      );
      // One AQG batch per (resource, source). Source is per-campaign so
      // campaigns ended >30d ago surface validated AdsUARoas even when the
      // range ends today.
      const adAccountResource: AnalyticsReportingResource | undefined = adAccountId
        ? { id: adAccountId, type: 'adAccount' }
        : undefined;
      const groups = new Map<
        string,
        {
          entityIds: string[];
          resource: AnalyticsReportingResource;
          source: 'validated' | 'estimated';
        }
      >();
      const universeResource = (
        campaign: Campaign | undefined,
      ): AnalyticsReportingResource | undefined =>
        campaign?.universe_id !== undefined
          ? { id: campaign.universe_id, type: 'universe' }
          : undefined;
      campaignIds.forEach((id) => {
        const campaign = campaignsById.get(id);
        const resource: AnalyticsReportingResource | undefined = shouldUseWorkspaceUniverseFiltering
          ? universeResource(campaign)
          : adAccountResource;
        if (!resource) {
          return;
        }
        const source = isValidatedRoasEligible(campaign?.end_timestamp_ms, endTime)
          ? 'validated'
          : 'estimated';
        const key = `${resource.type}:${resource.id}:${source}`;
        const bucket = groups.get(key) ?? { entityIds: [], resource, source };
        bucket.entityIds.push(id);
        groups.set(key, bucket);
      });
      const batches = Array.from(groups.values());
      if (batches.length === 0) {
        // Clear isLoading so the ROAS cell doesn't render a permanent skeleton
        // (workspace mode with no universe_id, or ad-account mode with none).
        set((draft) => {
          draft.visibleCampaignRoasState = {
            data: draft.visibleCampaignRoasState.data ?? {},
            isError: false,
            isLoading: false,
          };
        });
        return;
      }
      const requestKey = JSON.stringify({
        batches,
        customEndDate,
        customStartDate,
        reportingView,
        requestTimestamp,
        timePeriod,
      });
      if (get().visibleCampaignRoasState.requestKey === requestKey) {
        return;
      }
      set((draft) => {
        draft.visibleCampaignRoasState = {
          data: draft.visibleCampaignRoasState.data ?? {},
          isError: false,
          isLoading: true,
          requestKey,
        };
      });
      try {
        // allSettled so a single-source AQG outage doesn't discard the other
        // source's rows and force a manual retry.
        const settled = await visibleCampaignRoasRequestManager.executeRequest(async () =>
          Promise.allSettled(
            batches.map((batch) =>
              getCampaignRoas({
                customEndDate,
                customStartDate,
                entityIds: batch.entityIds,
                reportingView,
                requestTimestamp,
                resource: batch.resource,
                source: batch.source,
                timePeriod,
              }),
            ),
          ),
        );
        // Bail on cancellation or a mid-flight reset (date/view change).
        if (settled === null || get().visibleCampaignRoasState.requestKey !== requestKey) {
          return;
        }
        const fulfilledResults: Record<string, CampaignRoas>[] = [];
        settled.forEach((outcome) => {
          if (outcome.status === 'fulfilled') {
            fulfilledResults.push(outcome.value);
          } else {
            CaptureException(outcome.reason as Error, {
              context: 'fetchVisibleCampaignRoas: sub-batch failed',
            });
          }
        });
        if (fulfilledResults.length === 0) {
          set((draft) => {
            draft.visibleCampaignRoasState.isError = true;
            draft.visibleCampaignRoasState.isLoading = false;
          });
          return;
        }
        set((draft) => {
          // Merge into existing rows so scrolling doesn't clobber values that
          // fell out of the visible window.
          draft.visibleCampaignRoasState = {
            data: Object.assign({}, draft.visibleCampaignRoasState.data ?? {}, ...fulfilledResults),
            isError: false,
            isLoading: false,
            requestKey,
          };
        });
      } catch (error) {
        if (get().visibleCampaignRoasState.requestKey !== requestKey) {
          return;
        }
        set((draft) => {
          draft.visibleCampaignRoasState.isError = true;
          draft.visibleCampaignRoasState.isLoading = false;
        });
        CaptureException(error, { context: 'fetchVisibleCampaignRoas' });
      }
    },
    fetchVisibleCampaignStats: async (campaignIds: string[]) => {
      if (!getShouldUseCaaSReportingStats() || campaignIds.length === 0) {
        return;
      }
      const {
        currentSelection: timePeriod,
        customEndDate: storedCustomEndDate,
        customStartDate: storedCustomStartDate,
      } = get().dateSelectionState;
      const isCustom = timePeriod === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
      const customEndDate = isCustom ? storedCustomEndDate : undefined;
      const customStartDate = isCustom ? storedCustomStartDate : undefined;
      const reportingView = get().reportingViewState.currentSelection;
      const requestKey = JSON.stringify({
        campaignIds,
        customEndDate,
        customStartDate,
        reportingView,
        requestTimestamp: get().reportingRequestTimestamp,
        timePeriod,
      });
      if (get().visibleCampaignStatsState.requestKey === requestKey) {
        return;
      }
      set((draft) => {
        draft.visibleCampaignStatsState = {
          data: draft.visibleCampaignStatsState.data ?? {},
          isError: false,
          isLoading: true,
          requestKey,
        };
      });
      try {
        const campaigns = get().campaignsState.data ?? [];
        const campaignsById = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
        const result = await visibleCampaignStatsRequestManager.executeRequest(() =>
          fetchFrontendStatsForEntities({
            customEndDate,
            customStartDate,
            entities: campaignIds
              .map((id) => campaignsById.get(id))
              .filter((campaign): campaign is Campaign => campaign !== undefined)
              .map((campaign) => ({
                id: campaign.id,
                paymentType: campaign.payment_type,
                universeId: campaign.universe_id,
              })),
            entityType: 'campaign',
            reportingView,
            requestTimestamp: get().reportingRequestTimestamp,
            timePeriod,
          }),
        );
        if (result === null) {
          return;
        }
        set((draft) => {
          draft.visibleCampaignStatsState = {
            data: result,
            isError: false,
            isLoading: false,
            requestKey,
          };
        });
      } catch (error) {
        set((draft) => {
          draft.visibleCampaignStatsState.isError = true;
          draft.visibleCampaignStatsState.isLoading = false;
        });
        CaptureException(error, { context: 'fetchVisibleCampaignStats' });
      }
    },
    filteredIdsState: {
      isLoading: false,
    },
    getAdsAndOpenDrawer: async (campaignId: string, openDrawer: boolean = true) => {
      const campaignIndex = get().campaignsState.data!.findIndex(
        (campaign) => campaign.id === campaignId,
      );
      let campaign: Campaign | undefined;
      if (campaignIndex >= 0) {
        campaign = get().campaignsState.data![campaignIndex];
      }

      try {
        // Set ads isLoading true
        set((draft) => {
          draft.campaignDetailsState.adsState.isLoading = true;
        });
        // Set campaign
        if (openDrawer) {
          if (campaignIndex >= 0) {
            // Set the campaign in the state
            set((draft) => {
              draft.campaignDetailsState.campaign = campaign;
              // Clear off-platform metrics when switching to a non-off-platform campaign
              // or any campaign, as we don't fetch them here anymore
              draft.campaignDetailsState.offPlatformMetrics = undefined;
            });

            // Initialize the drawer chart's period from the page-level date selection
            // so the two stay in sync on open. The user can override afterwards via
            // the chart's own period selector.
            const {
              currentSelection: drawerInitialPeriod,
              customEndDate: drawerInitialCustomEnd,
              customStartDate: drawerInitialCustomStart,
            } = get().dateSelectionState;
            get()
              .fetchCampaignTimeSeries(
                drawerInitialPeriod,
                drawerInitialCustomStart,
                drawerInitialCustomEnd,
              )
              .catch(() => undefined);

            // If campaign has off-platform request, fetch uploaded creatives
            if (campaign?.off_platform_request_id) {
              try {
                const { uploaded_creatives } = await getSimplifiedCampaign(
                  campaignId,
                  true, // includeOffPlatformCreatives
                );
                set((draft) => {
                  // Set only the uploaded creatives, not the full campaign
                  draft.campaignDetailsState.uploadedCreatives = uploaded_creatives;
                });
              } catch {
                // If fetching uploaded creatives fails, leave them as undefined
                // Campaign is already set above
              }
            } else {
              // Clear uploaded creatives when switching to a non-off-platform campaign
              set((draft) => {
                draft.campaignDetailsState.uploadedCreatives = undefined;
              });
            }
          } else {
            CaptureException('Campaign details opened for campaign not found in store');
          }
        }
      } catch {
        CaptureException('Campaign details drawer could not be opened');
      }

      // Fetch ads
      try {
        const requestTimestamp = new Date().toISOString();
        const {
          currentSelection: timePeriod,
          customEndDate: storedCustomEnd,
          customStartDate: storedCustomStart,
        } = get().dateSelectionState;
        const isCustom = timePeriod === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
        const customStartDate = isCustom ? storedCustomStart : undefined;
        const customEndDate = isCustom ? storedCustomEnd : undefined;
        const reportingView = get().reportingViewState.currentSelection;
        const includePerformance = !getShouldUseCaaSReportingStats();
        set((draft) => {
          draft.reportingRequestTimestamp = requestTimestamp;
          draft.campaignDetailsState.visibleStatsState =
            GetInitialRequestState<FrontendReportingStatsById>({});
        });
        const fetchedAds = await getDateFilteredAds({
          campaignIds: [campaignId],
          customEndDate,
          customStartDate,
          includePerformance,
          reportingView,
          requestTimestamp,
          timePeriod,
        });

        // Currently unthinkable that we would have another page, but since we provide a next cursor, we should handle it
        let nextSerialCursor = fetchedAds.next_cursor;
        let allAds = fetchedAds.ads || [];

        /* eslint-disable no-await-in-loop */
        while (nextSerialCursor) {
          const nextFetchedAds = await getDateFilteredAds({
            campaignIds: [campaignId],
            customEndDate,
            customStartDate,
            includePerformance,
            paginationOptions: { cursor: nextSerialCursor },
            reportingView,
            requestTimestamp,
            timePeriod,
          });
          nextSerialCursor = nextFetchedAds.next_cursor;
          allAds = allAds.concat(nextFetchedAds.ads || []);

          if (!nextSerialCursor) {
            break;
          }
        }

        // If success, set ads + isLoading and isError to false
        set((draft) => {
          draft.campaignDetailsState.adsState = {
            data: allAds,
            isError: false,
            isLoading: false,
          };
        });

        // Status fetch after ads fetch
        const adIds = allAds.map((ad) => ad.id);
        // Set statuses to loading
        set((draft) => {
          draft.statusesState.adStatuses = new Map();
          draft.statusesState.updatedAdStatuses = new Map();
        });
        const adIdBatches = [];
        // Batch size should not exceed the BatchGetRequestLimit specified at https://obelix.simulprod.com/project/ads-golang/runtime-configuration/group/ads-management-service-v2
        const adBatchSize = 50;
        for (let i = 0; i < adIds.length; i += adBatchSize) {
          adIdBatches.push(adIds.slice(i, i + adBatchSize));
        }
        const backendResponses = new Map<string, GetAdStatusResponseType>();
        Promise.all(
          adIdBatches.map((adIdBatch) =>
            getAdStatus(adIdBatch)
              .then((r) => r.map((response) => backendResponses.set(response.id, response)))
              .catch((error) => {
                // Show error statuses for those that did not come back successfully
                adIdBatch.map((adId) =>
                  backendResponses.set(adId, {
                    disabled: true,
                    display_status: AdDisplayStatusType.AD_DISPLAY_STATUS_ERROR,
                    id: adId,
                    is_on: false,
                  }),
                );
                logNativeErrorEvent({
                  error,
                  eventName: EventName.GetAdStatusError,
                });
              }),
          ),
        ).then(() => {
          set((draft) => {
            draft.statusesState.adStatuses = backendResponses;
            draft.statusesState.updatedAdStatuses = backendResponses;
          });
        });
      } catch (error) {
        // Set ads isError true
        set((draft) => {
          draft.campaignDetailsState.adsState.isError = true;
        });
        // Log error
        logNativeErrorEvent({
          error,
          eventName: EventName.DateFilteringError,
          parameters: { function: 'getAdsAndOpenDrawer.fetchAds' },
        });
      }
    },
    getAndUpdateDisplayStatuses: async (campaignId: string, adId?: string) => {
      // When toggling campaign, no need to update ad display statuses state as it will be refetched on open
      try {
        const response = await getUpdatedStatuses(campaignId);
        set((draft) => {
          draft.statusesState.updatedCampaignStatuses = new Map(
            get().statusesState.updatedCampaignStatuses,
          ).set(response.campaign_status.id, response.campaign_status);
          if (adId) {
            const updatedAd = response.ad_statuses.find((ad) => ad.id === adId);
            if (updatedAd) {
              draft.statusesState.updatedAdStatuses = new Map(
                get().statusesState.updatedAdStatuses,
              ).set(adId, updatedAd);
            } else {
              CaptureException('Ad status was updated but not found in store');
            }
          }
        });
        return response;
      } catch {
        set((draft) => {
          draft.statusesState.updatedCampaignStatuses = new Map(
            get().statusesState.updatedCampaignStatuses,
          ).set(campaignId, {
            disabled: true,
            display_status: CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_ERROR,
            id: campaignId,
            is_on: false,
          });
          if (adId) {
            draft.statusesState.updatedAdStatuses = new Map(
              get().statusesState.updatedAdStatuses,
            ).set(adId, {
              disabled: true,
              display_status: AdDisplayStatusType.AD_DISPLAY_STATUS_ERROR,
              id: adId,
              is_on: false,
            });
          }
        });
        throw new Error('Error fetching updated status');
      }
    },
    getCampaignStatuses: (campaignIds: string[]) => {
      // Set statuses to loading
      set((draft) => {
        draft.statusesState.campaignStatuses = new Map();
        draft.statusesState.updatedCampaignStatuses = new Map();
      });
      const campaignIdBatches = [];
      // Batch size should not exceed the BatchGetRequestLimit specified at https://obelix.simulprod.com/project/ads-golang/runtime-configuration/group/ads-management-service-v2
      const campaignBatchSize = 50;
      for (let i = 0; i < campaignIds.length; i += campaignBatchSize) {
        campaignIdBatches.push(campaignIds.slice(i, i + campaignBatchSize));
      }
      const backendResponses = new Map<string, GetCampaignStatusResponseType>();

      Promise.all(
        campaignIdBatches.map((campaignIdBatch) =>
          getCampaignStatus(campaignIdBatch)
            .then((r) => {
              r.forEach((response) => {
                backendResponses.set(response.id, response);
              });
            })
            .catch((error) => {
              // Show error statuses for those that did not come back successfully
              campaignIdBatch.forEach((campaignId) =>
                backendResponses.set(campaignId, {
                  disabled: true,
                  display_status: CampaignDisplayStatusType.CAMPAIGN_DISPLAY_STATUS_ERROR,
                  id: campaignId,
                  is_on: false,
                }),
              );
              logNativeErrorEvent({
                error,
                eventName: EventName.GetCampaignStatusError,
              });
            }),
        ),
      ).then(() => {
        set((draft) => {
          draft.statusesState.campaignStatuses = backendResponses;
          draft.statusesState.updatedCampaignStatuses = backendResponses;
        });
      });
    },
    getDateFilteredCampaigns: async (
      dateSelection: DateFilteringTimePeriod,
      reportingView: ReportingViewType,
      abortSignal?: AbortSignal,
      customStartDate?: string,
      customEndDate?: string,
      universeIds?: number[],
      reportingRequestTimestamp?: string,
    ) => {
      const requestTimestamp = reportingRequestTimestamp ?? new Date().toISOString();
      const shouldUseCaaSStats = getShouldUseCaaSReportingStats();
      const includePerformance = !shouldUseCaaSStats;
      set((draft) => {
        draft.reportingRequestTimestamp = requestTimestamp;
        draft.summaryRequestTimestamp = requestTimestamp;
        draft.visibleCampaignStatsState = GetInitialRequestState<FrontendReportingStatsById>({});
        draft.visibleCampaignRoasState = GetInitialRequestState<CampaignRoasById>({});
      });
      try {
        const fetchCampaignPages = async (fetchPerformance: boolean): Promise<Campaign[]> => {
          const fetchedCampaigns = await getDateFilteredCampaigns({
            abortSignal,
            customEndDate,
            customStartDate,
            includePerformance: fetchPerformance,
            reportingView,
            requestTimestamp,
            timePeriod: dateSelection,
            universeIds,
          });

          let nextSerialCursor = fetchedCampaigns.next_cursor;
          let allCampaigns = fetchedCampaigns.campaigns || [];

          /* eslint-disable no-await-in-loop */
          while (nextSerialCursor) {
            const nextFetchedCampaigns = await getDateFilteredCampaigns({
              abortSignal,
              customEndDate,
              customStartDate,
              includePerformance: fetchPerformance,
              paginationOptions: { cursor: nextSerialCursor },
              reportingView,
              requestTimestamp,
              timePeriod: dateSelection,
              universeIds,
            });
            nextSerialCursor = nextFetchedCampaigns.next_cursor;
            allCampaigns = allCampaigns.concat(nextFetchedCampaigns.campaigns || []);
            if (!nextSerialCursor) {
              break;
            }
          }
          return allCampaigns;
        };

        const campaignsPromise = fetchCampaignPages(includePerformance);
        const allCampaigns = await campaignsPromise;

        // Status fetch always after campaigns fetch
        const campaignIds = allCampaigns.map((campaign) => campaign.id);
        get().getCampaignStatuses(campaignIds);

        return {
          campaigns: allCampaigns,
          requestTimestamp,
        };
      } catch (error) {
        logNativeErrorEvent({
          error,
          eventName: EventName.DateFilteringError,
          parameters: { function: 'getDateFilteredCampaigns' },
        });
        throw error;
      }
    },
    getFilteredCampaignIds: async ({
      abortSignal,
      newCampaignNameSearch,
      newUniverseId,
    }: FilteredCampaignIdsRequest) => {
      const currentUniverseId = get().universePickerFilterState.universeFilter.universe_id;
      const currentUniverseIdFilter = currentUniverseId || undefined;
      const currentCampaignNameSearch = get().campaignNameFilterState.campaignNameSearch;
      // If a new universeId to filter for was specified, use that
      // else, use the current filter value
      const universeIdToFilter: number | undefined =
        newUniverseId === undefined ? currentUniverseIdFilter : newUniverseId;
      const campaignNameToFilter: string | undefined =
        newCampaignNameSearch === undefined ? currentCampaignNameSearch : newCampaignNameSearch;
      // No filter was passed in, set to default no error state
      if (!universeIdToFilter && !campaignNameToFilter) {
        return undefined;
      }
      // Build filter
      const request: FiltersOnEntity = {};
      if (universeIdToFilter) {
        request.category_filters = [{ field: 'target_universe_id', values: [universeIdToFilter] }];
      }
      if (campaignNameToFilter) {
        request.text = campaignNameToFilter;
      }
      // Fetch filtered ids
      try {
        const response = await getFilteredCampaignIds(request, abortSignal);
        return new Set(response);
      } catch (error) {
        logNativeErrorEvent({
          error,
          eventName: EventName.ListFilteredIdsError,
        });
        throw error;
      }
    },
    getSummaryStats: async (
      dateSelection: DateFilteringTimePeriod,
      reportingView: ReportingViewType,
      universeId?: number,
      abortSignal?: AbortSignal,
      customStartDate?: string,
      customEndDate?: string,
      reportingRequestTimestamp?: string,
    ) => {
      if (getShouldUseWorkspaceUniverseFiltering()) {
        return undefined;
      }

      const requestTimestamp = reportingRequestTimestamp ?? new Date().toISOString();
      // Use current universe id filter if none is passed in
      const currentUniverseId = get().universePickerFilterState.universeFilter.universe_id;
      const currentUniverseIdFilter = currentUniverseId || undefined;
      const universeIdToFilterWith =
        universeId === undefined ? currentUniverseIdFilter : universeId;
      try {
        const response = await getAdAccountSummary({
          abortSignal,
          customEndDate,
          customStartDate,
          reportingView,
          requestTimestamp,
          timePeriod: dateSelection,
          universeId: universeIdToFilterWith,
        });
        return response;
      } catch (error) {
        logNativeErrorEvent({
          error,
          eventName: EventName.DateFilteringError,
          parameters: { function: 'getSummaryStats' },
        });
        throw error;
      }
    },
    handleCampaignNameSearchChange: (newCampaignNameSearch: string) => {
      const currentUniverseId = get().universePickerFilterState.universeFilter.universe_id;
      const universeIdToFilter = currentUniverseId || undefined;
      const campaignNameToFilter = newCampaignNameSearch || undefined;
      const campaigns = get().campaignsState.data ?? [];

      const filteredCampaignIds = filterCampaignIdsLocally(
        campaigns,
        campaignNameToFilter,
        universeIdToFilter,
      );

      set((draft) => {
        draft.filteredIdsState = {
          filteredCampaignIds,
          isLoading: false,
        };
        draft.campaignNameFilterState = {
          campaignNameSearch: newCampaignNameSearch,
          isError: false,
        };
        draft.universePickerFilterState.isError = false;
      });

      get().commitPendingStatusChanges(EntityType.ENTITY_TYPE_CAMPAIGN);
      logNativeClickEvent(EventName.FilterApplyClicked, {
        campaignSearchTerm: newCampaignNameSearch,
      });
    },
    handleDateSelectionChange: (
      newDateSelection: DateFilteringTimePeriod,
      customStartDate?: string,
      customEndDate?: string,
    ) => {
      get()
        .refetchForDateSelection(newDateSelection, customStartDate, customEndDate)
        .then((success) => {
          get().commitDateSelection(newDateSelection, customStartDate, customEndDate, !success);
        });
    },
    handleReportingViewChange: (newReportingView: ReportingViewType) => {
      const {
        currentSelection: currentDateSelection,
        customEndDate: storedCustomEnd,
        customStartDate: storedCustomStart,
      } = get().dateSelectionState;
      // Belt-and-suspenders: custom dates should only ever ride along when the
      // current selection is CUSTOM. AMA rejects `time_period=<preset>&custom_*`.
      const isCustom =
        currentDateSelection === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
      const customStartDate = isCustom ? storedCustomStart : undefined;
      const customEndDate = isCustom ? storedCustomEnd : undefined;
      const shouldUseWorkspaceUniverseFiltering = getShouldUseWorkspaceUniverseFiltering();
      const { universeFilter } = get().universePickerFilterState;
      const pickerUniverses = get().advertisedUniversesState.data;
      const universeId = shouldUseWorkspaceUniverseFiltering
        ? getSummaryUniverseId(universeFilter)
        : universeFilter.universe_id || undefined;
      const universeIds = shouldUseWorkspaceUniverseFiltering
        ? resolveUniverseIdsForDateFilter(universeFilter, pickerUniverses)
        : undefined;

      if (getShouldUseCaaSReportingStats()) {
        const requestTimestamp = new Date().toISOString();
        const campaigns = get().campaignsState.data ?? [];

        set((draft) => {
          draft.reportingRequestTimestamp = requestTimestamp;
          draft.summaryRequestTimestamp = requestTimestamp;
          draft.reportingViewState = {
            currentSelection: newReportingView,
            isError: false,
          };
          draft.summaryStatsState.isLoading = true;
          draft.visibleCampaignStatsState = GetInitialRequestState<FrontendReportingStatsById>({});
          draft.visibleCampaignRoasState = GetInitialRequestState<CampaignRoasById>({});
        });

        dateReportingViewRequestManager
          .executeRequest(async (abortSignal) => {
            const backendSummary = shouldUseWorkspaceUniverseFiltering
              ? undefined
              : await get().getSummaryStats(
                  currentDateSelection,
                  newReportingView,
                  universeId,
                  abortSignal,
                  customStartDate,
                  customEndDate,
                  requestTimestamp,
                );
            return fetchFrontendSummaryStats({
              backendSummary,
              campaigns,
              customEndDate,
              customStartDate,
              reportingView: newReportingView,
              requestTimestamp,
              timePeriod: currentDateSelection,
              universeId,
              universeIds,
            });
          })
          .then((summaryStats) => {
            if (summaryStats === null || get().summaryRequestTimestamp !== requestTimestamp) {
              return;
            }
            set((draft) => {
              draft.summaryStatsState = {
                data: summaryStats,
                isError: false,
                isLoading: false,
              };
            });
          })
          .catch(() => {
            if (get().summaryRequestTimestamp !== requestTimestamp) {
              return;
            }
            set((draft) => {
              draft.reportingViewState.isError = true;
              draft.summaryStatsState.isLoading = false;
            });
          });

        if (get().campaignDetailsState.campaign) {
          // The drawer chart keeps its own period selector; only forward the
          // page-level custom range if that same period is currently selected.
          const drawerPeriod = get().campaignDetailsState.timeSeriesPeriod;
          const drawerIsCustom =
            drawerPeriod === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
          get()
            .fetchCampaignTimeSeries(
              drawerPeriod,
              drawerIsCustom ? customStartDate : undefined,
              drawerIsCustom ? customEndDate : undefined,
            )
            .catch(() => undefined);
          get()
            .fetchVisibleAdStats(
              (get().campaignDetailsState.adsState.data ?? []).map(({ id }) => id),
            )
            .catch(() => undefined);
        }
        return;
      }

      get()
        .refetchCampaignsAndSummary({
          customEndDate,
          customStartDate,
          dateSelection: currentDateSelection,
          onError: (draft) => {
            // If the new selection failed, keep the previous campaigns and summary stats
            // Show error under reporting view selector
            draft.reportingViewState.isError = true;
          },
          onSuccess: (_fetchedCampaigns, _summaryStats, draft) => {
            // Commit the new reporting view selection
            draft.reportingViewState = {
              currentSelection: newReportingView,
              isError: false,
            };
          },
          reportingView: newReportingView,
          universeId,
          universeIds,
        })
        .then((success) => {
          if (!success) {
            return;
          }
          if (get().campaignDetailsState.campaign) {
            // The drawer chart keeps its own period selector; only forward the
            // page-level custom range if that same period is currently selected.
            const drawerPeriod = get().campaignDetailsState.timeSeriesPeriod;
            const drawerIsCustom =
              drawerPeriod === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
            get()
              .fetchCampaignTimeSeries(
                drawerPeriod,
                drawerIsCustom ? customStartDate : undefined,
                drawerIsCustom ? customEndDate : undefined,
              )
              .catch(() => undefined);
            get()
              .fetchVisibleAdStats(
                (get().campaignDetailsState.adsState.data ?? []).map(({ id }) => id),
              )
              .catch(() => undefined);
          }
        });
    },
    handleUniversePickerChange: (universe: AdvertisedUniverse) => {
      const shouldUseWorkspaceUniverseFiltering = getShouldUseWorkspaceUniverseFiltering();
      const pickerUniverses = get().advertisedUniversesState.data;
      const universeIds = shouldUseWorkspaceUniverseFiltering
        ? resolveUniverseIdsForDateFilter(universe, pickerUniverses)
        : undefined;
      const summaryUniverseId = getSummaryUniverseId(universe);
      const requestTimestamp = new Date().toISOString();

      frontendSummaryRequestManager.cancel();
      initialBackendSummaryRequestManager.cancel();
      set((draft) => {
        draft.campaignsState.isLoading = true;
        draft.filteredIdsState.isLoading = !shouldUseWorkspaceUniverseFiltering;
        draft.summaryRequestTimestamp = requestTimestamp;
        draft.summaryStatsState.isLoading = true;
        draft.universePickerFilterState.universeFilter = universe;
        draft.universePickerFilterState.isError = false;
      });

      const {
        currentSelection: currentDateSelection,
        customEndDate: storedCustomEnd,
        customStartDate: storedCustomStart,
      } = get().dateSelectionState;
      const isCustom =
        currentDateSelection === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
      const customStartDate = isCustom ? storedCustomStart : undefined;
      const customEndDate = isCustom ? storedCustomEnd : undefined;
      const currentReportingView = get().reportingViewState.currentSelection;

      let keepFrontendSummaryLoading = false;
      // Use shared request manager to handle cancellation of stale requests (fire-and-forget)
      dateReportingViewRequestManager
        .executeRequest(async (abortSignal) => {
          const shouldUseFrontendSummary = getShouldUseCaaSReportingStats();
          const [campaignFetchResult, filteredCampaignIds, backendSummaryStats] = await Promise.all(
            [
              get().getDateFilteredCampaigns(
                currentDateSelection,
                currentReportingView,
                abortSignal,
                customStartDate,
                customEndDate,
                universeIds,
                requestTimestamp,
              ),
              shouldUseWorkspaceUniverseFiltering
                ? Promise.resolve(undefined)
                : get().getFilteredCampaignIds({
                    abortSignal,
                    newCampaignNameSearch: undefined,
                    newUniverseId: universe.universe_id,
                  }),
              shouldUseFrontendSummary && shouldUseWorkspaceUniverseFiltering
                ? Promise.resolve(undefined)
                : get().getSummaryStats(
                    currentDateSelection,
                    currentReportingView,
                    summaryUniverseId,
                    abortSignal,
                    customStartDate,
                    customEndDate,
                    requestTimestamp,
                  ),
            ],
          );
          abortSignal.throwIfAborted();
          // Kick off the summary query without awaiting it so the table can render
          // as soon as the campaigns resolve; the summary cards keep their own
          // loading state until it settles.
          const frontendSummaryPromise = shouldUseFrontendSummary
            ? frontendSummaryRequestManager.executeRequest((summaryAbortSignal) =>
                fetchFrontendSummaryStats({
                  abortSignal: summaryAbortSignal,
                  backendSummary: backendSummaryStats,
                  campaigns: campaignFetchResult.campaigns,
                  customEndDate,
                  customStartDate,
                  reportingView: currentReportingView,
                  requestTimestamp,
                  timePeriod: currentDateSelection,
                  universeId: summaryUniverseId,
                  universeIds,
                }),
              )
            : undefined;

          return {
            backendSummaryStats,
            campaignFetchResult,
            filteredCampaignIds,
            frontendSummaryPromise,
          };
        })
        .then((result) => {
          // If result is null, the request was cancelled or superseded
          if (result === null) {
            return;
          }
          set((draft) => {
            draft.campaignsState.data = result.campaignFetchResult.campaigns;
            draft.campaignsState.isError = false;
            draft.filteredIdsState = {
              filteredCampaignIds: result.filteredCampaignIds,
              isLoading: false,
            };
            if (!result.frontendSummaryPromise) {
              draft.summaryStatsState.data = result.backendSummaryStats;
              draft.summaryStatsState.isError = false;
            }
            // Clear campaign name search error as a successful filter request has been sent
            draft.campaignNameFilterState.isError = false;
          });

          if (result.frontendSummaryPromise) {
            keepFrontendSummaryLoading = true;
            result.frontendSummaryPromise
              .then((frontendSummaryStats) => {
                if (
                  frontendSummaryStats === null ||
                  get().summaryRequestTimestamp !== requestTimestamp
                ) {
                  return;
                }
                set((draft) => {
                  draft.summaryStatsState.data = frontendSummaryStats;
                  draft.summaryStatsState.isError = false;
                  draft.summaryStatsState.isLoading = false;
                });
              })
              .catch((error) => {
                if (get().summaryRequestTimestamp !== requestTimestamp) {
                  return;
                }
                set((draft) => {
                  draft.summaryStatsState.isError = true;
                  draft.summaryStatsState.isLoading = false;
                });
                CaptureException(error, { context: 'fetchUniverseFrontendSummary' });
              });
          }
        })
        .catch(() => {
          if (get().summaryRequestTimestamp !== requestTimestamp) {
            return;
          }
          set((draft) => {
            draft.universePickerFilterState.isError = true;
          });
        })
        .finally(() => {
          if (get().summaryRequestTimestamp !== requestTimestamp) {
            return;
          }
          set((draft) => {
            // Clear error from date picker as more recent requests have been sent
            draft.dateSelectionState.isError = false;

            draft.campaignsState.isLoading = false;
            draft.filteredIdsState.isLoading = false;
            if (!keepFrontendSummaryLoading) {
              draft.summaryStatsState.isLoading = false;
            }
          });
        });
    },
    /**
     * Helper function to refetch campaigns and summary stats with new parameters.
     * Manages loading states and handles success/error scenarios consistently.
     * Uses request manager to prevent race conditions from rapid filter changes.
     */
    refetchCampaignsAndSummary: async (params: {
      customEndDate?: string;
      customStartDate?: string;
      dateSelection: DateFilteringTimePeriod;
      onError: (draft: NewFlowStoreType) => void;
      onSuccess: (
        fetchedCampaigns: Campaign[],
        summaryStats: AdAccountSummary | undefined,
        draft: NewFlowStoreType,
      ) => void;
      reportingView: ReportingViewType;
      universeIds?: number[];
      universeId?: number;
    }) => {
      const requestTimestamp = new Date().toISOString();
      frontendSummaryRequestManager.cancel();
      initialBackendSummaryRequestManager.cancel();
      set((draft) => {
        draft.campaignsState.isLoading = true;
        draft.summaryRequestTimestamp = requestTimestamp;
        draft.summaryStatsState.isLoading = true;
      });

      let keepFrontendSummaryLoading = false;
      try {
        // Use request manager to handle cancellation of stale requests
        const result = await dateReportingViewRequestManager.executeRequest(async (abortSignal) => {
          const shouldUseFrontendSummary = getShouldUseCaaSReportingStats();
          const summaryPromise =
            shouldUseFrontendSummary && getShouldUseWorkspaceUniverseFiltering()
              ? Promise.resolve(undefined)
              : get().getSummaryStats(
                  params.dateSelection,
                  params.reportingView,
                  params.universeId,
                  abortSignal,
                  params.customStartDate,
                  params.customEndDate,
                  requestTimestamp,
                );
          const [campaignFetchResult, backendSummaryStats] = await Promise.all([
            get().getDateFilteredCampaigns(
              params.dateSelection,
              params.reportingView,
              abortSignal,
              params.customStartDate,
              params.customEndDate,
              params.universeIds,
              requestTimestamp,
            ),
            summaryPromise,
          ]);
          abortSignal.throwIfAborted();
          const frontendSummaryPromise = shouldUseFrontendSummary
            ? frontendSummaryRequestManager.executeRequest((summaryAbortSignal) =>
                fetchFrontendSummaryStats({
                  abortSignal: summaryAbortSignal,
                  backendSummary: backendSummaryStats,
                  campaigns: campaignFetchResult.campaigns,
                  customEndDate: params.customEndDate,
                  customStartDate: params.customStartDate,
                  reportingView: params.reportingView,
                  requestTimestamp,
                  timePeriod: params.dateSelection,
                  universeId: params.universeId,
                  universeIds: params.universeIds,
                }),
              )
            : undefined;

          return {
            backendSummaryStats,
            campaignFetchResult,
            frontendSummaryPromise,
            requestTimestamp,
          };
        });

        // If result is null, the request was cancelled or superseded.
        if (result === null) {
          return false;
        }
        set((draft) => {
          draft.campaignsState.data = result.campaignFetchResult.campaigns;
          draft.campaignsState.isError = false;
          if (result.frontendSummaryPromise) {
            draft.summaryStatsState.isLoading = true;
          } else {
            draft.summaryStatsState.data = result.backendSummaryStats;
            draft.summaryStatsState.isError = false;
          }

          // Client-side name search IDs are scoped to the campaigns currently in memory.
          // Recompute against the newly fetched set so date/view changes don't hide matches.
          const { campaignNameSearch } = draft.campaignNameFilterState;
          if (campaignNameSearch) {
            const universeId =
              draft.universePickerFilterState.universeFilter.universe_id || undefined;
            draft.filteredIdsState = {
              filteredCampaignIds: filterCampaignIdsLocally(
                result.campaignFetchResult.campaigns,
                campaignNameSearch,
                universeId,
              ),
              isLoading: false,
            };
          }

          params.onSuccess(result.campaignFetchResult.campaigns, result.backendSummaryStats, draft);
        });
        if (result.frontendSummaryPromise) {
          keepFrontendSummaryLoading = true;
          result.frontendSummaryPromise
            .then((frontendSummaryStats) => {
              if (
                frontendSummaryStats === null ||
                get().summaryRequestTimestamp !== result.requestTimestamp
              ) {
                return;
              }
              set((draft) => {
                draft.summaryStatsState.data = frontendSummaryStats;
                draft.summaryStatsState.isError = false;
                draft.summaryStatsState.isLoading = false;
              });
            })
            .catch((error) => {
              if (get().summaryRequestTimestamp !== result.requestTimestamp) {
                return;
              }
              set((draft) => {
                draft.summaryStatsState.isError = true;
                draft.summaryStatsState.isLoading = false;
              });
              CaptureException(error, { context: 'fetchFilteredFrontendSummary' });
            });
        }
        return true;
      } catch {
        set((draft) => {
          params.onError(draft);
        });
        return false;
      } finally {
        set((draft) => {
          // Clear errors from related states as more recent requests have been sent
          draft.universePickerFilterState.isError = false;
          draft.campaignsState.isLoading = false;
          if (draft.summaryRequestTimestamp === requestTimestamp && !keepFrontendSummaryLoading) {
            draft.summaryStatsState.isLoading = false;
          }
        });
      }
    },
    refetchForDateSelection: (
      newDateSelection: DateFilteringTimePeriod,
      customStartDate?: string,
      customEndDate?: string,
    ): Promise<boolean> => {
      const currentReportingView = get().reportingViewState.currentSelection;
      const isCustom =
        newDateSelection === DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
      const nextCustomStart = isCustom ? customStartDate : undefined;
      const nextCustomEnd = isCustom ? customEndDate : undefined;
      const shouldUseWorkspaceUniverseFiltering = getShouldUseWorkspaceUniverseFiltering();
      const { universeFilter } = get().universePickerFilterState;
      const pickerUniverses = get().advertisedUniversesState.data;

      return get()
        .refetchCampaignsAndSummary({
          customEndDate: nextCustomEnd,
          customStartDate: nextCustomStart,
          dateSelection: newDateSelection,
          onError: () => undefined,
          onSuccess: () => undefined,
          reportingView: currentReportingView,
          universeId: shouldUseWorkspaceUniverseFiltering
            ? getSummaryUniverseId(universeFilter)
            : universeFilter.universe_id || undefined,
          universeIds: shouldUseWorkspaceUniverseFiltering
            ? resolveUniverseIdsForDateFilter(universeFilter, pickerUniverses)
            : undefined,
        })
        .then((success) => {
          // Keep the drawer's reporting chart in sync when it's open.
          if (success && get().campaignDetailsState.campaign) {
            get()
              .fetchCampaignTimeSeries(newDateSelection, nextCustomStart, nextCustomEnd)
              .catch(() => undefined);
            get()
              .fetchVisibleAdStats(
                (get().campaignDetailsState.adsState.data ?? []).map(({ id }) => id),
              )
              .catch(() => undefined);
          }
          return success;
        });
    },
    reportingRequestTimestamp: new Date().toISOString(),
    reportingViewState: {
      currentSelection: ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT, // Default reporting view
      isError: false,
    },
    resetFilterState: () => {
      set((draft) => {
        draft.filteredIdsState = {
          isLoading: false,
        };
        draft.campaignNameFilterState = { isError: false };
        draft.universePickerFilterState = {
          isError: false,
          universeFilter: defaultAdvertisedUniverse,
        };
      });
    },
    retryCampaigns: async () => {
      const {
        advertisedUniversesState,
        campaignNameFilterState,
        dateSelectionState,
        reportingViewState,
        universePickerFilterState,
      } = get();
      const isCustom =
        dateSelectionState.currentSelection ===
        DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
      const customStartDate = isCustom ? dateSelectionState.customStartDate : undefined;
      const customEndDate = isCustom ? dateSelectionState.customEndDate : undefined;
      const shouldUseWorkspaceUniverseFiltering = getShouldUseWorkspaceUniverseFiltering();
      const universeIds = shouldUseWorkspaceUniverseFiltering
        ? resolveUniverseIdsForDateFilter(
            universePickerFilterState.universeFilter,
            advertisedUniversesState.data,
          )
        : undefined;
      const requestTimestamp = new Date().toISOString();

      set((draft) => {
        draft.campaignsState.isError = false;
        draft.campaignsState.isLoading = true;
      });

      try {
        const campaignFetchResult = await get().getDateFilteredCampaigns(
          dateSelectionState.currentSelection,
          reportingViewState.currentSelection,
          undefined,
          customStartDate,
          customEndDate,
          universeIds,
          requestTimestamp,
        );
        if (get().reportingRequestTimestamp !== requestTimestamp) {
          return;
        }
        set((draft) => {
          draft.campaignsState.data = campaignFetchResult.campaigns;
          draft.campaignsState.isError = false;

          if (campaignNameFilterState.campaignNameSearch) {
            const universeId =
              draft.universePickerFilterState.universeFilter.universe_id || undefined;
            draft.filteredIdsState = {
              filteredCampaignIds: filterCampaignIdsLocally(
                campaignFetchResult.campaigns,
                campaignNameFilterState.campaignNameSearch,
                universeId,
              ),
              isLoading: false,
            };
          }
        });
      } catch {
        if (get().reportingRequestTimestamp === requestTimestamp) {
          set((draft) => {
            draft.campaignsState.isError = true;
          });
        }
      } finally {
        if (get().reportingRequestTimestamp === requestTimestamp) {
          set((draft) => {
            draft.campaignsState.isLoading = false;
          });
        }
      }
    },
    retrySummaryStats: async () => {
      const {
        advertisedUniversesState,
        campaignsState,
        dateSelectionState,
        reportingViewState,
        universePickerFilterState,
      } = get();
      const isCustom =
        dateSelectionState.currentSelection ===
        DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_CUSTOM;
      const customStartDate = isCustom ? dateSelectionState.customStartDate : undefined;
      const customEndDate = isCustom ? dateSelectionState.customEndDate : undefined;
      const shouldUseWorkspaceUniverseFiltering = getShouldUseWorkspaceUniverseFiltering();
      const universeId = getSummaryUniverseId(universePickerFilterState.universeFilter);
      const universeIds = shouldUseWorkspaceUniverseFiltering
        ? resolveUniverseIdsForDateFilter(
            universePickerFilterState.universeFilter,
            advertisedUniversesState.data,
          )
        : undefined;
      const requestTimestamp = new Date().toISOString();
      const shouldUseFrontendSummary = getShouldUseCaaSReportingStats();

      set((draft) => {
        draft.summaryStatsState.isError = false;
        draft.summaryStatsState.isLoading = true;
      });

      try {
        const backendSummary =
          shouldUseFrontendSummary && shouldUseWorkspaceUniverseFiltering
            ? undefined
            : await get().getSummaryStats(
                dateSelectionState.currentSelection,
                reportingViewState.currentSelection,
                universeId,
                undefined,
                customStartDate,
                customEndDate,
                requestTimestamp,
              );
        const summaryStats = shouldUseFrontendSummary
          ? await fetchFrontendSummaryStats({
              backendSummary,
              campaigns: campaignsState.data ?? [],
              customEndDate,
              customStartDate,
              reportingView: reportingViewState.currentSelection,
              requestTimestamp,
              timePeriod: dateSelectionState.currentSelection,
              universeId,
              universeIds,
            })
          : backendSummary;

        set((draft) => {
          draft.summaryStatsState.data = summaryStats;
          draft.summaryStatsState.isError = false;
        });
      } catch (error) {
        set((draft) => {
          draft.summaryStatsState.isError = true;
        });
        CaptureException(error, { context: 'retrySummaryStats' });
      } finally {
        set((draft) => {
          draft.summaryStatsState.isLoading = false;
        });
      }
    },
    statusesState: {
      adStatuses: new Map<string, GetAdStatusResponseType>(),
      campaignStatuses: new Map<string, GetCampaignStatusResponseType>(),
      updatedAdStatuses: new Map<string, GetAdStatusResponseType>(),
      updatedCampaignStatuses: new Map<string, GetCampaignStatusResponseType>(),
    },
    summaryRequestTimestamp: new Date().toISOString(),
    summaryStatsState: GetEmptyRequestState<AdAccountSummary>(),
    tableRowsState: {
      adToggleLoadingMap: new Map<string, boolean>(),
      campaignToggleLoadingDueToAdToggleMap: new Map<string, boolean>(),
      campaignToggleLoadingMap: new Map<string, boolean>(),
    },
    toggleAd: async (adId: string, updateStatusTo: UpdatedAdStatus) => {
      const { campaign } = get().campaignDetailsState;
      if (campaign === undefined) {
        CaptureException('Ad status could not be toggled because campaign is undefined');
        throw new Error('Ad status could not be toggled because campaign is undefined');
      }
      // Set toggle for this ad and parent campaign to disabled
      set((draft) => {
        draft.tableRowsState.campaignToggleLoadingDueToAdToggleMap = new Map<string, boolean>(
          get().tableRowsState.campaignToggleLoadingDueToAdToggleMap,
        ).set(campaign.id, true);
        draft.tableRowsState.adToggleLoadingMap = new Map<string, boolean>(
          get().tableRowsState.adToggleLoadingMap,
        ).set(adId, true);
      });
      // Return promise
      return updateAdStatus(adId, updateStatusTo)
        .then(async () => {
          // Update the status in the store
          const editedAdIndex = get().campaignDetailsState.adsState.data!.findIndex(
            (ad) => ad.id === adId,
          );
          if (editedAdIndex >= 0) {
            set((draft) => {
              draft.campaignDetailsState.adsState.data[editedAdIndex].status = updateStatusTo;
            });
            // Refresh display status
            await get().getAndUpdateDisplayStatuses(campaign.id, adId);
          } else {
            CaptureException('Ad status was updated but not found in store');
          }
        })
        .catch((error) => {
          throw error;
        })
        .finally(() => {
          set((draft) => {
            draft.tableRowsState.campaignToggleLoadingDueToAdToggleMap = new Map<string, boolean>(
              get().tableRowsState.campaignToggleLoadingDueToAdToggleMap,
            ).set(campaign.id, false);
            draft.tableRowsState.adToggleLoadingMap = new Map<string, boolean>(
              get().tableRowsState.adToggleLoadingMap,
            ).set(adId, false);
          });
        });
    },
    toggleCampaign: (
      campaignId: string,
      toggleTo: ServerCampaignStatusType.STOPPED | ServerCampaignStatusType.ENABLED,
    ) => get().updateCampaignStatus(campaignId, toggleTo),
    universePickerFilterState: { isError: false, universeFilter: defaultAdvertisedUniverse },
    updateCampaignStatus: async (campaignId: string, updateStatusTo: UpdatedCampaignStatus) => {
      // Set toggle for this campaign to disabled
      set((draft) => {
        draft.tableRowsState.campaignToggleLoadingMap = new Map<string, boolean>(
          get().tableRowsState.campaignToggleLoadingMap,
        ).set(campaignId, true);
      });
      // Return promise
      return updateCampaignStatus(campaignId, updateStatusTo)
        .then(async () => {
          // Update the status in the store
          const editedCampaignIndex = get().campaignsState.data!.findIndex(
            (campaign) => campaign.id === campaignId,
          );
          if (editedCampaignIndex >= 0) {
            set((draft) => {
              draft.campaignsState.data[editedCampaignIndex].status = updateStatusTo;
            });
            // Refresh display status
            await get().getAndUpdateDisplayStatuses(campaignId);
          } else {
            CaptureException('Campaign status was updated but not found in store');
          }
        })
        .catch((error) => {
          throw error;
        })
        .finally(() => {
          set((draft) => {
            draft.tableRowsState.campaignToggleLoadingMap = new Map<string, boolean>(
              get().tableRowsState.campaignToggleLoadingMap,
            ).set(campaignId, false);
          });
        });
    },
    visibleCampaignRoasState: GetInitialRequestState<CampaignRoasById>({}),
    visibleCampaignStatsState: GetInitialRequestState<FrontendReportingStatsById>({}),
  })),
);
