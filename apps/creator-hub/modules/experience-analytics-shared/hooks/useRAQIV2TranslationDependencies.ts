import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import useLocale from '@modules/charts-generic/context/useLocale';
import { useAvatarItemNamesMapFromContext } from '../context/AvatarItemNamesMapProvider';
import { useCountryMapFromContext } from '../context/CountryMapProvider';
import { useLocaleMapFromContext } from '../context/LocaleMapProvider';
import { useThumbnailUrlsMapFromContext } from '../context/ThumbnailUrlsMapProvider';
import { useUniverseNameMapFromContext } from '../context/UniverseNameMapProvider';
import type { RAQIV2TranslationDependencies } from '../types/RAQIV2DimensionRenderer';

const useRAQIV2TranslationDependencies = (): RAQIV2TranslationDependencies => {
  const { ready, translate, translateHTML, tPendingTranslation, tPendingHtmlTranslation } =
    useTranslationWrapper(useTranslation());
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
      tPendingTranslation,
      tPendingHtmlTranslation,
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
    tPendingTranslation,
    tPendingHtmlTranslation,
    countryNamesMap,
    localesMap,
    thumbnailUrlsMap,
    universeNamesMap,
    avatarItemNamesMap,
    locale,
  ]);
};

export default useRAQIV2TranslationDependencies;
