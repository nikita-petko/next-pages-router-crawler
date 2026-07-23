import type { SeriesDataTypes } from '@rbx/analytics-ui';
import type { FormattedText, TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { DataPoint, GenericSeriesInfo } from './SeriesTypes';
import type { TimeSeriesChartUnitSpec } from './TimeSeriesTypes';

export enum DurationBucketType {
  SecondsSinceStart = 'SecondsSinceStart',
  ServerMemoryAge = 'ServerMemoryAge',
  CohortDay = 'CohortDay',
}

export type DurationBucket = number & { _: DurationBucket };
export type DurationSeriesDataPoint = DataPoint<DurationBucket, number>;
export type DurationSplineChartSeries = Array<{
  name: FormattedText;
  dataPoints: Array<DurationSeriesDataPoint>;
  type: SeriesDataTypes;
}>;
export type DurationSplineChartSpec = {
  unit: TimeSeriesChartUnitSpec;
  series: DurationSplineChartSeries;
  bucketType: DurationBucketType;
};

export const DurationBucketTypeToTranslationKey: Record<DurationBucketType, TranslationKey> = {
  [DurationBucketType.SecondsSinceStart]: translationKey(
    'Label.SecondsSinceStart',
    TranslationNamespace.Analytics,
  ),
  [DurationBucketType.ServerMemoryAge]: translationKey(
    'Label.ServerMemoryAge',
    TranslationNamespace.Analytics,
  ),
  [DurationBucketType.CohortDay]: translationKey('Label.CohortDay', TranslationNamespace.Analytics),
};

export type DurationSeriesInfo = GenericSeriesInfo<DurationBucket, number>;
