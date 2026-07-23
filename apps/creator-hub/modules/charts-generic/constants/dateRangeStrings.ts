import { RAQIV2DateRangeType } from '@rbx/creator-hub-analytics-config';
import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const dateRangeStrings: Record<RAQIV2DateRangeType, TranslationKey> = {
  [RAQIV2DateRangeType.Last1Hour]: translationKey(
    'Label.LastOneHour',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2DateRangeType.Last1Day]: translationKey(
    'Label.LastOneDay',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2DateRangeType.Last3Days]: translationKey(
    'Label.LastThreeDays',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2DateRangeType.Last7Days]: translationKey(
    'Label.LastSevenDays',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2DateRangeType.Last28Days]: translationKey(
    'Label.LastTwentyEightDays',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2DateRangeType.Last56Days]: translationKey(
    'Label.LastFiftySixDays',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2DateRangeType.Last90Days]: translationKey(
    'Label.LastNinetyDays',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2DateRangeType.Last365Days]: translationKey(
    'Label.Last365Days',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2DateRangeType.Custom]: translationKey('Label.DateCustom', TranslationNamespace.Analytics),
};

export default dateRangeStrings;
