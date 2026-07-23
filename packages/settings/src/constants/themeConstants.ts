import { GenericCreatorSettingType } from '@rbx/client-creator-settings/v1';

export const LightMode = 'light';
export const DarkMode = 'dark';

export type ThemeMode = typeof LightMode | typeof DarkMode;

export enum ThemeOption {
  Dark = 'Dark',
  Light = 'Light',
  StudioDark = 'StudioDark',
  StudioLight = 'StudioLight',
  SyncWWW = 'SyncWWW',
  SyncDevice = 'SyncDevice',
}

export const themeGenericSettingType = GenericCreatorSettingType.Theme;
export const defaultThemeOption: ThemeOption = ThemeOption.Dark;
export const defaultThemeMode: ThemeMode = DarkMode;
export const themeOptionLocalStorageKey = 'creator-hub-theme-option';
export const themeModeLocalStorageKey = 'creator-hub-theme-mode';
