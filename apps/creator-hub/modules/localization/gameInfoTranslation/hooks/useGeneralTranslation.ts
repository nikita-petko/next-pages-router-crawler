import {
  GameIconRequest,
  GameIconResponse,
  GameNameAndDescriptionData,
  GameNameAndDescriptionRequest,
  GameNameAndDescriptionResponse,
  GameThumbnailsRequest,
  GameThumbnailsResponse,
} from '@modules/clients';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';

const useGeneralTranslation = (
  getGameInfoTranslation: (
    request: GameNameAndDescriptionRequest | GameIconRequest | GameThumbnailsRequest,
  ) =>
    | Promise<GameNameAndDescriptionResponse>
    | Promise<GameIconResponse>
    | Promise<GameThumbnailsResponse>,
) => {
  const { gameId, currentLanguageOrLocaleCode, activeTranslationTarget, sourceLanguageCode } =
    useEntryManagementMetadata();
  const { error } = useMetricsMonitoring();
  const [translationResponse, setTranslationResponse] = useState<
    GameNameAndDescriptionResponse | GameIconResponse | GameThumbnailsResponse | null
  >(null);
  const [isTranslationLoading, setIsTranslationLoading] = useState<boolean>(false);
  const [fetchDataError, setFetchDataError] = useState<Error | null>(null);

  const getTranslation = useCallback(async () => {
    try {
      if (!gameId) {
        throw new Error('Game Id is null');
      }
      setIsTranslationLoading(true);
      const response = await getGameInfoTranslation({ gameId });
      setTranslationResponse(response);
    } catch (e) {
      if (e instanceof Error) {
        error(e.message);
        setFetchDataError(e);
      }
    } finally {
      setIsTranslationLoading(false);
    }
  }, [gameId, getGameInfoTranslation, error]);

  const getTranslationFromResponse = useCallback(
    (
      response: GameNameAndDescriptionResponse | GameIconResponse | GameThumbnailsResponse,
      languageCode: string | null,
    ) => {
      const translationIndex = response.data?.findIndex(
        (innerTranslation) => innerTranslation.languageCode === languageCode,
      );
      if (typeof translationIndex !== 'undefined' && translationIndex !== -1 && response.data) {
        return response.data[translationIndex];
      }
      return null;
    },
    [],
  );

  const translation = useMemo(() => {
    if (translationResponse) {
      return getTranslationFromResponse(translationResponse, currentLanguageOrLocaleCode);
    }
    return undefined;
  }, [translationResponse, getTranslationFromResponse, currentLanguageOrLocaleCode]);

  const sourceText = useMemo(() => {
    if (translationResponse) {
      return getTranslationFromResponse(
        translationResponse,
        sourceLanguageCode,
      ) as GameNameAndDescriptionData;
    }
    return null;
  }, [translationResponse, getTranslationFromResponse, sourceLanguageCode]);

  // Global translation represents the translation for the global locale if a language contains different locales,
  // otherwise it represents the translation for the language
  const globalTranslation = useMemo(() => {
    if (translationResponse) {
      return getTranslationFromResponse(
        translationResponse,
        activeTranslationTarget?.languageCode ?? null,
      ) as GameNameAndDescriptionData;
    }
    return null;
  }, [translationResponse, getTranslationFromResponse, activeTranslationTarget?.languageCode]);

  useEffect(() => {
    if (gameId) {
      getTranslation();
    }
  }, [gameId, getTranslation]);

  return {
    isTranslationLoading,
    translation,
    sourceText,
    globalTranslation,
    fetchDataError,
    getTranslation,
  };
};

export default useGeneralTranslation;
