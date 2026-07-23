import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { FormattedText, translationKey, TranslationKey } from '@modules/analytics-translations';
import { SeriesDataTypes } from '@rbx/analytics-ui';
import { DataPoint, GenericSeriesInfo } from './SeriesTypes';
import { TimeSeriesChartUnitSpec } from './TimeSeriesTypes';

export enum DurationBucketType {
  SecondsSinceStart = 'SecondsSinceStart',
  ServerMemoryAge = 'ServerMemoryAge',
  CohortDay = 'CohortDay',
}

export type DurationBucket = number & { _: DurationBucket };
export type DurationSeriesDataPoint = DataPoint<DurationBucket, number>;
export type DurationSplineChartSpec = {
  unit: TimeSeriesChartUnitSpec;
  series: Array<{
    name: FormattedText;
    dataPoints: Array<DurationSeriesDataPoint>;
    type: SeriesDataTypes;
  }>;
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
