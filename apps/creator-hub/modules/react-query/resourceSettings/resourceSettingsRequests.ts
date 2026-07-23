import type { PreferenceConfiguration, PreferenceType } from '@rbx/client-resource-settings-api/v1';
import { ResourceSettingsClient } from '@modules/clients/resourceSettings';

const { preferenceApi } = ResourceSettingsClient;

export const fetchPreferences = (preferenceTypes: PreferenceType[]) => {
  return preferenceApi.preferenceBatchGetPreferenceConfigurations({
    preferenceTypes,
  });
};

export const setPreferences = (preferences: PreferenceConfiguration[]) => {
  return preferenceApi.preferenceBatchSetPreferenceConfigurations({
    preferenceBatchSetPreferenceConfigurationsRequest: { configurations: preferences },
  });
};
