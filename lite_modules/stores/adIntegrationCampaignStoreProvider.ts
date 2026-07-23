import { AdIntegrationPlacement } from '@rbx/client-ads-management-api/v1';
import { QueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { defaultAdvertisedUniverse } from '@constants/universeConstants';
import {
  AD_INTEGRATION_CAMPAIGN_STATUS,
  getAdIntegrationCampaignDetails,
  listAdIntegrationCampaignListItemsByUniverse,
  listPublisherEligibleUniverses,
  updateAdIntegrationCampaignStatus,
} from '@services/ads/adIntegrationCampaignService';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';
import {
  AdIntegrationCampaignDetailsFormValues,
  AdIntegrationCampaignListItem,
  RevenueShareEstimatePreview,
} from '@type/adIntegrations';
import { UniverseShapeType } from '@type/universe';
import { isAdIntegrationCampaignStatusEnabled } from '@utils/adIntegrationCampaign';
import {
  EmptyRequestStateType,
  GetEmptyRequestState,
  GetInitialRequestState,
  RequestStateType,
} from '@utils/zustandUtils';

const QUERY_KEYS = {
  AD_INTEGRATION_CAMPAIGN_DETAILS: 'adIntegrationCampaignDetails',
  AD_INTEGRATION_CAMPAIGN_LIST_BY_UNIVERSE: 'adIntegrationCampaignListByUniverse',
  AD_INTEGRATION_EXPERIENCE_OPTIONS: 'adIntegrationExperienceOptions',
} as const;

interface AdIntegrationCampaignStoreStateType {
  adIntegrationCampaignQueryClient: QueryClient;
  campaignCreatedTimestampMs?: number;
  campaignDetails: EmptyRequestStateType<AdIntegrationCampaignDetailsFormValues>;
  campaignEndTimestampMs?: number;
  campaignList: RequestStateType<AdIntegrationCampaignListItem[]>;
  campaignModerationStatus?: string;
  campaignPlacements: AdIntegrationPlacement[];
  campaignSavedRevenueShareSignals?: RevenueShareEstimatePreview;
  campaignStartTimestampMs?: number;
  campaignStatus?: string;
  campaignStatusToggleLoadingMap: Record<string, boolean>;
  selectedUniverseId: number;
  universesCanAdvertise: RequestStateType<UniverseShapeType[]>;
}

interface AdIntegrationCampaignStoreActionType {
  archiveCampaign: (campaignId: string) => Promise<void>;
  clearCampaignDetails: () => void;
  getCampaignDetailsById: (
    campaignId: string,
    timezoneDbName: string,
    forceRefresh?: boolean,
  ) => Promise<void>;
  getCampaignListBySelectedUniverse: (forceRefresh?: boolean) => Promise<void>;
  getUniversesCanAdvertise: (forceRefresh?: boolean) => Promise<void>;
  invalidateCampaignDetailsCache: (campaignId: string) => Promise<void>;
  setSelectedUniverseId: (universeId: number) => void;
  toggleCampaignStatus: (campaignId: string, currentStatus?: string) => Promise<void>;
}

export interface AdIntegrationCampaignStoreType
  extends AdIntegrationCampaignStoreStateType, AdIntegrationCampaignStoreActionType {}

export const useAdIntegrationCampaignStore = create<AdIntegrationCampaignStoreType>()(
  immer((set, get) => ({
    adIntegrationCampaignQueryClient: new QueryClient(),
    archiveCampaign: async (campaignId: string) => {
      set((draft) => {
        draft.campaignStatusToggleLoadingMap[campaignId] = true;
      });

      try {
        await updateAdIntegrationCampaignStatus(
          campaignId,
          AD_INTEGRATION_CAMPAIGN_STATUS.ARCHIVED,
        );
        await get().adIntegrationCampaignQueryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.AD_INTEGRATION_CAMPAIGN_DETAILS, campaignId],
        });
        await get().getCampaignListBySelectedUniverse(true);
      } finally {
        set((draft) => {
          draft.campaignStatusToggleLoadingMap[campaignId] = false;
        });
      }
    },
    campaignCreatedTimestampMs: undefined,
    campaignDetails: GetEmptyRequestState<AdIntegrationCampaignDetailsFormValues>(),
    campaignEndTimestampMs: undefined,
    campaignList: GetInitialRequestState<AdIntegrationCampaignListItem[]>([]),
    campaignModerationStatus: undefined,
    campaignPlacements: [],
    campaignSavedRevenueShareSignals: undefined,
    campaignStartTimestampMs: undefined,
    campaignStatus: undefined,
    campaignStatusToggleLoadingMap: {},
    clearCampaignDetails: () => {
      set((draft) => {
        draft.campaignCreatedTimestampMs = undefined;
        draft.campaignDetails = GetEmptyRequestState<AdIntegrationCampaignDetailsFormValues>();
        draft.campaignEndTimestampMs = undefined;
        draft.campaignModerationStatus = undefined;
        draft.campaignPlacements = [];
        draft.campaignSavedRevenueShareSignals = undefined;
        draft.campaignStartTimestampMs = undefined;
        draft.campaignStatus = undefined;
      });
    },
    getCampaignDetailsById: async (
      campaignId: string,
      timezoneDbName: string,
      forceRefresh = false,
    ) => {
      try {
        set((draft) => {
          draft.campaignDetails.isError = false;
          draft.campaignDetails.isLoading = true;
        });

        if (forceRefresh) {
          await get().adIntegrationCampaignQueryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.AD_INTEGRATION_CAMPAIGN_DETAILS, campaignId],
          });
        }

        const result = await get().adIntegrationCampaignQueryClient.fetchQuery({
          gcTime: 30 * 60 * 1000,
          queryFn: () => getAdIntegrationCampaignDetails(campaignId, timezoneDbName),
          queryKey: [QUERY_KEYS.AD_INTEGRATION_CAMPAIGN_DETAILS, campaignId],
          staleTime: 5 * 60 * 1000,
        });

        set((draft) => {
          draft.campaignCreatedTimestampMs = result.campaignCreatedTimestampMs;
          draft.campaignDetails = {
            data: result.formValues,
            isError: false,
            isLoading: false,
          };
          draft.campaignEndTimestampMs = result.campaignEndTimestampMs;
          draft.campaignModerationStatus = result.campaignModerationStatus;
          draft.campaignPlacements = result.placements;
          draft.campaignSavedRevenueShareSignals = result.savedRevenueShareSignals;
          draft.campaignStartTimestampMs = result.campaignStartTimestampMs;
          draft.campaignStatus = result.campaignStatus;
        });
      } catch (_error) {
        set((draft) => {
          draft.campaignDetails.isError = true;
          draft.campaignDetails.isLoading = false;
        });
      }
    },
    getCampaignListBySelectedUniverse: async (forceRefresh = false) => {
      try {
        set((draft) => {
          draft.campaignList.isError = false;
          draft.campaignList.isLoading = true;
        });

        const { selectedUniverseId } = get();
        const universes = get().universesCanAdvertise.data;
        const universeIdsToFetch =
          selectedUniverseId === defaultAdvertisedUniverse.universe_id
            ? universes.map((universe) => universe.universe_id)
            : universes
                .filter((universe) => universe.universe_id === selectedUniverseId)
                .map((universe) => universe.universe_id);

        if (universeIdsToFetch.length === 0) {
          set((draft) => {
            draft.campaignList = {
              data: [],
              isError: false,
              isLoading: false,
            };
          });
          return;
        }

        if (forceRefresh) {
          await Promise.all(
            universeIdsToFetch.map((universeId) =>
              get().adIntegrationCampaignQueryClient.invalidateQueries({
                queryKey: [QUERY_KEYS.AD_INTEGRATION_CAMPAIGN_LIST_BY_UNIVERSE, universeId],
              }),
            ),
          );
        }

        const universeNameById = new Map(
          universes.map((universe) => [universe.universe_id, universe.universe_name]),
        );

        const campaignsByUniverse = await Promise.all(
          universeIdsToFetch.map((universeId) =>
            get().adIntegrationCampaignQueryClient.fetchQuery({
              gcTime: 30 * 60 * 1000,
              queryFn: () =>
                listAdIntegrationCampaignListItemsByUniverse(
                  universeId,
                  universeNameById.get(universeId) ?? '',
                ),
              queryKey: [QUERY_KEYS.AD_INTEGRATION_CAMPAIGN_LIST_BY_UNIVERSE, universeId],
              staleTime: 5 * 60 * 1000,
            }),
          ),
        );

        const flatCampaignList = campaignsByUniverse.flat();

        set((draft) => {
          draft.campaignList = {
            data: flatCampaignList,
            isError: false,
            isLoading: false,
          };
        });
      } catch (_error) {
        set((draft) => {
          draft.campaignList.isError = true;
          draft.campaignList.isLoading = false;
        });
      }
    },
    getUniversesCanAdvertise: async (forceRefresh = false) => {
      try {
        set((draft) => {
          draft.universesCanAdvertise.data = [];
          draft.universesCanAdvertise.isError = false;
          draft.universesCanAdvertise.isLoading = true;
        });

        if (forceRefresh) {
          await get().adIntegrationCampaignQueryClient.invalidateQueries({
            queryKey: [QUERY_KEYS.AD_INTEGRATION_EXPERIENCE_OPTIONS],
          });
        }

        const universesCanAdvertise = await get().adIntegrationCampaignQueryClient.fetchQuery({
          gcTime: 30 * 60 * 1000,
          queryFn: () => listPublisherEligibleUniverses(),
          queryKey: [QUERY_KEYS.AD_INTEGRATION_EXPERIENCE_OPTIONS],
          staleTime: 5 * 60 * 1000,
        });

        if (universesCanAdvertise.universes) {
          useThumbnailStore
            .getState()
            .getThumbnailsBatch(
              universesCanAdvertise.universes.map((universe) => universe.universe_id),
            );
        }

        set((draft) => {
          draft.universesCanAdvertise = {
            data: universesCanAdvertise.universes || [],
            isError: false,
            isLoading: false,
          };

          if (
            draft.selectedUniverseId !== defaultAdvertisedUniverse.universe_id &&
            !draft.universesCanAdvertise.data.some(
              (universe) => universe.universe_id === draft.selectedUniverseId,
            )
          ) {
            draft.selectedUniverseId = defaultAdvertisedUniverse.universe_id;
          }
        });
      } catch (_error) {
        set((draft) => {
          draft.universesCanAdvertise.isError = true;
          draft.universesCanAdvertise.isLoading = false;
        });
      }
    },
    invalidateCampaignDetailsCache: async (campaignId: string) => {
      await get().adIntegrationCampaignQueryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.AD_INTEGRATION_CAMPAIGN_DETAILS, campaignId],
      });
    },
    selectedUniverseId: defaultAdvertisedUniverse.universe_id,
    setSelectedUniverseId: (universeId: number) => {
      set((draft) => {
        draft.selectedUniverseId = universeId;
      });
    },
    toggleCampaignStatus: async (campaignId: string, currentStatus?: string) => {
      const toggledStatus = isAdIntegrationCampaignStatusEnabled(currentStatus)
        ? AD_INTEGRATION_CAMPAIGN_STATUS.STOPPED
        : AD_INTEGRATION_CAMPAIGN_STATUS.ENABLED;

      set((draft) => {
        draft.campaignStatusToggleLoadingMap[campaignId] = true;
      });

      try {
        await updateAdIntegrationCampaignStatus(campaignId, toggledStatus);
        await get().adIntegrationCampaignQueryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.AD_INTEGRATION_CAMPAIGN_DETAILS, campaignId],
        });
        await get().getCampaignListBySelectedUniverse(true);
      } finally {
        set((draft) => {
          draft.campaignStatusToggleLoadingMap[campaignId] = false;
        });
      }
    },
    universesCanAdvertise: GetInitialRequestState<UniverseShapeType[]>([]),
  })),
);
