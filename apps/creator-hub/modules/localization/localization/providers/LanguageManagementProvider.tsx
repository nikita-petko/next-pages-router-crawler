import React, { FunctionComponent, useCallback, useEffect, useState, useMemo } from 'react';
import gameInternationalizationClient, {
  SupportedLanguagesDataResponse,
  TransaltionCountsDataResponse,
} from '@modules/clients/gameInternationalization';
import { useLocalization, useTranslation } from '@rbx/intl';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { manageSupportedLanguageEventModel } from '@modules/eventStream/constants/eventConstants';
import LanguageManagementContext from './LanguageManagementContext';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import { LanguageBriefInfo, LanguageDetailedInfo } from '../types/LanguageInfo';
import { LocaleBriefInfo } from '../types/LocaleInfo';
import useLocaleMap from '../hooks/useLocaleMap';
import { chineseSimplifiedLanguageCode } from '../constants/LocalizationConstants';

const LanguageManagementProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const { trackerClient } = useEventTrackerProvider();
  const { languagesMap } = useLocaleMap();
  const [sourceLanguageCode, setSourceLanguageCode] = useState<string | null>(null);
  const [allLanguagesBriefInfoList, setAllLanguagesBriefInfoList] = useState<LanguageBriefInfo[]>(
    [],
  );
  const [autoTranslationLanguagePool, setAutoTranslationLanguagePool] =
    useState<Set<string> | null>(null);
  const [displayInfoAutoTranslationLanguagePool, setDisplayInfoAutoTranslationLanguagePool] =
    useState<Set<string> | null>(null);
  const [languageWithAutoTranslationOnPool, setLanguageWithAutoTranslationOnPool] =
    useState<Set<string> | null>(null);
  const [translationCountsWithoutSourceList, setTranslationCountsWithoutSourceList] = useState<
    TransaltionCountsDataResponse[] | null
  >(null);
  const [supportedLanguagesWithoutSourceList, setSupportedLanguagesWithoutSourceList] = useState<
    SupportedLanguagesDataResponse[] | null
  >(null);
  // Tracks the source language and its child locales, but the source language code source of truth is the string state
  const [
    sourceLanguageInfoFromSupportedLanguagesDataResponse,
    setSourceLanguageInfoFromSupportedLanguagesDataResponse,
  ] = useState<SupportedLanguagesDataResponse | null>(null);
  const [isAddingLanguage, setIsAddingLanguage] = useState<boolean>(false);
  const [languageCodeToDelete, setLanguageCodeToDelete] = useState<string | null>(null);
  const [isLoadingSourceLanguage, setIsLoadingSourceLanguage] = useState<boolean>(false);
  const [langCodeListInInfoATUpdate, setLangCodeListInInfoATUpdate] = useState<string[]>([]);
  const [langCodeListInATUpdate, setLangCodeListInATUpdate] = useState<string[]>([]);
  const [fetchSourceLanguageError, setFetchSourceLanguageError] = useState<Error | null>(null);
  const [isLoadingSupportedLanguages, setIsLoadingSupportedLanguages] = useState<boolean>(false);
  const [fetchSupportedLanguagesError, setFetchSupportedLanguagesError] = useState<Error | null>(
    null,
  );
  const { locale } = useLocalization();
  const { error } = useMetricsMonitoring();
  const { showFailureToast } = useShowToastMessage();
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();

  const gameId = useMemo(() => {
    return gameDetails?.id;
  }, [gameDetails]);

  const getSourceLanguage = useCallback(async () => {
    if (!gameId) {
      return null;
    }
    try {
      setIsLoadingSourceLanguage(true);
      const response = await gameInternationalizationClient.getSourceLanguage({
        gameId,
      });
      // old experiences have sourceLanguage == null
      if (typeof response.languageCode === 'undefined') {
        setSourceLanguageCode(null);
        return null;
      }
      setSourceLanguageCode(response.languageCode);
      return response.languageCode;
    } catch (e) {
      const catchedError = e as Error;
      if (catchedError.message) {
        error(catchedError.message);
      }
      setFetchSourceLanguageError(catchedError);
      return null;
    } finally {
      setIsLoadingSourceLanguage(false);
    }
  }, [gameId, error]);

  const getAllLanguages = useCallback(async () => {
    const allLanguages: LanguageBriefInfo[] = [];
    languagesMap.forEach((localizedLanguageName, languageCode) => {
      allLanguages.push({
        languageCode,
        name: localizedLanguageName,
      });
    });
    setAllLanguagesBriefInfoList(allLanguages);
  }, [languagesMap]);

  const getEligibleForAutoTranslationLanguages = useCallback(
    async (_sourceLanguageCode: string | null, _gameId: number) => {
      if (_sourceLanguageCode === null) {
        showFailureToast(translate('Message.SetSourceLanguage'));
      } else {
        try {
          const eligibleLanguages = await gameInternationalizationClient.getTargetLanguages({
            languageCode: _sourceLanguageCode,
            gameId: _gameId,
          });
          setAutoTranslationLanguagePool(
            new Set(
              eligibleLanguages?.targetLanguages
                ?.filter((language) => language.isAutomaticTranslationAllowed)
                .map((language) => language.languageCode ?? ''),
            ),
          );
        } catch (e) {
          const catchedError = e as Error;
          error(catchedError.message);
          showFailureToast(translate('Message.AutoTranslationLanguagesError'));
        }
      }
    },
    [error, showFailureToast, translate],
  );

  const getAutoTranslationStatus = useCallback(async () => {
    if (!gameId) {
      return;
    }
    try {
      const autoTranslationStatus = await gameInternationalizationClient.getAutoTranslationStatus({
        gameId,
      });
      setLanguageWithAutoTranslationOnPool(
        new Set(
          autoTranslationStatus?.data
            ?.filter((language) => language.isAutomaticTranslationEnabled)
            .map((language) => language.languageCode ?? ''),
        ),
      );
    } catch (e) {
      const catchedError = e as Error;
      error(catchedError.message);
      showFailureToast(translate('Message.AutoTranslationStatusError'));
    }
  }, [gameId, error, showFailureToast, translate]);

  const getInformationAutoTranslation = useCallback(async () => {
    if (!gameId) {
      return;
    }
    try {
      const autoTranslationStatus =
        await gameInternationalizationClient.getDisplayInfoAutomaticTranslationSettings({
          gameId,
        });
      const result = new Set(
        autoTranslationStatus?.data
          ?.filter((language) => language.isUniverseDisplayInfoAutomaticTranslationEnabled)
          .map((language) => language.languageCode ?? ''),
      );
      setDisplayInfoAutoTranslationLanguagePool(result);
    } catch (e) {
      const catchedError = e as Error;
      error(catchedError.message);
      showFailureToast(translate('Message.AutoTranslationStatusError'));
    }
  }, [gameId, error, showFailureToast, translate]);

  const getTranslationCounts = useCallback(
    async (_sourceLanguageCode: string | null) => {
      if (!gameId) {
        return;
      }
      try {
        const translationCounts = await gameInternationalizationClient.getTranslationCounts({
          gameId,
        });
        setTranslationCountsWithoutSourceList(
          translationCounts?.languagesOrLocales?.filter(
            (language) => language.languageCode !== _sourceLanguageCode,
          ) ?? null,
        );
      } catch (e) {
        const catchedError = e as Error;
        error(catchedError.message);
        showFailureToast(translate('Message.TranslationProgressError'));
      }
    },
    [gameId, error, showFailureToast, translate],
  );

  const getSupportedLanguages = useCallback(
    async (isInitialLoad: boolean, _sourceLanguageCode: string | null) => {
      if (!gameId) {
        return;
      }
      try {
        if (isInitialLoad) {
          setIsLoadingSupportedLanguages(true);
        }
        const supportedLanguages = await gameInternationalizationClient.getSupportedLanguages({
          gameId,
        });
        setSupportedLanguagesWithoutSourceList(
          supportedLanguages?.data?.filter(
            (language) => language.languageFamily?.languageCode !== _sourceLanguageCode,
          ) ?? null,
        );
        setSourceLanguageInfoFromSupportedLanguagesDataResponse(
          supportedLanguages?.data?.find(
            (language) => language.languageFamily?.languageCode === _sourceLanguageCode,
          ) ?? null,
        );
      } catch (e) {
        const catchedError = e as Error;
        error(catchedError.message);
        setFetchSupportedLanguagesError(catchedError);
      } finally {
        setIsLoadingSupportedLanguages(false);
      }
    },
    [gameId, error],
  );

  const fetchResource = useCallback(
    async (_sourceLanguageCode: string, _gameId: number) => {
      await getSupportedLanguages(true, _sourceLanguageCode);
      await getAllLanguages();
      await getEligibleForAutoTranslationLanguages(_sourceLanguageCode, _gameId);
      await getTranslationCounts(_sourceLanguageCode);
      await getAutoTranslationStatus();
      await getInformationAutoTranslation();
    },
    [
      getSupportedLanguages,
      getAllLanguages,
      getEligibleForAutoTranslationLanguages,
      getTranslationCounts,
      getAutoTranslationStatus,
      getInformationAutoTranslation,
    ],
  );

  useEffect(() => {
    if (!gameId) {
      return;
    }

    if (!sourceLanguageCode) {
      getSourceLanguage();
    } else {
      fetchResource(sourceLanguageCode, gameId);
    }
  }, [fetchResource, gameId, getSourceLanguage, sourceLanguageCode]);

  const eligibleLanguagesBriefInfoList = useMemo(() => {
    const briefInfoList: LanguageBriefInfo[] = [];
    allLanguagesBriefInfoList?.forEach((language) => {
      if (autoTranslationLanguagePool?.has(language.languageCode)) {
        briefInfoList.push(language);
      }
    });
    return briefInfoList;
  }, [allLanguagesBriefInfoList, autoTranslationLanguagePool]);

  const isLanguageCodeValid = useCallback(
    (languageCode: string) => {
      return languagesMap.get(languageCode) !== undefined;
    },
    [languagesMap],
  );

  const translationProgressList = useMemo(() => {
    const translationProgress = translationCountsWithoutSourceList?.map((language) => {
      const totalCount = language.categories?.[0].totalTranslatableItemCount ?? 0;
      const translatedEntryCount = language.categories?.[0].translationCounts?.[0].count;
      if (totalCount === 0) {
        return 0;
      }
      return Math.round(((translatedEntryCount ?? 0) / totalCount) * 100);
    });
    return translationProgress;
  }, [translationCountsWithoutSourceList]);

  const supportedLanguagesBriefInfoList = useMemo(() => {
    const briefInfoList: LanguageBriefInfo[] = [];
    supportedLanguagesWithoutSourceList?.forEach((language) => {
      briefInfoList.push({
        languageCode: language.languageFamily?.languageCode ?? '',
        name: language.languageFamily?.name ?? '',
      });
    });
    return briefInfoList;
  }, [supportedLanguagesWithoutSourceList]);

  const supportedLocalesBriefInfoList = useMemo(() => {
    const briefLocaleInfoList: LocaleBriefInfo[] = [];
    supportedLanguagesWithoutSourceList?.forEach((languageWithLocales) => {
      if (
        languageWithLocales.childLocales &&
        languageWithLocales.childLocales.length > 1 &&
        languageWithLocales.languageFamily?.languageCode !== chineseSimplifiedLanguageCode
      )
        languageWithLocales?.childLocales?.forEach((childLocale) => {
          briefLocaleInfoList.push({
            localeCode: childLocale.localeCode ?? '',
            languageCode: languageWithLocales.languageFamily?.languageCode ?? '',
            name: childLocale.name ?? '',
          });
        });
    });

    if (
      sourceLanguageInfoFromSupportedLanguagesDataResponse?.childLocales &&
      sourceLanguageInfoFromSupportedLanguagesDataResponse?.childLocales.length > 1 &&
      sourceLanguageInfoFromSupportedLanguagesDataResponse.languageFamily?.languageCode !==
        chineseSimplifiedLanguageCode
    ) {
      sourceLanguageInfoFromSupportedLanguagesDataResponse?.childLocales?.forEach((childLocale) => {
        briefLocaleInfoList.push({
          localeCode: childLocale.localeCode ?? '',
          languageCode:
            sourceLanguageInfoFromSupportedLanguagesDataResponse?.languageFamily?.languageCode ??
            '',
          name: childLocale.name ?? '',
        });
      });
    }

    return briefLocaleInfoList;
  }, [supportedLanguagesWithoutSourceList, sourceLanguageInfoFromSupportedLanguagesDataResponse]);

  const supportedLanguagesDetailedInfoList = useMemo(() => {
    if (supportedLanguagesWithoutSourceList === null) {
      return null;
    }
    const detailedInfoList: LanguageDetailedInfo[] = [];
    if (isAddingLanguage) {
      detailedInfoList.push({
        isAdding: true,
        languageCode: '',
        languageName: '',
        defaultLocalizationTargetCode: '',
        isAutoTranslationAvailable: false,
        isAutoTranslationOn: false,
        isInfoAutoTranslationOn: false,
        translationProgress: 0,
      });
    }
    supportedLanguagesWithoutSourceList?.forEach((language, index) => {
      const languageCode = language.languageFamily?.languageCode;
      detailedInfoList.push({
        isDeleting: languageCode === languageCodeToDelete,
        // returns the localized language name,
        // else return its unlocalized name or an empty string in the worst case
        languageName: languagesMap.get(languageCode ?? '') ?? language.languageFamily?.name ?? '',
        languageCode: languageCode ?? '',
        defaultLocalizationTargetCode:
          language.childLocales?.length !== 0 ? (language.childLocales?.[0]?.localeCode ?? '') : '',
        isAutoTranslationAvailable: !!autoTranslationLanguagePool?.has(languageCode ?? ''),
        isAutoTranslationOn: !!languageWithAutoTranslationOnPool?.has(languageCode ?? ''),
        isInfoAutoTranslationOn: !!displayInfoAutoTranslationLanguagePool?.has(languageCode ?? ''),
        translationProgress: translationProgressList?.[index] ?? 0,
      });
    });
    detailedInfoList.sort((a, b) =>
      a.languageName.localeCompare(b.languageName, locale?.toString()),
    );
    return detailedInfoList;
  }, [
    locale,
    languagesMap,
    supportedLanguagesWithoutSourceList,
    translationProgressList,
    autoTranslationLanguagePool,
    languageWithAutoTranslationOnPool,
    displayInfoAutoTranslationLanguagePool,
    isAddingLanguage,
    languageCodeToDelete,
  ]);

  const handleSwitchAutoTranslation = useCallback(
    async (languageCode: string, autoTranslationEnabled: boolean) => {
      if (!gameId) {
        return;
      }
      setLangCodeListInATUpdate((prev) => [...prev, languageCode]);
      try {
        const response = await gameInternationalizationClient.patchAutoTranslationStatus({
          gameId,
          languageCode,
          enableAutomaticTranslation: autoTranslationEnabled,
        });
        if (response) {
          let updatedLanguagesWithATOn: Set<string> | null = null;
          if (response.isAutomaticTranslationEnabled) {
            setLanguageWithAutoTranslationOnPool((prev) => {
              if (prev === null) {
                updatedLanguagesWithATOn = new Set(languageCode);
              } else {
                updatedLanguagesWithATOn = new Set(prev).add(languageCode);
              }
              return updatedLanguagesWithATOn;
            });
          } else if (response.isAutomaticTranslationEnabled === false) {
            setLanguageWithAutoTranslationOnPool((prev) => {
              if (prev !== null) {
                updatedLanguagesWithATOn = new Set(prev);
                updatedLanguagesWithATOn.delete(languageCode);
              }
              return updatedLanguagesWithATOn;
            });
          }
          setLangCodeListInATUpdate((prev) => prev.filter((lang) => lang !== languageCode));
        }
      } catch (e) {
        const catchedError = e as Error;
        error(catchedError.message);
        showFailureToast(translate('Message.AutoTranslationStatusError'));
      }
    },
    [gameId, error, showFailureToast, translate],
  );

  const handleSwitchInformationAutoTranslation = useCallback(
    async (languageCode: string, enabled: boolean) => {
      if (gameId) {
        setLangCodeListInInfoATUpdate((prev) => [...prev, languageCode]);
        try {
          const response =
            await gameInternationalizationClient.patchDisplayInfoAutomaticTranslationSettings({
              gameId,
              languageCode,
              enableUniverseDisplayInfoAutomaticTranslation: enabled,
            });
          if (response) {
            let updatedLanguagesWithATInfoOn: Set<string> | null = null;
            if (response.isUniverseDisplayInfoAutomaticTranslationEnabled) {
              setDisplayInfoAutoTranslationLanguagePool((prev) => {
                if (prev === null) {
                  updatedLanguagesWithATInfoOn = new Set(languageCode);
                } else {
                  updatedLanguagesWithATInfoOn = new Set(prev).add(languageCode);
                }
                return updatedLanguagesWithATInfoOn;
              });
            } else if (response.isUniverseDisplayInfoAutomaticTranslationEnabled === false) {
              setDisplayInfoAutoTranslationLanguagePool((prev) => {
                if (prev !== null) {
                  updatedLanguagesWithATInfoOn = new Set(prev);
                  updatedLanguagesWithATInfoOn.delete(languageCode);
                }
                return updatedLanguagesWithATInfoOn;
              });
            }
            setLangCodeListInInfoATUpdate((prev) => prev.filter((lang) => lang !== languageCode));
          }
        } catch (e) {
          const catchedError = e as Error;
          error(catchedError.message);
          showFailureToast(translate('Message.AutoTranslationStatusError'));
        }
      }
    },
    [gameId, error, showFailureToast, translate],
  );

  const handleDeleteLanguage = useCallback(
    async (languageCode: string) => {
      if (!gameId) {
        return;
      }
      setLanguageCodeToDelete(languageCode);
      await gameInternationalizationClient.patchSupportedLanguage({
        gameId,
        languages: [
          {
            languageCode,
            _delete: true,
          },
        ],
      });
      trackerClient.sendEvent(
        manageSupportedLanguageEventModel(
          [languageCode],
          gameId,
          CreatorDashboardUserResponse.Confirm,
          false,
        ),
      );
      await getSupportedLanguages(false, sourceLanguageCode);
      setLanguageCodeToDelete(null);
      await getTranslationCounts(sourceLanguageCode);
    },
    [gameId, sourceLanguageCode, getSupportedLanguages, getTranslationCounts, trackerClient],
  );

  const handleAddLanguage = useCallback(
    async (languageCodes: string[]) => {
      if (!gameId) {
        return;
      }
      setIsAddingLanguage(true);
      const languages = languageCodes.map((languageCode) => {
        return { languageCode };
      });
      await gameInternationalizationClient.patchSupportedLanguage({
        gameId,
        languages,
      });
      trackerClient.sendEvent(
        manageSupportedLanguageEventModel(
          languageCodes,
          gameId,
          CreatorDashboardUserResponse.Confirm,
          true,
        ),
      );
      await getSupportedLanguages(false, sourceLanguageCode);
      setIsAddingLanguage(false);
      await Promise.all([
        getTranslationCounts(sourceLanguageCode),
        getAutoTranslationStatus(),
        getInformationAutoTranslation(),
      ]);
    },
    [
      gameId,
      sourceLanguageCode,
      getSupportedLanguages,
      getTranslationCounts,
      getAutoTranslationStatus,
      getInformationAutoTranslation,
      trackerClient,
    ],
  );

  const handleChangeSourceLanguage = useCallback(
    async (languageCode: string): Promise<void> => {
      if (!gameId) {
        return;
      }
      try {
        setIsLoadingSourceLanguage(true);
        await gameInternationalizationClient.patchSourceLanguage({
          gameId,
          languageCode,
        });
        setSourceLanguageCode(languageCode);
        fetchResource(languageCode, gameId);
      } catch (e) {
        const catchedError = e as Error;
        if (catchedError.message) {
          error(catchedError.message);
        }
        setFetchSourceLanguageError(catchedError);
      } finally {
        setIsLoadingSourceLanguage(false);
      }
    },
    [gameId, fetchResource, error],
  );

  const providerValue = useMemo(() => {
    return {
      allLanguagesBriefInfoList,
      supportedLanguagesBriefInfoList,
      supportedLocalesBriefInfoList,
      eligibleLanguagesBriefInfoList,
      supportedLanguagesDetailedInfoList,
      sourceLanguageCode,
      isLanguageCodeValid,
      handleAddLanguage,
      handleSwitchAutoTranslation,
      handleSwitchInformationAutoTranslation,
      handleDeleteLanguage,
      handleChangeSourceLanguage,
      fetchSupportedLanguagesError,
      isLoadingSourceLanguage,
      isLoadingSupportedLanguages,
      fetchSourceLanguageError,
      langCodeListInInfoATUpdate,
      langCodeListInATUpdate,
    };
  }, [
    allLanguagesBriefInfoList,
    eligibleLanguagesBriefInfoList,
    fetchSourceLanguageError,
    fetchSupportedLanguagesError,
    handleAddLanguage,
    handleChangeSourceLanguage,
    handleDeleteLanguage,
    handleSwitchAutoTranslation,
    handleSwitchInformationAutoTranslation,
    isLanguageCodeValid,
    isLoadingSourceLanguage,
    isLoadingSupportedLanguages,
    langCodeListInATUpdate,
    langCodeListInInfoATUpdate,
    sourceLanguageCode,
    supportedLanguagesBriefInfoList,
    supportedLanguagesDetailedInfoList,
    supportedLocalesBriefInfoList,
  ]);

  return (
    <LanguageManagementContext.Provider value={providerValue}>
      {children}
    </LanguageManagementContext.Provider>
  );
};

export default LanguageManagementProvider;
