import { useCallback, useEffect, useMemo, useState } from 'react';

import { defaultTimeZone } from '@constants/app';
import {
  createAdIntegrationCampaignDetails,
  CreateAdIntegrationCampaignResult,
  updateAdIntegrationCampaignDetails,
} from '@services/ads/adIntegrationCampaignService';
import {
  AdIntegrationCampaignStoreType,
  AdIntegrationUniverseLoadOptions,
  useAdIntegrationCampaignStore,
} from '@stores/adIntegrationCampaignStoreProvider';
import { useAppStore } from '@stores/appStoreProvider';
import {
  AdIntegrationCampaignDetailsChangedFields,
  AdIntegrationCampaignDetailsFormValues,
} from '@type/adIntegrations';
import { GetTimezoneObjFromEnum, GetValidatedTimezoneDbName } from '@utils/timezone';

interface UseAdIntegrationCampaignApiOptions {
  loadUniversesOnMount?: boolean;
}

const useAdIntegrationCampaignApi = ({
  loadUniversesOnMount = true,
}: UseAdIntegrationCampaignApiOptions = {}) => {
  const { timezoneDbName: rawTimezoneDbName } = useAppStore((state) =>
    GetTimezoneObjFromEnum(
      state.advertiserState?.data?.organization?.time_zone || defaultTimeZone.value,
    ),
  );
  const timezoneDbName = useMemo(
    () => GetValidatedTimezoneDbName(rawTimezoneDbName),
    [rawTimezoneDbName],
  );

  const {
    data: campaignList,
    isError: isCampaignListError,
    isLoading: isCampaignListLoading,
  } = useAdIntegrationCampaignStore((state: AdIntegrationCampaignStoreType) => state.campaignList);
  const {
    data: campaignDetails,
    isError: isCampaignDetailsError,
    isLoading: isCampaignDetailsLoading,
  } = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.campaignDetails,
  );
  const campaignCreatedTimestampMs = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.campaignCreatedTimestampMs,
  );
  const campaignEndTimestampMs = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.campaignEndTimestampMs,
  );
  const campaignModerationStatus = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.campaignModerationStatus,
  );
  const campaignPlacements = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.campaignPlacements,
  );
  const campaignSavedRevenueShareSignals = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.campaignSavedRevenueShareSignals,
  );
  const campaignStartTimestampMs = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.campaignStartTimestampMs,
  );
  const campaignStatus = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.campaignStatus,
  );
  const {
    data: universesCanAdvertise,
    isError: isUniversesError,
    isLoading: isUniversesLoading,
  } = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.universesCanAdvertise,
  );
  const publisherEligibleUniverseIds = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.publisherEligibleUniverseIds,
  );
  const invalidateCampaignDetailsCache = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.invalidateCampaignDetailsCache,
  );
  const storeGetCampaignDetailsById = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.getCampaignDetailsById,
  );
  const getCampaignListBySelectedUniverse = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.getCampaignListBySelectedUniverse,
  );
  const getUniversesCanAdvertise = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.getUniversesCanAdvertise,
  );
  const selectedUniverseId = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.selectedUniverseId,
  );
  const setSelectedUniverseId = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.setSelectedUniverseId,
  );
  const campaignStatusToggleLoadingMap = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.campaignStatusToggleLoadingMap,
  );
  const toggleCampaignStatus = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.toggleCampaignStatus,
  );
  const archiveCampaign = useAdIntegrationCampaignStore(
    (state: AdIntegrationCampaignStoreType) => state.archiveCampaign,
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (loadUniversesOnMount) {
      getUniversesCanAdvertise();
    }
  }, [getUniversesCanAdvertise, loadUniversesOnMount]);

  const getUniversesForAdIntegrations = useCallback(
    async (forceRefresh?: boolean, options?: AdIntegrationUniverseLoadOptions) => {
      await getUniversesCanAdvertise(forceRefresh, options);
    },
    [getUniversesCanAdvertise],
  );

  const getCampaignDetailsById = useCallback(
    async (campaignId: string, forceRefresh?: boolean) => {
      await storeGetCampaignDetailsById(campaignId, timezoneDbName, forceRefresh);
    },
    [storeGetCampaignDetailsById, timezoneDbName],
  );

  const createCampaignDetails = useCallback(
    async (
      payload: AdIntegrationCampaignDetailsFormValues,
    ): Promise<CreateAdIntegrationCampaignResult> => {
      setIsSubmitting(true);
      try {
        return await createAdIntegrationCampaignDetails(payload, timezoneDbName);
      } finally {
        setIsSubmitting(false);
      }
    },
    [timezoneDbName],
  );

  const updateCampaignDetails = useCallback(
    async (
      campaignId: string,
      payload: AdIntegrationCampaignDetailsFormValues,
      changedFields?: AdIntegrationCampaignDetailsChangedFields,
    ): Promise<AdIntegrationCampaignDetailsFormValues> => {
      setIsSubmitting(true);
      try {
        const result = await updateAdIntegrationCampaignDetails(
          campaignId,
          payload,
          timezoneDbName,
          changedFields,
        );
        await invalidateCampaignDetailsCache(campaignId);
        return result;
      } finally {
        setIsSubmitting(false);
      }
    },
    [invalidateCampaignDetailsCache, timezoneDbName],
  );

  return {
    archiveCampaign,
    campaignCreatedTimestampMs,
    campaignDetails,
    campaignEndTimestampMs,
    campaignList,
    campaignModerationStatus,
    campaignPlacements,
    campaignSavedRevenueShareSignals,
    campaignStartTimestampMs,
    campaignStatus,
    campaignStatusToggleLoadingMap,
    createCampaignDetails,
    getCampaignDetailsById,
    getCampaignListBySelectedUniverse,
    getUniversesCanAdvertise: getUniversesForAdIntegrations,
    isCampaignDetailsError,
    isCampaignDetailsLoading,
    isCampaignListError,
    isCampaignListLoading,
    isSubmitting,
    isUniversesError,
    isUniversesLoading,
    publisherEligibleUniverseIds,
    selectedUniverseId,
    setSelectedUniverseId,
    toggleCampaignStatus,
    universesCanAdvertise,
    updateCampaignDetails,
  };
};

export default useAdIntegrationCampaignApi;
