import { round } from 'lodash';
import { ParsedUrlQuery } from 'querystring';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import { ServerAdType } from '@constants/ad';
import { ServerAdSetBrandSuitabilityType } from '@constants/adSet';
import { DefaultAdvancedTargeting } from '@constants/advancedTargeting';
import { AdCreditBalanceScope, ADD_PAYMENT_TABS } from '@constants/billing';
import { ServerCampaignObjectiveType, ServerDetailedTargetingMatchType } from '@constants/campaign';
import { AllCampaignObjectives, FlowTypes } from '@constants/campaignBuilder';
import { getAudienceEstimate } from '@services/ads/getAudienceEstimateService';
import { getEligibility as getEligibilityService } from '@services/ads/getEligibilityService';
import { getSimplifiedCampaign } from '@services/ads/getEntitiesService';
import { listPlaces } from '@services/ads/getPlacesService';
import { getCampaignStatus } from '@services/ads/getStatusService';
import { listUniversesCanAdvertise } from '@services/ads/getUniversesService';
import { useAppStore } from '@stores/appStoreProvider';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';
import {
  FetchInitialAudienceEstimatesByObjectiveParams,
  FetchInitialAudienceEstimatesParams,
  GetAudienceEstimateByObjectiveParams,
  GetAudienceEstimateParams,
  GetAudienceEstimateResponseType,
} from '@type/advancedTargeting';
import {
  CalloutBannerType,
  GetRecommendationResponse,
  SimplifiedCampaignType,
} from '@type/campaignBuilder';
import { GetEligibilityResponse } from '@type/eligibility';
import { ListPlacesResponse } from '@type/place';
import { UniverseShapeType } from '@type/universe';
import {
  GetObjectiveTargetingCriteriaByObjectiveRequestJson,
  GetObjectiveTargetingCriteriaRequestJson,
} from '@utils/campaignBuilder';
import { UsdToMicroUsd } from '@utils/currency';
import {
  EmptyRequestStateType,
  GetEmptyRequestState,
  GetInitialRequestState,
  RequestStateType,
} from '@utils/zustandUtils';

type StringBooleanRecord = Record<string, boolean>;
interface CampaignBuilderStoreStateType {
  adOpsDrawerOpen: boolean;
  advancedJoinDrawerOpen: boolean;
  advancedTargetingDrawerOpen: boolean;
  audienceEstimateByObjective: {
    estimates: Partial<
      Record<ServerCampaignObjectiveType, EmptyRequestStateType<GetAudienceEstimateResponseType>>
    >;
    universeId: number;
  };
  audienceEstimationContext: {
    estimates: Partial<
      Record<
        ServerDetailedTargetingMatchType,
        EmptyRequestStateType<GetAudienceEstimateResponseType>
      >
    >;
    // Track the latest real-time request ID to prevent stale responses
    latestRealTimeRequestId: number;
    universeId: number;
  };
  calloutBanners: CalloutBannerType[];
  campaignSpendMicroUsd: number;
  campaignTodaySpendMicroUsd: number;
  detailedTargetingMatchType: ServerDetailedTargetingMatchType;
  eligibilityContext: {
    response: EmptyRequestStateType<GetEligibilityResponse>;
    universeId: number;
  };
  flowType?: FlowTypes;
  imagesUploading: StringBooleanRecord;
  isCreativeLibraryRegistrationInProgress: boolean;
  isImageUploadInProgress: boolean;
  isVideoUploadInProgress: boolean;
  logoDrawerOpen: boolean;
  paymentMethodDrawerInitialBalanceScope: AdCreditBalanceScope | null;
  paymentMethodDrawerInitialPaymentTab: ADD_PAYMENT_TABS | null;
  paymentMethodDrawerOpen: boolean;
  placesByUniverseId: Record<number, RequestStateType<ListPlacesResponse>>;
  prefilledCampaignFields: Partial<SimplifiedCampaignType>;
  recommendation: GetRecommendationResponse;
  simplifiedCampaign: EmptyRequestStateType<SimplifiedCampaignType>;
  thumbnailDrawerOpen: boolean;
  universesCanAdvertise: RequestStateType<UniverseShapeType[]>;
  videoDrawerOpen: boolean;
}

interface CampaignBuilderStoreActionType {
  clearSimplifiedCampaign: () => void;
  fetchInitialAudienceEstimates: (data: FetchInitialAudienceEstimatesParams) => void;
  fetchInitialAudienceEstimatesByObjective: (
    data: FetchInitialAudienceEstimatesByObjectiveParams,
  ) => void;
  getAudienceEstimate: (data: GetAudienceEstimateParams) => void;
  getAudienceEstimateByObjective: (data: GetAudienceEstimateByObjectiveParams) => void;
  getEligibility: (universeId?: number) => void;
  getPlaces: (universeId: number) => void;
  getSimplifiedCampaign: (campaignId: string) => void;
  getUniversesCanAdvertise: () => void;
  setAdOpsDrawerOpen: (open: boolean) => void;
  setAdvancedJoinDrawerOpen: (open: boolean) => void;
  setAdvancedTargetingDrawerOpen: (open: boolean) => void;
  setCalloutBanners: (calloutBanners: CalloutBannerType[]) => void;
  setCreativeLibraryRegistrationInProgress: (inProgress: boolean) => void;
  setDetailedTargetingMatchType: (
    detailedTargetingMatchType: ServerDetailedTargetingMatchType,
  ) => void;
  setFlowType: (flowType: FlowTypes) => void;
  setImageUploading: (id: string, uploading: boolean) => void;
  setIsVideoUploadInProgress: (uploading: boolean) => void;
  setLogoDrawerOpen: (open: boolean, universeId: number) => void;
  setPaymentMethodDrawerOpen: (
    open: boolean,
    initialPaymentTab?: ADD_PAYMENT_TABS,
    initialBalanceScope?: AdCreditBalanceScope,
  ) => void;
  setPrefilledCampaignFields: (routerQuery: ParsedUrlQuery) => void;
  setRecommendation: (recommendation: GetRecommendationResponse) => void;
  setThumbnailDrawerOpen: (open: boolean, universeId: number) => void;
  setVideoDrawerOpen: (open: boolean, universeId: number) => void;
}

export interface CampaignBuilderStoreType
  extends CampaignBuilderStoreStateType, CampaignBuilderStoreActionType {}

export const useCampaignBuilderStore = create<CampaignBuilderStoreType>()(
  immer((set, get) => ({
    adOpsDrawerOpen: false,
    advancedJoinDrawerOpen: false,
    advancedTargetingDrawerOpen: false,
    audienceEstimateByObjective: {
      estimates: {},
      universeId: 0,
    },
    audienceEstimationContext: {
      estimates: {},
      latestRealTimeRequestId: 0,
      universeId: 0,
    },
    calloutBanners: [],
    campaignSpendMicroUsd: 0,
    campaignTodaySpendMicroUsd: 0,
    clearSimplifiedCampaign: () => {
      set((draft) => {
        draft.simplifiedCampaign = GetEmptyRequestState<SimplifiedCampaignType>();
      });
    },
    detailedTargetingMatchType:
      ServerDetailedTargetingMatchType.DETAILED_TARGETING_MATCH_TYPE_UNSPECIFIED,
    eligibilityContext: {
      response: GetEmptyRequestState<GetEligibilityResponse>(),
      universeId: 0,
    },
    fetchInitialAudienceEstimates: (data: FetchInitialAudienceEstimatesParams) => {
      set((draft) => {
        draft.audienceEstimationContext.universeId = data.universeId;
      });
      data.detailedTargetingMatchTypes.forEach((audience) => {
        const retargetingCriteria = GetObjectiveTargetingCriteriaRequestJson(audience);
        const targeting_criteria = {
          ...DefaultAdvancedTargeting,
          ...retargetingCriteria,
        };

        const request = {
          ad_type: [ServerAdType.SPONSORED_UNIVERSE],
          targeting_criteria,
          universe_id: data.universeId,
          universe_suitability_filter:
            ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_UNSPECIFIED,
        };
        get().getAudienceEstimate({
          detailedTargetingMatchType: audience,
          isInitialFetch: true,
          request,
          universeId: data.universeId,
        });
      });
    },

    fetchInitialAudienceEstimatesByObjective: (
      data: FetchInitialAudienceEstimatesByObjectiveParams,
    ) => {
      data.objectives.forEach((objective) => {
        const request = {
          ad_type: [ServerAdType.SPONSORED_UNIVERSE],
          targeting_criteria:
            objective === ServerCampaignObjectiveType.VISITS
              ? DefaultAdvancedTargeting
              : GetObjectiveTargetingCriteriaByObjectiveRequestJson(objective),
          universe_id:
            objective === ServerCampaignObjectiveType.VISITS ? undefined : data.universeId,
          universe_suitability_filter:
            ServerAdSetBrandSuitabilityType.UNIVERSE_SUITABILITY_FILTER_UNSPECIFIED,
        };
        get().getAudienceEstimateByObjective({ objective, request, universeId: data.universeId });
      });
    },
    flowType: FlowTypes.CREATE,
    getAudienceEstimate: async (data: GetAudienceEstimateParams) => {
      // For real-time requests, increment and track the request ID to prevent stale responses
      let requestId: number | undefined;
      set((draft) => {
        if (!data.isInitialFetch) {
          draft.audienceEstimationContext.latestRealTimeRequestId += 1;
          requestId = draft.audienceEstimationContext.latestRealTimeRequestId;
        }
        draft.audienceEstimationContext.universeId = data.universeId;
        draft.audienceEstimationContext.estimates[data.detailedTargetingMatchType] = {
          data: undefined,
          isError: false,
          isLoading: true,
        };
      });

      let responseData: GetAudienceEstimateResponseType | undefined;
      let isError = false;
      try {
        responseData = await getAudienceEstimate(data.request);
      } catch (_error) {
        isError = true;
      }

      set((draft) => {
        // For initial fetches, check if universe hasn't changed (populate all audience slots for correct universe)
        // For real-time updates, check if this is still the latest request (discard stale responses)
        const isLatestRequest =
          draft.audienceEstimationContext.latestRealTimeRequestId === requestId;
        const shouldUpdate = data.isInitialFetch
          ? draft.audienceEstimationContext.universeId === data.universeId
          : isLatestRequest;

        if (shouldUpdate) {
          draft.audienceEstimationContext.estimates[data.detailedTargetingMatchType] = {
            data: responseData,
            isError,
            isLoading: false,
          };
        }
      });
    },
    getAudienceEstimateByObjective: async (data: GetAudienceEstimateByObjectiveParams) => {
      try {
        set((draft) => {
          draft.audienceEstimateByObjective.universeId = data.universeId;
          draft.audienceEstimateByObjective.estimates[data.objective] = {
            data: undefined,
            isError: false,
            isLoading: true,
          };
        });
        const responseData = await getAudienceEstimate(data.request);
        set((draft) => {
          if (draft.audienceEstimateByObjective.universeId === data.universeId) {
            draft.audienceEstimateByObjective.estimates[data.objective] = {
              data: responseData,
              isError: false,
              isLoading: false,
            };
          }
        });
      } catch (_error) {
        set((draft) => {
          if (draft.audienceEstimateByObjective.universeId === data.universeId) {
            draft.audienceEstimateByObjective.estimates[data.objective] = {
              data: undefined,
              isError: true,
              isLoading: false,
            };
          }
        });
      }
    },
    getEligibility: async (universeId?: number) => {
      const isEligibilityEndpointEnabled =
        useAppStore.getState().appMetadataState?.data?.isEligibilityEndpointEnabled ?? false;
      if (!isEligibilityEndpointEnabled || !universeId) {
        return;
      }
      try {
        set((draft) => {
          draft.eligibilityContext.universeId = universeId;
          draft.eligibilityContext.response = {
            data: undefined,
            isError: false,
            isLoading: true,
          };
        });
        const responseData = await getEligibilityService(universeId);
        set((draft) => {
          if (draft.eligibilityContext.universeId === universeId) {
            draft.eligibilityContext.response = {
              data: responseData,
              isError: false,
              isLoading: false,
            };
          }
        });
      } catch (_error) {
        set((draft) => {
          if (draft.eligibilityContext.universeId === universeId) {
            draft.eligibilityContext.response = {
              data: undefined,
              isError: true,
              isLoading: false,
            };
          }
        });
      }
    },
    getPlaces: async (universeId: number) => {
      const existing = get().placesByUniverseId[universeId];
      if (existing && !existing.isError) {
        return;
      }
      set((draft) => {
        draft.placesByUniverseId[universeId] = {
          data: { places: [] },
          isError: false,
          isLoading: true,
        };
      });
      try {
        const response = await listPlaces(universeId);
        set((draft) => {
          draft.placesByUniverseId[universeId] = {
            data: response,
            isError: false,
            isLoading: false,
          };
        });
      } catch (_error) {
        set((draft) => {
          draft.placesByUniverseId[universeId] = {
            data: { places: [] },
            isError: true,
            isLoading: false,
          };
        });
      }
    },
    getSimplifiedCampaign: async (campaignId: string) => {
      try {
        set((draft) => {
          draft.simplifiedCampaign.isLoading = true;
          draft.simplifiedCampaign.isError = false;
          draft.simplifiedCampaign.data = undefined;
          draft.campaignSpendMicroUsd = 0;
          draft.campaignTodaySpendMicroUsd = 0;
        });
        const { campaign } = await getSimplifiedCampaign(campaignId);
        const response = await getCampaignStatus([campaign.id]);
        if (!response.length) {
          throw new Error('Campaign status not found');
        }
        set((draft) => {
          draft.simplifiedCampaign = {
            data: {
              ...campaign,
              display_status: response[0].display_status,
            },
            isError: false,
            isLoading: false,
          };
          draft.campaignSpendMicroUsd = campaign.performance?.spend_micro_usd ?? 0;
          const spendBeforeToday = campaign.performance?.spend_before_today_micro_usd ?? 0;
          draft.campaignTodaySpendMicroUsd = Math.max(
            0,
            draft.campaignSpendMicroUsd - spendBeforeToday,
          );
        });
      } catch (_error) {
        set((draft) => {
          draft.simplifiedCampaign.isError = true;
          draft.simplifiedCampaign.isLoading = false;
        });
      }
    },
    getUniversesCanAdvertise: async () => {
      try {
        set((draft) => {
          draft.universesCanAdvertise.isLoading = true;
          draft.universesCanAdvertise.isError = false;
          draft.universesCanAdvertise.data = [];
        });
        const universesCanAdvertise = await listUniversesCanAdvertise();
        // Shoot off batched thumbnail request, don't wait for it to finish
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
        });
      } catch (_error) {
        set((draft) => {
          draft.universesCanAdvertise.isError = true;
          draft.universesCanAdvertise.isLoading = false;
        });
      }
    },
    imagesUploading: {},
    isCreativeLibraryRegistrationInProgress: false,
    isImageUploadInProgress: false,
    isVideoUploadInProgress: false,
    logoDrawerOpen: false,
    paymentMethodDrawerInitialBalanceScope: null,
    paymentMethodDrawerInitialPaymentTab: null,
    paymentMethodDrawerOpen: false,
    placesByUniverseId: {},
    prefilledCampaignFields: {},
    recommendation: {} as GetRecommendationResponse,
    setAdOpsDrawerOpen: (open: boolean) => {
      set((draft) => {
        draft.adOpsDrawerOpen = open;
      });
    },
    setAdvancedJoinDrawerOpen: (open: boolean) => {
      set((draft) => {
        draft.advancedJoinDrawerOpen = open;
      });
    },
    setAdvancedTargetingDrawerOpen: (open: boolean) => {
      set((draft) => {
        draft.advancedTargetingDrawerOpen = open;
      });
    },
    setCalloutBanners: (calloutBanners: CalloutBannerType[]) => {
      set((draft) => {
        draft.calloutBanners = calloutBanners;
      });
    },
    setCreativeLibraryRegistrationInProgress: (inProgress: boolean) => {
      set((draft) => {
        draft.isCreativeLibraryRegistrationInProgress = inProgress;
      });
    },
    setDetailedTargetingMatchType: (
      detailedTargetingMatchType: ServerDetailedTargetingMatchType,
    ) => {
      set((draft) => {
        draft.detailedTargetingMatchType = detailedTargetingMatchType;
      });
    },
    setFlowType: (flowType: FlowTypes) => {
      set((draft) => {
        draft.flowType = flowType;
      });
    },
    setImageUploading: (id: string, uploading: boolean) => {
      set((draft) => {
        draft.imagesUploading = {
          ...draft.imagesUploading,
          [id]: uploading,
        };
        draft.isImageUploadInProgress = Object.values(draft.imagesUploading).some(
          (isUploading) => isUploading,
        );
      });
    },
    setIsVideoUploadInProgress: (uploading: boolean) => {
      set((draft) => {
        draft.isVideoUploadInProgress = uploading;
      });
    },
    setLogoDrawerOpen: (open: boolean, universeId: number) => {
      set((draft) => {
        draft.logoDrawerOpen = open;
        logNativeClickEvent(EventName.ToggleLogoDrawer, {
          flowType: get().flowType,
          open: open.toString(),
          universeId: universeId.toString(),
        });
      });
    },
    setPaymentMethodDrawerOpen: (
      open: boolean,
      initialPaymentTab?: ADD_PAYMENT_TABS,
      initialBalanceScope?: AdCreditBalanceScope,
    ) => {
      set((draft) => {
        draft.paymentMethodDrawerInitialPaymentTab = open ? (initialPaymentTab ?? null) : null;
        draft.paymentMethodDrawerInitialBalanceScope = open ? (initialBalanceScope ?? null) : null;
        draft.paymentMethodDrawerOpen = open;
        logNativeClickEvent(EventName.TogglePaymentMethodDrawer, {
          flowType: get().flowType,
          open: open.toString(),
        });
      });
    },
    setPrefilledCampaignFields: (routerQuery: ParsedUrlQuery) =>
      set((draft) => {
        // Reset in case of prev URL params
        draft.prefilledCampaignFields = {};
        if (
          routerQuery.objective &&
          typeof routerQuery.objective === 'string' &&
          AllCampaignObjectives.includes(Number(routerQuery.objective))
        ) {
          draft.prefilledCampaignFields.objective = Number(
            routerQuery.objective,
          ) as ServerCampaignObjectiveType;
        }
        if (
          routerQuery.universeId &&
          typeof routerQuery.universeId === 'string' &&
          Number(routerQuery.universeId) > 0
        ) {
          draft.prefilledCampaignFields.target_universe_id = Number(routerQuery.universeId);
        }
        if (
          routerQuery.budget &&
          typeof routerQuery.budget === 'string' &&
          Number(routerQuery.budget) > 0
        ) {
          const appStore = useAppStore.getState();
          draft.prefilledCampaignFields.budget_in_micro_usd = Math.max(
            UsdToMicroUsd(round(Number(routerQuery.budget), 2)),
            appStore.appMetadataState.data?.campaignMinimumDailyBudgetMicroUsd || 0,
          );
        }
        if (
          routerQuery.duration &&
          typeof routerQuery.duration === 'string' &&
          Number(routerQuery.duration) >= 1
        ) {
          draft.prefilledCampaignFields.duration_in_days = round(Number(routerQuery.duration));
        }
      }),
    setRecommendation: (recommendation: GetRecommendationResponse) => {
      set((draft) => {
        draft.recommendation = recommendation;
      });
    },
    setThumbnailDrawerOpen: (open: boolean, universeId: number) => {
      set((draft) => {
        draft.thumbnailDrawerOpen = open;
        logNativeClickEvent(EventName.ToggleThumbnailDrawer, {
          flowType: get().flowType,
          open: open.toString(),
          universeId: universeId.toString(),
        });
      });
    },
    setVideoDrawerOpen: (open: boolean, universeId: number) => {
      set((draft) => {
        draft.videoDrawerOpen = open;
        logNativeClickEvent(EventName.ToggleVideoDrawer, {
          flowType: get().flowType,
          open: open.toString(),
          universeId: universeId.toString(),
        });
      });
    },
    simplifiedCampaign: GetEmptyRequestState<SimplifiedCampaignType>(),
    thumbnailDrawerOpen: false,
    universesCanAdvertise: GetInitialRequestState<UniverseShapeType[]>([]),
    videoDrawerOpen: false,
  })),
);
