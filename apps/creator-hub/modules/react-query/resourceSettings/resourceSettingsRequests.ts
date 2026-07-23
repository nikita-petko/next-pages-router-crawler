import { ResourceSettingsClient } from '@modules/clients';
import { PreferenceConfiguration, PreferenceType } from '@rbx/clients/resourceSettingsApi';

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
