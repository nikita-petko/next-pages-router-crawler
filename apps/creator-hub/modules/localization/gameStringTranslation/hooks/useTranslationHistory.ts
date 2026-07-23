import { useCallback, useState } from 'react';
import {
  GameContentTranslationHistory,
  gameInternationalizationClient,
  localizationTableClient,
  NameDescriptionTranslationHistoryRequest,
  TranslationHistoryResponse,
  TranslationHistorySortOrder,
  ChangeAgentType,
  usersClient,
} from '@modules/clients';
import { RobloxGameInternationalizationApiGetNameDescriptionHistoryV2RequestContentTypeEnum as TranslationProductType } from '@rbx/clients/gameinternationalization/v1';
import { useTranslation } from '@rbx/intl';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { translationHistoryMaxCount } from '../constants';
import { GameStringTranslationInfo, HistoryEntry, TranslationInfo } from '../types';

const useTranslationHistory = () => {
  const { error } = useMetricsMonitoring();
  const { translate } = useTranslation();
  const [translationHistory, setTranslationHistory] = useState<HistoryEntry[] | null>(null);
  const [gameContentTranslationHistory, setGameContentTranslationHistory] = useState<
    HistoryEntry[] | null
  >(null);
  const [isTranslationHistoryLoading, setIsTranslationHistoryLoading] = useState<boolean>(false);
  const [isGameContentTranslationHistoryLoading, setIsGameContentTranslationHistoryLoading] =
    useState<boolean>(false);
  const [
    gameContentTranslationHistoryFetchingError,
    setGameContentTTranslationHistoryFetchingError,
  ] = useState<Error | null>(null);
  const [translationHistoryFetchingError, setTranslationHistoryFetchingError] =
    useState<Error | null>(null);
  const automaticTranslationLabel = translate('Label.AutomaticTranslation');

  const processTranslationHistoryResponse = useCallback(
    async (response: TranslationHistoryResponse | GameContentTranslationHistory) => {
      if (response.length === 0) {
        return [];
      }
      const userNameMap = new Map<number, string>();
      const userIdSet = new Set<number>();
      response.forEach((history) => {
        const translatorType = history.translator?.agentType;
        const translatorId = history.translator?.id;
        if (translatorType === ChangeAgentType.Automation) {
          userNameMap.set(0, automaticTranslationLabel);
        } else if (
          translatorType === ChangeAgentType.User &&
          typeof translatorId !== 'undefined' &&
          !userNameMap.has(translatorId)
        ) {
          userIdSet.add(translatorId);
        }
      });
      const userIdArray = Array.from(userIdSet);
      await Promise.all(
        userIdArray.map(async (userId) => {
          const userDetailedInfo = await usersClient.getUserById(userId);
          const userName =
            process.env.buildTarget === 'luobu'
              ? userDetailedInfo.displayName
              : userDetailedInfo.name;
          userNameMap.set(userId, userName ?? '');
        }),
      );

      const innerTranslationHistory = response.map((history) => {
        if (typeof history.translator?.id === 'undefined') {
          throw new Error('Translator Id undefined');
        }
        const translatorType = history.translator?.agentType;
        let translatorName = '';
        if (translatorType === ChangeAgentType.Automation) {
          translatorName = automaticTranslationLabel;
        } else if (translatorType === ChangeAgentType.User) {
          translatorName = userNameMap.get(history.translator.id) ?? '';
        }
        return {
          changeAgent: {
            changeAgentType: translatorType,
            changeAgentName: translatorName,
            changeAgentId: history.translator?.id,
          },
          translation: {
            translationText: history.translationText,
            createdTime: history.created,
          },
        } as HistoryEntry;
      });
      return innerTranslationHistory;
    },
    [automaticTranslationLabel],
  );

  const getTranslationHistory = useCallback(
    async (
      tableId: string,
      universeId: number,
      languageCode: string,
      innerEntryInfo: GameStringTranslationInfo | null,
    ) => {
      if (innerEntryInfo === null) {
        return null;
      }
      const translationHistoryResponse = await localizationTableClient.getTranslationHistory({
        tableId,
        gameId: universeId,
        request: {
          entries: [
            {
              identifier: {
                source: innerEntryInfo?.sourceText,
                key: innerEntryInfo?.key ?? undefined,
                context: innerEntryInfo?.context ?? undefined,
              },
              sortOrder: TranslationHistorySortOrder.Desc,
              count: translationHistoryMaxCount,
            },
          ],
          locale: languageCode,
        },
      });
      return processTranslationHistoryResponse(translationHistoryResponse);
    },
    [processTranslationHistoryResponse],
  );

  const getFullTranslationHistory = useCallback(
    async (
      tableId: string,
      universeId: number,
      languageCode: string,
      innerEntryInfo: GameStringTranslationInfo | null,
    ) => {
      setIsTranslationHistoryLoading(true);
      setTranslationHistory(null);
      setTranslationHistoryFetchingError(null);
      try {
        const innerTranslationHistory = await getTranslationHistory(
          tableId,
          universeId,
          languageCode,
          innerEntryInfo,
        );
        setTranslationHistory(innerTranslationHistory ?? null);
      } catch (e) {
        const catchedError = e as Error;
        error(catchedError.message);
        setTranslationHistoryFetchingError(catchedError);
      } finally {
        setIsTranslationHistoryLoading(false);
      }
    },
    [error, getTranslationHistory],
  );

  const getUpdatedTranslation = useCallback(
    async (
      tableId: string,
      universeId: number,
      languageCode: string,
      innerEntryInfo: GameStringTranslationInfo | null,
    ) => {
      try {
        const innerTranslationHistory = await getTranslationHistory(
          tableId,
          universeId,
          languageCode,
          innerEntryInfo,
        );
        if (innerTranslationHistory && innerTranslationHistory.length > 0 && languageCode) {
          const updatedTranslation: TranslationInfo = {
            languageCode,
            translation: innerTranslationHistory[0].translation,
            changeAgent: innerTranslationHistory[0].changeAgent,
          };
          return updatedTranslation;
        }
        return null;
      } catch {
        return null;
      }
    },
    [getTranslationHistory],
  );

  const getGameContentTranslationHistory = useCallback(
    async (
      translationType: TranslationProductType,
      contentId: number,
      activeTranslationKey: string,
    ) => {
      try {
        setIsGameContentTranslationHistoryLoading(true);
        setGameContentTranslationHistory(null);
        setGameContentTTranslationHistoryFetchingError(null);

        const translationHistoryRequest: NameDescriptionTranslationHistoryRequest = {
          request: {
            contentId,
            contentType: translationType,
            languageCode: activeTranslationKey,
            count: translationHistoryMaxCount,
            sortOrder: TranslationHistorySortOrder.Desc,
          },
        };
        const contentHistoryResponse =
          await gameInternationalizationClient.getGameContentTranslationHistory(
            translationHistoryRequest,
          );
        const histories = await processTranslationHistoryResponse(
          contentHistoryResponse.history ?? [],
        );
        setGameContentTranslationHistory(histories);
      } catch (e) {
        const catchedError = e as Error;
        error(catchedError.message);
        setGameContentTTranslationHistoryFetchingError(catchedError);
      } finally {
        setIsGameContentTranslationHistoryLoading(false);
      }
    },
    [error, processTranslationHistoryResponse],
  );

  return {
    gameContentTranslationHistory,
    translationHistory,
    isTranslationHistoryLoading,
    isGameContentTranslationHistoryLoading,
    gameContentTranslationHistoryFetchingError,
    translationHistoryFetchingError,
    getGameContentTranslationHistory,
    getUpdatedTranslation,
    getFullTranslationHistory,
  };
};

export default useTranslationHistory;
