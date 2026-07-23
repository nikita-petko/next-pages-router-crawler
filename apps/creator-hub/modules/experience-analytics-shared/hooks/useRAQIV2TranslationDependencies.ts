import { useTranslationWrapper } from '@modules/analytics-translations';
import { useLocale } from '@modules/charts-generic';
import { useTranslation } from '@rbx/intl';
import { useMemo } from 'react';
import { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';
import { useCountryMapFromContext } from '../context/CountryMapProvider';
import { useLocaleMapFromContext } from '../context/LocaleMapProvider';
import { useThumbnailUrlsMapFromContext } from '../context/ThumbnailUrlsMapProvider';
import { useUniverseNameMapFromContext } from '../context/UniverseNameMapProvider';
import { useAvatarItemNamesMapFromContext } from '../context/AvatarItemNamesMapProvider';

const useRAQIV2TranslationDependencies = (): RAQIV2TranslationDependencies => {
  const { ready, translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { countryNamesMap } = useCountryMapFromContext();
  const { localesMap } = useLocaleMapFromContext();
  const { thumbnailUrlsMap } = useThumbnailUrlsMapFromContext();
  const { universeNamesMap } = useUniverseNameMapFromContext();
  const { avatarItemNamesMap } = useAvatarItemNamesMapFromContext();
  const locale = useLocale();

  return useMemo(() => {
    return {
      translate,
      translateHTML,
      countryNamesMap,
      localesMap,
      thumbnailUrlsMap,
      universeNamesMap,
      avatarItemNamesMap,
      ready,
      locale,
    };
  }, [
    ready,
    translate,
    translateHTML,
    countryNamesMap,
    localesMap,
    thumbnailUrlsMap,
    universeNamesMap,
    avatarItemNamesMap,
    locale,
  ]);
};

export default useRAQIV2TranslationDependencies;
