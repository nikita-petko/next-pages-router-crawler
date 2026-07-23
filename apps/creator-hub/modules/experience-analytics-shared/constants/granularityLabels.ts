import { translationKey, type TranslationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RAQIV2MetricGranularity } from '@rbx/creator-hub-analytics-config';
import type { TUIGranularity } from '../utils/seriesGranularities';

const granularityLabels: Record<TUIGranularity, TranslationKey> = {
  [RAQIV2MetricGranularity.OneMonth]: translationKey(
    'Label.Granularity.Monthly',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2MetricGranularity.OneWeek]: translationKey(
    'Label.Granularity.Weekly',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2MetricGranularity.OneDay]: translationKey(
    'Label.Granularity.Daily',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2MetricGranularity.OneHour]: translationKey(
    'Label.Granularity.Hourly',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2MetricGranularity.HalfHour]: translationKey(
    'Label.Granularity.ThirtyMinutely',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2MetricGranularity.OneMinute]: translationKey(
    'Label.Granularity.Minutely',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2MetricGranularity.None]: translationKey(
    'Label.Granularity.Cumulative',
    TranslationNamespace.Analytics,
  ),
};

export default granularityLabels;
