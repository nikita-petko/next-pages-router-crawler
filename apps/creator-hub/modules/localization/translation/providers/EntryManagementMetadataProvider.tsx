import {
  extractStringValueFromError,
  localizationTableClient,
  UserRoleType,
} from '@modules/clients';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import React, { FunctionComponent, useState, useEffect, useCallback, useMemo } from 'react';

import { TranslationLanguage } from '../types/TranslationLanguage';
import TranslationTarget from '../types/TranslationTarget';
import EntryManagementMetadataContext from './EntryManagementMetadataContext';

interface EntryManagementMetadataProviderProps {
  gameId: number | null;
  userRoles: UserRoleType[];
  sourceLanguageCode: string;
  activeTranslationTarget: TranslationTarget | null;
  supportedLanguages: TranslationLanguage[];
  shouldLoadTranslationHistory: boolean;
}

const EntryManagementMetadataProvider: FunctionComponent<
  React.PropsWithChildren<EntryManagementMetadataProviderProps>
> = ({
  gameId,
  userRoles,
  sourceLanguageCode,
  activeTranslationTarget,
  supportedLanguages,
  shouldLoadTranslationHistory,
  children,
}) => {
  const { error } = useMetricsMonitoring();
  const [entryTableId, setEntryTableId] = useState<string>('');
  const [fetchEntryTableIdError, setFetchEntryTableIdError] = useState<Error | null>(null);
  const [tableIdLoading, setTableIdLoading] = useState<boolean>(false);

  const currentLanguageOrLocaleCode = activeTranslationTarget?.translationKey ?? null;

  const isRoleAdmin = useMemo(() => {
    return userRoles.includes(UserRoleType.owner);
  }, [userRoles]);

  const getEntryTableId = useCallback(
    async (_gameId: number) => {
      setFetchEntryTableIdError(null);
      setTableIdLoading(true);
      try {
        const entryTableIdResponse = await localizationTableClient.getAutoLocalizationTable({
          gameId: _gameId,
        });
        if (!entryTableIdResponse.autoLocalizationTableId) {
          throw new Error('Entry table Id is undefined');
        }
        setEntryTableId(entryTableIdResponse.autoLocalizationTableId);
      } catch (e) {
        error(extractStringValueFromError(e, 'message', ''));
        if (e instanceof Error) {
          setFetchEntryTableIdError(e);
        }
      } finally {
        setTableIdLoading(false);
      }
    },
    [error],
  );

  useEffect(() => {
    if (!gameId) {
      return;
    }
    getEntryTableId(gameId);
  }, [gameId, getEntryTableId]);

  return (
    <EntryManagementMetadataContext.Provider
      value={useMemo(
        () => ({
          gameId,
          currentLanguageOrLocaleCode,
          entryTableId,
          fetchEntryTableIdError,
          sourceLanguageCode,
          activeTranslationTarget,
          supportedLanguages,
          isRoleAdmin,
          tableIdLoading,
          shouldLoadTranslationHistory,
        }),
        [
          gameId,
          currentLanguageOrLocaleCode,
          entryTableId,
          fetchEntryTableIdError,
          sourceLanguageCode,
          activeTranslationTarget,
          supportedLanguages,
          isRoleAdmin,
          tableIdLoading,
          shouldLoadTranslationHistory,
        ],
      )}>
      {children}
    </EntryManagementMetadataContext.Provider>
  );
};

export default EntryManagementMetadataProvider;
