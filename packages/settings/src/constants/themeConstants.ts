import { GenericCreatorSettingType } from '@rbx/client-creator-settings/v1';

export type ThemeMode = 'light' | 'dark';

export enum ThemeOption {
  Dark = 'Dark',
  Light = 'Light',
  SyncWWW = 'SyncWWW',
  SyncDevice = 'SyncDevice',
}

export const themeGenericSettingType = GenericCreatorSettingType.Theme;
export const defaultThemeOption: ThemeOption = ThemeOption.Dark;
export const defaultThemeMode: ThemeMode = 'dark';
export const themeOptionLocalStorageKey = 'creator-hub-theme-option';
export const themeModeLocalStorageKey = 'creator-hub-theme-mode';
