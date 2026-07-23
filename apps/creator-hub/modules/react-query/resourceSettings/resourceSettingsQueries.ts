import { useMutation, useQuery } from '@tanstack/react-query';
import type { PreferenceConfiguration } from '@rbx/client-resource-settings-api/v1';
import { DataSharingLicenseType, PreferenceType } from '@rbx/client-resource-settings-api/v1';
import { getAssetConfigurationBestEffort } from '@modules/data-collection/utils/apiUtils';
import { isDataSharingAvailableForAssetType } from '@modules/marketplaceFiatService/utils/fiatUtils';
import type { Asset } from '@modules/miscellaneous/common';
import { fetchPreferences, setPreferences } from './resourceSettingsRequests';

const KEY_PREFIX = 'resourceSettings';

export function useGetCreatorStoreDataSharingPreference(enabled: boolean = true) {
  return useQuery({
    queryKey: [KEY_PREFIX, 'getCreatorStoreDataSharingPreference'],
    queryFn: async () => {
      const result = await fetchPreferences([PreferenceType.CreatorStoreAssets]);
      let isDataSharingDefaultEnabled = false;
      if (result.isEligible) {
        result?.configurations.forEach((config) => {
          if (config.type === PreferenceType.CreatorStoreAssets) {
            isDataSharingDefaultEnabled = !config.isOptOut;
          }
        });
      }
      return { isEligible: result.isEligible, isDataSharingDefaultEnabled };
    },
    enabled,
  });
}

export function useGetDataSharingPreferences(
  preferences: PreferenceType[],
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: [KEY_PREFIX, 'getDataSharingPreferences'],
    queryFn: async () => {
      return fetchPreferences(preferences);
    },
    enabled,
  });
}

export function useSetDataSharingPreferences() {
  return useMutation({
    mutationKey: [KEY_PREFIX, 'updateDataSharingPreferences'],
    mutationFn: async (configurations: PreferenceConfiguration[]) => {
      return setPreferences(configurations);
    },
  });
}

export function useGetWasDataSharingEnabled(assetId: number, assetType: Asset) {
  return useQuery({
    queryKey: [KEY_PREFIX, 'getWasDataSharingEnabled', assetId, assetType],
    queryFn: async () => {
      // If the asset type is not available for data sharing, return null
      // If the asset itself has data sharing preferences stored, return the preference
      // If the asset itself has no data sharing preferences stored, return null
      if (!isDataSharingAvailableForAssetType(assetType)) {
        return null;
      }
      const response = await getAssetConfigurationBestEffort(assetId);
      const wasDataSharingEnabled =
        response?.dataSharingLicenseTypes.includes(DataSharingLicenseType.RobloxGlobal) ?? null;
      return wasDataSharingEnabled;
    },
  });
}
