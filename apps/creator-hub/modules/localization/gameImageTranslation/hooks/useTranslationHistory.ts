import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@rbx/intl';
import type { TranslationHistoryResponse } from '@modules/clients/localizationTables';
import localizationTableClient, {
  ChangeAgentType,
  TranslationHistorySortOrder,
} from '@modules/clients/localizationTables';
import usersClient from '@modules/clients/users';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { translationHistoryMaxCount } from '../constants';
import type { HistoryEntry, ImageTranslationInfo } from '../types';

// Each asset-entry translation's `translationText` holds the translated asset id, so a history
// record's translated image is `rbxassetid://<translationText>`.
const toTranslatedAssetId = (translationText: string | undefined): number | null =>
  translationText != null && translationText !== '' ? Number(translationText) : null;

const useTranslationHistory = () => {
  const queryClient = useQueryClient();
  const { error } = useMetricsMonitoring();
  const { translateWithNamespace } = useTranslation();
  const [translationHistory, setTranslationHistory] = useState<HistoryEntry[] | null>(null);
  const [isTranslationHistoryLoading, setIsTranslationHistoryLoading] = useState<boolean>(false);
  const [translationHistoryFetchingError, setTranslationHistoryFetchingError] =
    useState<Error | null>(null);
  const automaticTranslationLabel = translateWithNamespace(
    TranslationNamespace.GameStringTranslation,
    'Label.AutomaticTranslation',
  );

  const processTranslationHistoryResponse = useCallback(
    async (response: TranslationHistoryResponse): Promise<HistoryEntry[]> => {
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

      await Promise.all(
        Array.from(userIdSet).map(async (userId) => {
          const userDetailedInfo = await queryClient.fetchQuery({
            queryKey: ['gameImageTranslation', 'translatorInfo', userId],
            queryFn: () => usersClient.getUserById(userId),
          });
          const userName =
            process.env.buildTarget === 'luobu'
              ? userDetailedInfo.displayName
              : userDetailedInfo.name;
          userNameMap.set(userId, userName ?? '');
        }),
      );

      return response.map((history) => {
        const translatorType = history.translator?.agentType;
        const translatorId = history.translator?.id;
        let translatorName = '';
        if (translatorType === ChangeAgentType.Automation) {
          translatorName = automaticTranslationLabel;
        } else if (translatorType === ChangeAgentType.User && typeof translatorId !== 'undefined') {
          translatorName = userNameMap.get(translatorId) ?? '';
        }
        return {
          changeAgent: {
            changeAgentType: translatorType ?? ChangeAgentType.Automation,
            changeAgentName: translatorName,
            changeAgentId: translatorId,
          },
          translation: {
            translatedAssetId: toTranslatedAssetId(history.translationText),
            createdTime: history.created ?? null,
          },
        };
      });
    },
    [automaticTranslationLabel, queryClient],
  );

  const getFullTranslationHistory = useCallback(
    async (
      tableId: string,
      universeId: number,
      languageCode: string,
      entryInfo: ImageTranslationInfo | null,
    ) => {
      if (entryInfo === null) {
        return;
      }
      setIsTranslationHistoryLoading(true);
      setTranslationHistory(null);
      setTranslationHistoryFetchingError(null);
      try {
        const response = await queryClient.fetchQuery({
          queryKey: [
            'gameImageTranslation',
            'translationHistory',
            tableId,
            universeId,
            languageCode,
            entryInfo.sourceAssetId,
          ],
          queryFn: () =>
            localizationTableClient.getTranslationHistory({
              tableId,
              gameId: universeId,
              request: {
                entries: [
                  {
                    identifier: { source: `${universeId}#${entryInfo.sourceAssetId}` },
                    sortOrder: TranslationHistorySortOrder.Desc,
                    count: translationHistoryMaxCount,
                  },
                ],
                locale: languageCode,
                sourceType: 'AssetImage',
              },
            }),
        });
        setTranslationHistory(await processTranslationHistoryResponse(response));
      } catch (caughtError) {
        const normalizedError =
          caughtError instanceof Error ? caughtError : new Error(String(caughtError));
        error(normalizedError.message);
        setTranslationHistoryFetchingError(normalizedError);
      } finally {
        setIsTranslationHistoryLoading(false);
      }
    },
    [error, processTranslationHistoryResponse, queryClient],
  );

  return {
    translationHistory,
    isTranslationHistoryLoading,
    translationHistoryFetchingError,
    getFullTranslationHistory,
  };
};

export default useTranslationHistory;
