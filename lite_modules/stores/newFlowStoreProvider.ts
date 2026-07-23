import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import {
  EventName,
  logNativeClickEvent,
  logNativeErrorEvent,
  logNativeImpressionEvent,
} from '@clients/unifiedLogger';
import { ServerAdStatusType } from '@constants/ad';
import { ServerCampaignStatusType } from '@constants/campaign';
import { AdDisplayStatusType, CampaignDisplayStatusType } from '@constants/campaignStatus';
import DateFilteringTimePeriod from '@constants/dateFilteringTimePeriod';
import { EntityType } from '@constants/entity';
import ReportingViewType from '@constants/reportingViewType';
import { defaultAdvertisedUniverse } from '@constants/universeConstants';
import { getFilteredCampaignIds } from '@services/ads/filterService';
import { getCampaignTimeSeries } from '@services/ads/getCampaignTimeSeriesService';
import {
  getDateFilteredAds,
  getDateFilteredCampaigns,
  getSimplifiedCampaign,
} from '@services/ads/getEntitiesService';
import { getAdStatus, getCampaignStatus, getUpdatedStatuses } from '@services/ads/getStatusService';
import { getAdAccountSummary } from '@services/ads/getSummaryService';
import { listAdvertisedUniverses } from '@services/ads/getUniversesService';
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
import { AdAccountSummary, EntityPerformance } from '@type/reportingStats';
import { CampaignTimeSeries } from '@type/timeSeries';
import { AdvertisedUniverse } from '@type/universe';
import { SimplifiedUploadedCreative } from '@type/uploadedCreative';
import { CaptureException } from '@utils/error';
import { createRequestManager } from '@utils/requestManager';
import { getAdvertiserTimezoneDbName } from '@utils/timezone';
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
  reportingViewState: ReportingViewStateType;
  statusesState: DisplayStatusesStateType;
  summaryStatsState: EmptyRequestStateType<AdAccountSummary>;
  tableRowsState: TableRowsStateType;
  universePickerFilterState: UniversePickerFilterState;
}

interface FilteredCampaignIdsRequest {
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

interface SponsoredAdsPageActionType {
  cancelCampaign: (campaignId: string) => Promise<void>;
  // Resets
  closeDrawer: () => void;
  commitPendingStatusChanges: (entityType: EntityType) => void;
  fetchCampaignTimeSeries: (timePeriod: DateFilteringTimePeriod) => Promise<void>;
  fetchInitialData: (createdFirstCampaign: boolean, campaignId?: string) => void;
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
  ) => Promise<Campaign[]>;
  getFilteredCampaignIds: (request: FilteredCampaignIdsRequest) => Promise<Set<string> | undefined>;
  getSummaryStats: (
    dateSelection: DateFilteringTimePeriod,
    reportingView: ReportingViewType,
    universeId?: number,
    abortSignal?: AbortSignal,
  ) => Promise<AdAccountSummary>;
  // --> Promise.all(getFilteredCampaignIds, getSummaryStats, getDateFilteredCampaigns)
  handleCampaignNameSearchChange: (newCampaignNameSearch: string) => void;
  // UI handleChange
  handleDateSelectionChange: (newDateSelection: DateFilteringTimePeriod) => void;
  // --> Promise.all(getDateFilteredCampaigns, getSummaryStats)
  handleReportingViewChange: (newReportingView: ReportingViewType) => void;
  handleUniversePickerChange: (universe: AdvertisedUniverse) => void;
  refetchCampaignsAndSummary: (params: {
    dateSelection: DateFilteringTimePeriod;
    onError: (draft: NewFlowStoreType) => void;
    onSuccess: (
      fetchedCampaigns: Campaign[],
      summaryStats: AdAccountSummary,
      draft: NewFlowStoreType,
    ) => void;
    reportingView: ReportingViewType;
    universeId?: number;
  }) => Promise<boolean>;
  resetFilterState: () => void;
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

export const useNewFlowStore = create<NewFlowStoreType>()(
  immer((set, get) => ({
    advertisedUniversesState: GetInitialRequestState<AdvertisedUniverse[]>([]),
    campaignDetailsState: {
      adsState: GetInitialRequestState<Ad[]>([]),
      campaign: undefined,
      timeSeriesPeriod: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIRTY_DAYS,
      timeSeriesState: GetEmptyRequestState<CampaignTimeSeries>(),
      uploadedCreatives: undefined,
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
    dateSelectionState: {
      currentSelection: DateFilteringTimePeriod.DATE_FILTERING_TIME_PERIOD_THIRTY_DAYS, // Default date selection
      isError: false,
    },
    fetchCampaignTimeSeries: async (timePeriod: DateFilteringTimePeriod) => {
      const { campaign } = get().campaignDetailsState;
      const adAccountId = useAppStore.getState().appData?.adAccountId;
      if (!campaign || !adAccountId) {
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
        const timezoneDbName = getAdvertiserTimezoneDbName(
          useAppStore.getState().advertiserState?.data?.organization?.time_zone,
        );

        const timeSeries = await getCampaignTimeSeries({
          adAccountId,
          campaignId: requestCampaignId,
          isRoasEnabled:
            useAppStore.getState().appMetadataState?.data?.isCampaignRoasEnabled ?? false,
          reportingView: requestReportingView,
          requestTimestamp: new Date().toISOString(),
          timePeriod,
          timezoneDbName,
          unifiedAttributionCutoverDate:
            useAppStore.getState().appMetadataState?.data?.unifiedAttributionCutoverDate,
        });
        if (isStale()) {
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
    fetchInitialData: (createdFirstCampaign: boolean, campaignId?: string) => {
      set((draft) => {
        draft.campaignsState.isLoading = true;
        draft.summaryStatsState.isLoading = true;
        draft.advertisedUniversesState.isLoading = true;
      });

      const advertisedUniversesPromise = listAdvertisedUniverses();
      const initialDateSelection = get().dateSelectionState.currentSelection;
      const initialReportingView = get().reportingViewState.currentSelection;
      const campaignsPromise = get().getDateFilteredCampaigns(
        initialDateSelection,
        initialReportingView,
      );
      const summaryPromise = get().getSummaryStats(initialDateSelection, initialReportingView);

      advertisedUniversesPromise
        .then((fetchedUniverses) => {
          const advertisedUniverses = fetchedUniverses.advertised_universes;
          // Shoot off batched thumbnail request, don't wait for it to finish
          useThumbnailStore
            .getState()
            .getThumbnailsBatch(advertisedUniverses.map((u) => u.universe_id));
          if (advertisedUniverses.length === 0) {
            if (createdFirstCampaign) {
              // User should have a universe, but there is ~10 second delay syncing to Elastic Search
              // So right after they created their first campaign, show them the default "All" option with no error
              set((draft) => {
                draft.advertisedUniversesState.data = [defaultAdvertisedUniverse];
                draft.advertisedUniversesState.isError = false;
              });
              logNativeImpressionEvent(EventName.NoAdvertisedUniversesFetched);
            } else {
              set((draft) => {
                draft.advertisedUniversesState.data = [];
                draft.advertisedUniversesState.isError = true;
              });
            }
            return;
          }
          let universesToSet = advertisedUniverses;
          if (advertisedUniverses.length > 1) {
            universesToSet = [defaultAdvertisedUniverse].concat(advertisedUniverses);
          }
          set((draft) => {
            [draft.universePickerFilterState.universeFilter] = universesToSet;
            draft.advertisedUniversesState.data = universesToSet;
            draft.advertisedUniversesState.isError = false;
          });
        })
        .catch(() => {
          set((draft) => {
            draft.advertisedUniversesState.isError = true;
          });
        })
        .finally(() => {
          set((draft) => {
            draft.advertisedUniversesState.isLoading = false;
          });
        });

      campaignsPromise
        .then((fetchedCampaigns) => {
          set((draft) => {
            draft.campaignsState.data = fetchedCampaigns;
            draft.campaignsState.isError = false;
          });
          if (campaignId) {
            get().getAdsAndOpenDrawer(campaignId);
          }
        })
        .catch(() => {
          set((draft) => {
            draft.campaignsState.isError = true;
          });
        })
        .finally(() => {
          set((draft) => {
            draft.campaignsState.isLoading = false;
          });
        });

      summaryPromise
        .then((fetchedSummary) => {
          set((draft) => {
            draft.summaryStatsState.data = fetchedSummary;
            draft.summaryStatsState.isError = false;
          });
        })
        .catch(() => {
          set((draft) => {
            draft.summaryStatsState.isError = true;
          });
        })
        .finally(() => {
          set((draft) => {
            draft.summaryStatsState.isLoading = false;
          });
        });
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
            get()
              .fetchCampaignTimeSeries(get().dateSelectionState.currentSelection)
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
        const timePeriod = get().dateSelectionState.currentSelection;
        const reportingView = get().reportingViewState.currentSelection;
        const fetchedAds = await getDateFilteredAds({
          campaignIds: [campaignId],
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
    ) => {
      const requestTimestamp = new Date().toISOString();
      try {
        // Fetch campaigns in pages
        const fetchedCampaigns = await getDateFilteredCampaigns({
          abortSignal,
          reportingView,
          requestTimestamp,
          timePeriod: dateSelection,
        });

        let nextSerialCursor = fetchedCampaigns.next_cursor;
        let allCampaigns = fetchedCampaigns.campaigns || [];

        /* eslint-disable no-await-in-loop */
        while (nextSerialCursor) {
          const nextFetchedCampaigns = await getDateFilteredCampaigns({
            abortSignal,
            paginationOptions: { cursor: nextSerialCursor },
            reportingView,
            requestTimestamp,
            timePeriod: dateSelection,
          });
          nextSerialCursor = nextFetchedCampaigns.next_cursor;
          allCampaigns = allCampaigns.concat(nextFetchedCampaigns.campaigns || []);
          if (!nextSerialCursor) {
            break;
          }
        }

        // Status fetch always after campaigns fetch
        const campaignIds = allCampaigns.map((campaign) => campaign.id);
        get().getCampaignStatuses(campaignIds);

        return allCampaigns;
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
        const response = await getFilteredCampaignIds(request);
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
    ) => {
      const requestTimestamp = new Date().toISOString();
      // Use current universe id filter if none is passed in
      const currentUniverseId = get().universePickerFilterState.universeFilter.universe_id;
      const currentUniverseIdFilter = currentUniverseId || undefined;
      const universeIdToFilterWith =
        universeId === undefined ? currentUniverseIdFilter : universeId;
      try {
        const response = await getAdAccountSummary({
          abortSignal,
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
    handleDateSelectionChange: (newDateSelection: DateFilteringTimePeriod) => {
      const currentReportingView = get().reportingViewState.currentSelection;

      get()
        .refetchCampaignsAndSummary({
          dateSelection: newDateSelection,
          onError: (draft) => {
            // If the new selection failed, keep the previous campaigns and summary stats
            // Show error under date selector
            draft.dateSelectionState.isError = true;
          },
          onSuccess: (_fetchedCampaigns, _summaryStats, draft) => {
            // Commit the new date selection
            draft.dateSelectionState = {
              currentSelection: newDateSelection,
              isError: false,
            };
          },
          reportingView: currentReportingView,
        })
        .then((success) => {
          if (!success) {
            return;
          }
          // Keep the drawer's reporting chart synchronized with the page-level
          // date selection when the drawer is open.
          if (get().campaignDetailsState.campaign) {
            get()
              .fetchCampaignTimeSeries(newDateSelection)
              .catch(() => undefined);
          }
        });
    },
    handleReportingViewChange: (newReportingView: ReportingViewType) => {
      const currentDateSelection = get().dateSelectionState.currentSelection;
      const currentUniverseId = get().universePickerFilterState.universeFilter.universe_id;

      get()
        .refetchCampaignsAndSummary({
          dateSelection: currentDateSelection,
          onError: (draft) => {
            draft.reportingViewState.isError = true;
          },
          onSuccess: (_fetchedCampaigns, _summaryStats, draft) => {
            draft.reportingViewState = {
              currentSelection: newReportingView,
              isError: false,
            };
          },
          reportingView: newReportingView,
          universeId: currentUniverseId,
        })
        .then((success) => {
          if (!success) {
            return;
          }
          if (get().campaignDetailsState.campaign) {
            get()
              .fetchCampaignTimeSeries(get().campaignDetailsState.timeSeriesPeriod)
              .catch(() => undefined);
          }
        });
    },
    handleUniversePickerChange: (universe: AdvertisedUniverse) => {
      set((draft) => {
        draft.campaignsState.isLoading = true;
        draft.filteredIdsState.isLoading = true;
        draft.summaryStatsState.isLoading = true;
      });

      const currentDateSelection = get().dateSelectionState.currentSelection;
      const currentReportingView = get().reportingViewState.currentSelection;

      // Use shared request manager to handle cancellation of stale requests (fire-and-forget)
      dateReportingViewRequestManager
        .executeRequest(async (abortSignal) => {
          const [campaigns, filteredCampaignIds, summaryStats] = await Promise.all([
            get().getDateFilteredCampaigns(currentDateSelection, currentReportingView, abortSignal),
            get().getFilteredCampaignIds({
              newCampaignNameSearch: undefined,
              newUniverseId: universe.universe_id,
            }),
            get().getSummaryStats(
              currentDateSelection,
              currentReportingView,
              universe.universe_id,
              abortSignal,
            ),
          ]);

          return { campaigns, filteredCampaignIds, summaryStats };
        })
        .then((result) => {
          // If result is null, the request was cancelled or superseded
          if (result === null) {
            return;
          }

          set((draft) => {
            draft.campaignsState.data = result.campaigns;
            draft.campaignsState.isError = false;
            draft.filteredIdsState = {
              filteredCampaignIds: result.filteredCampaignIds,
              isLoading: false,
            };
            draft.summaryStatsState.data = result.summaryStats;
            draft.summaryStatsState.isError = false;
            // Commit the change only if successful
            draft.universePickerFilterState.universeFilter = universe;
            draft.universePickerFilterState.isError = false;
            // Clear campaign name search error as a successful filter request has been sent
            draft.campaignNameFilterState.isError = false;
          });
        })
        .catch(() => {
          set((draft) => {
            draft.universePickerFilterState.isError = true;
          });
        })
        .finally(() => {
          set((draft) => {
            // Clear error from date picker as more recent requests have been sent
            draft.dateSelectionState.isError = false;

            draft.campaignsState.isLoading = false;
            draft.filteredIdsState.isLoading = false;
            draft.summaryStatsState.isLoading = false;
          });
        });
    },
    /**
     * Helper function to refetch campaigns and summary stats with new parameters.
     * Manages loading states and handles success/error scenarios consistently.
     * Uses request manager to prevent race conditions from rapid filter changes.
     */
    refetchCampaignsAndSummary: async (params: {
      dateSelection: DateFilteringTimePeriod;
      onError: (draft: NewFlowStoreType) => void;
      onSuccess: (
        fetchedCampaigns: Campaign[],
        summaryStats: AdAccountSummary,
        draft: NewFlowStoreType,
      ) => void;
      reportingView: ReportingViewType;
      universeId?: number;
    }) => {
      set((draft) => {
        draft.campaignsState.isLoading = true;
        draft.summaryStatsState.isLoading = true;
      });

      try {
        // Use request manager to handle cancellation of stale requests
        const result = await dateReportingViewRequestManager.executeRequest(async (abortSignal) => {
          const [fetchedCampaigns, summaryStats] = await Promise.all([
            get().getDateFilteredCampaigns(params.dateSelection, params.reportingView, abortSignal),
            get().getSummaryStats(
              params.dateSelection,
              params.reportingView,
              params.universeId,
              abortSignal,
            ),
          ]);

          return { fetchedCampaigns, summaryStats };
        });

        // If result is null, the request was cancelled or superseded.
        if (result === null) {
          return false;
        }

        set((draft) => {
          draft.campaignsState.data = result.fetchedCampaigns;
          draft.campaignsState.isError = false;
          draft.summaryStatsState.data = result.summaryStats;
          draft.summaryStatsState.isError = false;

          // Client-side name search IDs are scoped to the campaigns currently in memory.
          // Recompute against the newly fetched set so date/view changes don't hide matches.
          const { campaignNameSearch } = draft.campaignNameFilterState;
          if (campaignNameSearch) {
            const universeId =
              draft.universePickerFilterState.universeFilter.universe_id || undefined;
            draft.filteredIdsState = {
              filteredCampaignIds: filterCampaignIdsLocally(
                result.fetchedCampaigns,
                campaignNameSearch,
                universeId,
              ),
              isLoading: false,
            };
          }

          params.onSuccess(result.fetchedCampaigns, result.summaryStats, draft);
        });
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
          draft.summaryStatsState.isLoading = false;
        });
      }
    },
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
    statusesState: {
      adStatuses: new Map<string, GetAdStatusResponseType>(),
      campaignStatuses: new Map<string, GetCampaignStatusResponseType>(),
      updatedAdStatuses: new Map<string, GetAdStatusResponseType>(),
      updatedCampaignStatuses: new Map<string, GetCampaignStatusResponseType>(),
    },
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
  })),
);
