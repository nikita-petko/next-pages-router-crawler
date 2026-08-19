import type { CreatorSettingsClient } from '../clients/creatorSettingsClient';
import type { UserSettingsClient } from '../clients/usersSettingsClient';
import type { ThemeMode } from '../constants/themeConstants';
import {
  ThemeOption,
  DarkMode,
  LightMode,
  defaultThemeMode,
  themeGenericSettingType,
} from '../constants/themeConstants';

const isValidThemeOptionEnum = (enumValue: string): enumValue is ThemeOption =>
  Object.values<string>(ThemeOption).includes(enumValue);

type UserThemeTypeSettingResponse = { themeType: string };

const getThemeModeFromWWW = async (userSettingsClient: UserSettingsClient): Promise<ThemeMode> => {
  const rawResponse = await userSettingsClient.getUserSetting('themeType');
  let response: UserThemeTypeSettingResponse;
  if (typeof rawResponse === 'string') {
    response = JSON.parse(rawResponse) as UserThemeTypeSettingResponse;
  } else {
    response = rawResponse as UserThemeTypeSettingResponse;
  }

  return response.themeType === 'Dark' ? DarkMode : LightMode;
};

export const getThemeOption = async (
  creatorSettingsClient: CreatorSettingsClient,
  userId = 0,
): Promise<ThemeOption | null> => {
  if (userId <= 0) {
    return null;
  }

  try {
    const { settingValue = '' } = await creatorSettingsClient.getGenericCreatorSetting(
      userId,
      themeGenericSettingType,
    );

    if (isValidThemeOptionEnum(settingValue)) {
      return settingValue;
    }
  } catch {
    // let it fall through for the default value returned below
  }

  return null;
};

export const updateThemeOption = async (
  creatorSettingsClient: CreatorSettingsClient,
  themeOption: ThemeOption,
  userId = 0,
): Promise<ThemeOption | null> => {
  if (userId <= 0) {
    return null;
  }

  try {
    const { settingValue = '' } = await creatorSettingsClient.updateGenericCreatorSetting(
      userId,
      themeGenericSettingType,
      themeOption,
    );

    if (isValidThemeOptionEnum(settingValue)) {
      return settingValue;
    }
  } catch {
    // let it fall through for the default value returned below
  }

  return null;
};

export const convertThemeOptionToMode = async (
  userSettingsClient: UserSettingsClient,
  themeOption: ThemeOption,
): Promise<ThemeMode> => {
  switch (themeOption) {
    case ThemeOption.Dark:
    case ThemeOption.StudioDark:
      return DarkMode;
    case ThemeOption.Light:
    case ThemeOption.StudioLight:
      return LightMode;
    case ThemeOption.SyncDevice: {
      const systemMediaQuery = window?.matchMedia('(prefers-color-scheme: dark)');
      return systemMediaQuery.matches ? DarkMode : LightMode;
    }
    case ThemeOption.SyncWWW: {
      const wwwThemeMode = await getThemeModeFromWWW(userSettingsClient);
      return wwwThemeMode;
    }
    default:
      return defaultThemeMode;
  }
};
