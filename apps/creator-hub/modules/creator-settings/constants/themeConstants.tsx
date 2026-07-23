import React from 'react';
import {
  DarkModeOutlinedIcon,
  DevicesOutlinedIcon,
  LightModeOutlinedIcon,
  ManageAccountsOutlinedIcon,
} from '@rbx/ui';

export enum ThemeOption {
  Dark = 'Dark',
  Light = 'Light',
  SyncWWW = 'SyncWWW',
  SyncDevice = 'SyncDevice',
}

export type TThemeOption = {
  id: string;
  theme: ThemeOption;
  nameTranslationKey: string;
  descriptionTranslationKey?: string;
  icon: React.ReactNode;
};

// TODO(@christinewang, CRF-3749): swap icons for ones from design
export const themeOptions: TThemeOption[] = [
  {
    id: '1',
    theme: ThemeOption.Dark,
    nameTranslationKey: 'Label.Dark',
    icon: <DarkModeOutlinedIcon />,
  },
  {
    id: '2',
    theme: ThemeOption.Light,
    nameTranslationKey: 'Label.Light',
    icon: <LightModeOutlinedIcon />,
  },
  {
    id: '3',
    theme: ThemeOption.SyncWWW,
    nameTranslationKey: 'Label.SyncWWW',
    descriptionTranslationKey: 'Description.SyncWWW',
    icon: <ManageAccountsOutlinedIcon />,
  },
  {
    id: '4',
    theme: ThemeOption.SyncDevice,
    nameTranslationKey: 'Label.SyncDevice',
    descriptionTranslationKey: 'Description.SyncDevice',
    icon: <DevicesOutlinedIcon />,
  },
];
