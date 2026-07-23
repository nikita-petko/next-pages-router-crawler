import { RAQIV2Platform, RAQIV2OperatingSystem } from '@rbx/creator-hub-analytics-config';

export enum PlayerFeedbackFilterDimension {
  OperatingSystem = 'OperatingSystem',
  DeviceType = 'DeviceType',
}

export interface PlayerFeedbackFilterValue {
  dimension: PlayerFeedbackFilterDimension;
  values: string[];
}

export interface PlayerFeedbackFilterState {
  [PlayerFeedbackFilterDimension.OperatingSystem]: string[];
  [PlayerFeedbackFilterDimension.DeviceType]: string[];
}

export interface PlayerFeedbackFilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface PlayerFeedbackFilterConfig {
  dimension: PlayerFeedbackFilterDimension;
  label: string;
  options: PlayerFeedbackFilterOption[];
  multiple: boolean;
  type: 'enum' | 'boolean' | 'rating';
}

export const PLAYER_FEEDBACK_FILTER_CONFIGS: PlayerFeedbackFilterConfig[] = [
  {
    dimension: PlayerFeedbackFilterDimension.OperatingSystem,
    label: 'Label.OperatingSystem',
    options: Object.values(RAQIV2OperatingSystem).map((os) => ({
      value: os,
      label: os,
    })),
    multiple: true,
    type: 'enum',
  },
  {
    dimension: PlayerFeedbackFilterDimension.DeviceType,
    label: 'Label.DeviceType',
    options: Object.values(RAQIV2Platform).map((platform) => ({
      value: platform,
      label: platform,
    })),
    multiple: true,
    type: 'enum',
  },
];

export const DEFAULT_FILTER_STATE: PlayerFeedbackFilterState = {
  [PlayerFeedbackFilterDimension.OperatingSystem]: [],
  [PlayerFeedbackFilterDimension.DeviceType]: [],
};
