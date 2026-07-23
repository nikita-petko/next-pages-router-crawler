import { TranslationKey, translationKey } from '@modules/analytics-translations';
import { RAQIV2ReservedDimensionValues } from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const RAQIV2ReservedDimensionValuesTranslationKeys: Record<
  RAQIV2ReservedDimensionValues,
  TranslationKey
> = {
  [RAQIV2ReservedDimensionValues.Unknown]: translationKey(
    'Label.Unknown',
    TranslationNamespace.Analytics,
  ),
  [RAQIV2ReservedDimensionValues.NoValue]: translationKey(
    'Label.NoValue',
    TranslationNamespace.Analytics,
  ),
};

export default RAQIV2ReservedDimensionValuesTranslationKeys;
