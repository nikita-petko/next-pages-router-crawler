import { skipToken, useQuery } from '@tanstack/react-query';
import gameInternationalizationClient from '@modules/clients/gameInternationalization';
import localeClient from '@modules/clients/locale';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import { imageTranslationFeatureName } from '../constants';

/**
 * Resolves whether the active language can use the image-translation feature. Two independent
 * signals, both keyed by language code (mirrors `LanguageManagementProvider`, which lives only under
 * the Localization index route and is therefore unavailable in the translation workspace):
 *  - supported: the language is in the `image-translation` feature's supported-locale allowlist.
 *  - enabled: automatic image translation is turned on for the language for this game.
 * Results are cached/deduped by react-query so tab/language switches don't refetch.
 */
const AVAILABILITY_STALE_TIME = 5 * 60 * 1000;

export interface ImageTranslationAvailability {
  isSupported: boolean;
  isEnabled: boolean;
  isLoading: boolean;
  isError: boolean;
}

const isNonEmptyString = (value: string | undefined | null): value is string =>
  value != null && value !== '';

async function fetchSupportedLanguageCodes(): Promise<Set<string>> {
  const response = await localeClient.getSupportedLocalesForFeature({
    featureName: imageTranslationFeatureName,
  });
  return new Set(
    response?.supportedLocales
      ?.map((supportedLocale) => supportedLocale.language?.languageCode)
      .filter(isNonEmptyString),
  );
}

async function fetchImageEnabledLanguageCodes(gameId: number): Promise<Set<string>> {
  const response = await gameInternationalizationClient.getAutoTranslationStatus({ gameId });
  return new Set(
    response?.data
      ?.filter((language) => language.isImageTranslationEnabled)
      .map((language) => language.languageCode)
      .filter(isNonEmptyString),
  );
}

export default function useImageTranslationAvailability(): ImageTranslationAvailability {
  const { gameId, activeTranslationTarget } = useEntryManagementMetadata();
  const languageCode = activeTranslationTarget?.languageCode ?? null;

  const supportedQuery = useQuery({
    queryKey: ['gameImageTranslation', 'supportedLanguageCodes'],
    queryFn: fetchSupportedLanguageCodes,
    staleTime: AVAILABILITY_STALE_TIME,
    refetchOnWindowFocus: false,
  });

  const enabledQuery = useQuery({
    queryKey: ['gameImageTranslation', 'imageEnabledLanguageCodes', gameId],
    queryFn: gameId != null ? () => fetchImageEnabledLanguageCodes(gameId) : skipToken,
    // No staleTime: the creator can toggle image translation on the Localization page (via the
    // "Go to Languages" CTA), which doesn't invalidate this query. Refetching on every mount keeps
    // the enabled set fresh when they return to the Images tab.
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const isLoading = supportedQuery.isLoading || enabledQuery.isLoading;
  const isError = supportedQuery.isError || enabledQuery.isError;
  const isSupported = languageCode != null && (supportedQuery.data?.has(languageCode) ?? false);
  const isEnabled = languageCode != null && (enabledQuery.data?.has(languageCode) ?? false);

  return { isSupported, isEnabled, isLoading, isError };
}
