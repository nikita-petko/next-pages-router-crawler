import type { TranslationKey } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import SingleDateType from '../enums/SingleDateType';

const singleDateStrings: Record<SingleDateType, TranslationKey> = {
  [SingleDateType.MostRecent]: translationKey('Label.MostRecent', TranslationNamespace.Analytics),
  [SingleDateType.SevenDaysAgo]: translationKey(
    'Label.SevenDaysAgo',
    TranslationNamespace.Analytics,
  ),
  [SingleDateType.ThirtyDaysAgo]: translationKey(
    'Label.ThirtyDaysAgo',
    TranslationNamespace.Analytics,
  ),
  [SingleDateType.SixtyDaysAgo]: translationKey(
    'Label.SixtyDaysAgo',
    TranslationNamespace.Analytics,
  ),
  [SingleDateType.NinetyDaysAgo]: translationKey(
    'Label.NinetyDaysAgo',
    TranslationNamespace.Analytics,
  ),
  [SingleDateType.ThreeSixtyFiveDaysAgo]: translationKey(
    'Label.ThreeSixtyFiveDaysAgo',
    TranslationNamespace.Analytics,
  ),
  [SingleDateType.Custom]: translationKey('Label.DateCustom', TranslationNamespace.Analytics),
};

export default singleDateStrings;
