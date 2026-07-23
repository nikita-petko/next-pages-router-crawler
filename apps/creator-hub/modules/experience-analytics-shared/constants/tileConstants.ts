import type { TTypographyProps } from '@rbx/ui';

export type TTileStyleConfig = {
  maxWidth: number;
  minWidth: number;
  height: number;
  thumbnailHeight: number;
  padding: number;
  titleTypographyVariant: TTypographyProps['variant'];
};

export type TMetricsTileStyleConfig = {
  metricsLayoutSpacing: number;
  metricsTypographyVariant: TTypographyProps['variant'];
  metricsValueTypographyVariant: TTypographyProps['variant'];
} & TTileStyleConfig;

export type TWatchlistTileStyleConfig = {
  showWatchlistRemoveButton: boolean;
} & TMetricsTileStyleConfig;

const largeExperienceTile: TWatchlistTileStyleConfig = {
  maxWidth: 460,
  minWidth: 320,
  height: 560,
  thumbnailHeight: 202,
  padding: 24,
  titleTypographyVariant: 'h5',
  metricsLayoutSpacing: 2,
  metricsTypographyVariant: 'h6',
  metricsValueTypographyVariant: 'h6',
  showWatchlistRemoveButton: true,
};

const smallExperienceTile: TWatchlistTileStyleConfig = {
  maxWidth: 260,
  minWidth: 250,
  height: 480,
  thumbnailHeight: 202,
  padding: 16,
  titleTypographyVariant: 'h6',
  metricsLayoutSpacing: 1,
  metricsTypographyVariant: 'footer',
  metricsValueTypographyVariant: 'footer',
  showWatchlistRemoveButton: false,
};

export const ExperienceTileStyles = {
  large: largeExperienceTile,
  small: smallExperienceTile,
};
