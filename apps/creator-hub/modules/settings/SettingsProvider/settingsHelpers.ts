import { economyClient, clientsettingsClient } from '@modules/clients';
import { FeatureFlagName, featureFlagDefaults } from './featureFlags';

type Widen<T> = T extends boolean
  ? boolean
  : T extends string
    ? string
    : T extends number
      ? number
      : T;

// Derived value type for flags based on corresponding default values
export type TClientSettings = {
  readonly [K in FeatureFlagName]: Widen<(typeof featureFlagDefaults)[K]>;
};

export const defaultClientSettings: TClientSettings = (
  Object.keys(featureFlagDefaults) as Array<keyof typeof featureFlagDefaults>
).reduce(
  (acc, key) => ({
    ...acc,
    [key]: featureFlagDefaults[key],
  }),
  {} as TClientSettings,
);

export type TIsUserEligibleForDevExSettings = {
  isUserEligibleForDevEx: boolean;
};

export type TExperienceEventsSettings = {
  isExperienceCreatedByCurrentUserOrGroup: boolean;
};

export type TSettings = TClientSettings &
  TIsUserEligibleForDevExSettings &
  TExperienceEventsSettings;

export const defaultIsUserEligibleForDevExSettings = {
  isUserEligibleForDevEx: false,
};

export const defaultExperienceEventsSettings = {
  isExperienceCreatedByCurrentUserOrGroup: false,
};

export const defaultSettings: TSettings = {
  ...defaultClientSettings,
  ...defaultIsUserEligibleForDevExSettings,
  ...defaultExperienceEventsSettings,
};

export const getLocalFlagOverrides = async (): Promise<Record<string, string>> => {
  try {
    const response = await fetch('/flag-overrides.json');
    const overrides = await response.json();
    return overrides as Record<string, string>;
  } catch {
    return {};
  }
};

export const getClientSettings = async (): Promise<TClientSettings> => {
  try {
    let { applicationSettings = {} } = await clientsettingsClient.getApplicationSettings();

    if (process.env.NODE_ENV === 'development') {
      const overrides = await getLocalFlagOverrides();
      applicationSettings = { ...applicationSettings, ...overrides };
    }

    const parsedResponse: Record<string, boolean | string | number> = {};
    Object.entries(applicationSettings).forEach(([key, value]) => {
      try {
        const settingType = typeof defaultClientSettings[key as keyof TClientSettings];
        parsedResponse[key] =
          settingType === 'boolean' || settingType === 'number' ? JSON.parse(value) : value;
      } catch (error) {
        // eslint-disable-next-line no-console -- NOTE (jcountryman, 08/29/22): Catching any potentially invalid
        console.error(error);
      }
    });
    return parsedResponse as TClientSettings;
  } catch {
    return defaultClientSettings;
  }
};

export const getIsUserEligibleForDevExSettings =
  async (): Promise<TIsUserEligibleForDevExSettings> => {
    try {
      await economyClient.getDeveloperExchangeInfo();
      return { isUserEligibleForDevEx: true };
    } catch {
      return defaultIsUserEligibleForDevExSettings;
    }
  };
