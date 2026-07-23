import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';

export const breakdownDimensionsWithOtherSeries = [RAQIV2Dimension.ThumbnailAsset] as const;

export type BreakdownDimensionWithOtherSeries = (typeof breakdownDimensionsWithOtherSeries)[number];
