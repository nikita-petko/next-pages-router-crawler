import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { translationKey, TranslationKey } from '@modules/analytics-translations';
import DateRangeType from '../enums/DateRangeType';

const dateRangeStrings: Record<DateRangeType, TranslationKey> = {
  [DateRangeType.Last1Hour]: translationKey('Label.LastOneHour', TranslationNamespace.Analytics),
  [DateRangeType.Last1Day]: translationKey('Label.LastOneDay', TranslationNamespace.Analytics),
  [DateRangeType.Last3Days]: translationKey('Label.LastThreeDays', TranslationNamespace.Analytics),
  [DateRangeType.Last7Days]: translationKey('Label.LastSevenDays', TranslationNamespace.Analytics),
  [DateRangeType.Last28Days]: translationKey(
    'Label.LastTwentyEightDays',
    TranslationNamespace.Analytics,
  ),
  [DateRangeType.Last56Days]: translationKey(
    'Label.LastFiftySixDays',
    TranslationNamespace.Analytics,
  ),
  [DateRangeType.Last90Days]: translationKey(
    'Label.LastNinetyDays',
    TranslationNamespace.Analytics,
  ),
  [DateRangeType.Last365Days]: translationKey('Label.Last365Days', TranslationNamespace.Analytics),
  [DateRangeType.Custom]: translationKey('Label.DateCustom', TranslationNamespace.Analytics),
};

export default dateRangeStrings;
