import React, { FunctionComponent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSettings } from '@modules/settings';
import translationRoleClient, { UserRoleType } from '@modules/clients/translationRoles';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { gameInternationalizationClient } from '@modules/clients';
import { useRouter } from 'next/router';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useLocalization } from '@rbx/intl';
import useLocalizationToasts from '../../common/hooks/useLocalizationToasts';
import {
  parseSupportedLanguageList,
  parseTranslationLanguage,
  parseTranslationTargets,
} from '../implementations/translationLanguageHelpers';
import { TranslationLanguage } from '../types/TranslationLanguage';
import TranslationLogicContext from './TranslationLogicContext';
import { localizationTranslationPath } from '../constants';
import TranslationTarget from '../types/TranslationTarget';

const TranslationLogicProvider: FunctionComponent<React.PropsWithChildren<unknown>> = ({
  children,
}) => {
  const { error } = useMetricsMonitoring();
  const { locale } = useLocalization();
  const { settings, isFetched } = useSettings();
  const [roleLoading, setRoleLoading] = useState<boolean>(false);
  const [supportedLanguageLoading, setSupportedLanguageLoading] = useState<boolean>(false);
  const [sourceTranslationLanguage, setSourceTranslationLanguage] =
    useState<TranslationLanguage | null>(null);
  const [defaultSourceLocaleCode, setDefaultSourceLocaleCode] = useState<string | null>(null);
  const [sourceLanguageCode, setSourceLanguageCode] = useState<string | null>(null);
  const [sourceLanguageCodeLoading, setSourceLanguageCodeLoading] = useState<boolean>(false);
  const [userRoles, setUserRoles] = useState<Array<UserRoleType>>([]);
  const [supportedLanguages, setSupportedLanguages] = useState<Array<TranslationLanguage>>([]);
  const [translationKeyMap, setTranslationKeyMap] = useState<Map<string, TranslationTarget> | null>(
    null,
  );
  const { gameDetails } = useCurrentGame();
  const { showToastNetworkError, showToastUnknownError } = useLocalizationToasts();
  const router = useRouter();
  const { activeTranslationKey } = router.query;

  const getUserRoles = useCallback(
    (gameId: number) => {
      setRoleLoading(true);
      translationRoleClient
        .getCurrentRole(gameId)
        .then((response) => {
          setUserRoles(response.userRoles);
        })
        .catch((e: Response) => {
          error(`Error in getUserRoles: ${e.statusText}`);
          showToastNetworkError(e.status);
        })
        .finally(() => {
          setRoleLoading(false);
        });
    },
    [error, showToastNetworkError],
  );

  const fetchSupportedLanguages = useCallback(
    (gameId: number) => {
      setSupportedLanguageLoading(true);
      gameInternationalizationClient
        .getSupportedLanguages({ gameId })
        .then((response) => {
          if (response.data) {
            try {
              const { languageList, translationTargetMap } = parseSupportedLanguageList(
                settings?.enableChildLocaleSupport,
                response.data,
              );
              setSupportedLanguages(languageList);
              setTranslationKeyMap(translationTargetMap);
            } catch (e) {
              const catchedError = e as Error;
              error(catchedError.message);
              showToastUnknownError(catchedError.message);
            }
          } else {
            showToastUnknownError('getSupportedLanguages get empty response');
          }
        })
        .catch((e) => showToastNetworkError(e.status))
        .finally(() => setSupportedLanguageLoading(false));
    },
    [error, settings?.enableChildLocaleSupport, showToastNetworkError, showToastUnknownError],
  );
  const setActiveTranslationTarget = useCallback(
    async (newTarget: TranslationTarget) => {
      await router.replace(
        {
          pathname: localizationTranslationPath,
          query: {
            ...router.query,
            activeTranslationKey: newTarget.translationKey,
          },
        },
        undefined,
        { shallow: true },
      );
    },
    [router],
  );

  const getSourceLanguage = useCallback(
    async (_gameId: number) => {
      setSourceLanguageCodeLoading(true);
      try {
        const sourceLanguageResponse =
          await gameInternationalizationClient.getSourceLanguageWithLocales({
            gameId: _gameId,
          });
        if (sourceLanguageResponse.languageFamily !== undefined) {
          const { languageCode, name } = sourceLanguageResponse.languageFamily;
          setSourceLanguageCode(languageCode ?? 'en');
          setDefaultSourceLocaleCode(sourceLanguageResponse?.defaultLocale?.localeCode ?? null);
          const { defaultTarget, childTargets } = parseTranslationTargets(
            settings?.enableChildLocaleSupport,
            sourceLanguageResponse,
          );
          const translationLanguage = parseTranslationLanguage(
            languageCode ?? 'en',
            name ?? '',
            defaultTarget,
            childTargets,
          );
          setSourceTranslationLanguage(translationLanguage);
        }
      } catch (e) {
        const catchedError = e as Error;
        error(catchedError.message);
        setSourceLanguageCode('en');
      } finally {
        setSourceLanguageCodeLoading(false);
      }
    },
    [error, settings?.enableChildLocaleSupport],
  );

  useEffect(() => {
    const currentGameId = gameDetails?.id;
    if (!currentGameId || !isFetched) {
      return;
    }
    getSourceLanguage(currentGameId);
    getUserRoles(currentGameId);
    fetchSupportedLanguages(currentGameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- add disable comment here since we only need trigger data fetch when game id change
  }, [gameDetails, isFetched]);

  const sortedAndFilteredSupportedLanguages = useMemo(() => {
    if (supportedLanguages && sourceLanguageCode && locale) {
      return supportedLanguages
        .filter((language) => language.languageCode !== sourceLanguageCode)
        .sort((a, b) => a.displayName.localeCompare(b.displayName, locale.toString()));
    }
    return [];
  }, [supportedLanguages, sourceLanguageCode, locale]);

  const activeTranslationTarget = useMemo(() => {
    if (activeTranslationKey) {
      return translationKeyMap?.get(activeTranslationKey as string) || null;
    }
    if (
      router.pathname === localizationTranslationPath &&
      sortedAndFilteredSupportedLanguages.length > 0
    ) {
      return sortedAndFilteredSupportedLanguages[0].defaultLocalizationTarget;
    }
    return null;
  }, [
    activeTranslationKey,
    router.pathname,
    sortedAndFilteredSupportedLanguages,
    translationKeyMap,
  ]);

  return (
    <TranslationLogicContext.Provider
      value={useMemo(
        () => ({
          activeTranslationTarget,
          setActiveTranslationTarget,
          roleLoading,
          sourceTranslationLanguage,
          userRoles,
          supportedLanguages: sortedAndFilteredSupportedLanguages,
          setSupportedLanguages,
          supportedLanguageLoading,
          sourceLanguageCode,
          defaultSourceLocaleCode,
          sourceLanguageCodeLoading,
        }),
        [
          activeTranslationTarget,
          setActiveTranslationTarget,
          roleLoading,
          sourceTranslationLanguage,
          userRoles,
          sortedAndFilteredSupportedLanguages,
          supportedLanguageLoading,
          sourceLanguageCode,
          defaultSourceLocaleCode,
          sourceLanguageCodeLoading,
        ],
      )}>
      {children}
    </TranslationLogicContext.Provider>
  );
};

export default TranslationLogicProvider;
