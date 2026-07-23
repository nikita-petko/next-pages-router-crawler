import { isValidArrayEnumValue } from '@modules/miscellaneous/utils/enumUtils';

/** Explore Mode chart configurator smoothing radio values. */
export const ChartConfiguratorSmoothingOptions = ['none', 'l7-moving-average'] as const;

export type SmoothingOption = (typeof ChartConfiguratorSmoothingOptions)[number];

export const SmoothingOptionValue = {
  None: 'none',
  L7MovingAverage: 'l7-moving-average',
} as const satisfies Record<string, SmoothingOption>;

export const isSmoothingOption = (value: string): value is SmoothingOption =>
  isValidArrayEnumValue(ChartConfiguratorSmoothingOptions, value);
