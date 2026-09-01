import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import type { GroupRoleDetailResponse } from '@modules/clients/groups';
import groupsClient from '@modules/clients/groups';
import translationRolesClient, { TranslatorType } from '@modules/clients/translationRoles';
import { extractStringValueFromError } from '@modules/clients/utils/errorHelpers';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import type { TranslatorAssigneeData } from '../types/TranslatorInfo';
import TranslatorManagementContext from './TranslatorManagementContext';

const TranslatorManagementProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { error } = useMetricsMonitoring();
  const { showFailureToast } = useShowToastMessage();
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const [isTranslatorListLoading, setIsTranslatorListLoading] = useState<boolean>(false);
  const [isTranslatorListFetchFailed, setIsTranslatorListFetchFailed] = useState<boolean>(false);
  const [translatorData, setTranslatorData] = useState<TranslatorAssigneeData[] | null>(null);

  const [translatorIdInDeletion, setTranslatorIdInDeletion] = useState<number | null>(null);
  const [isAddingTranslator, setIsAddingTranslator] = useState<boolean>(false);

  const loadGroupRolesData = useCallback(async (groupRoleIds: number[]) => {
    const groupRoleRes = await groupsClient.getRolesInfo(groupRoleIds);
    if (!groupRoleRes.data) {
      throw new Error('No data in getRolesInfo response');
    } else {
      const groupRoleData: Map<number, GroupRoleDetailResponse> = new Map();
      groupRoleRes.data.forEach((role) => {
        if (role.id) {
          groupRoleData.set(role.id, role);
        }
      });
      return groupRoleData;
    }
  }, []);

  const loadTranslatorsData = useCallback(
    async (translatorPageLoadingShow = true) => {
      if (!gameDetails || !gameDetails.id) {
        return;
      }
      const universeId = gameDetails.id;
      if (translatorPageLoadingShow) {
        setIsTranslatorListLoading(true);
      }
      try {
        const res = await translationRolesClient.getTranslatorsByGameId(universeId);
        if (!res.data) {
          throw new Error('No data in getTranslatorsByGameId response');
        } else {
          const gameTranslatorList = res.data;
          const groupRoleIds: number[] = gameTranslatorList
            .filter((translator) => translator.type === TranslatorType.GroupRole && translator.id)
            .map((translator) => translator.id as number); // -- NOTE (@mbae 05/09/24) React 18 migration: Typescript isn't smart enough to know that we already filtered on translator.id
          let groupRoleData = new Map();
          if (groupRoleIds.length > 0) {
            groupRoleData = await loadGroupRolesData(groupRoleIds);
          }
          setTranslatorData(
            gameTranslatorList
              .filter((item) => item.id && item.type)
              .map((translator) => {
                return {
                  type: translator.type,
                  id: translator.id,
                  name:
                    translator.type === TranslatorType.GroupRole
                      ? groupRoleData.get(translator.id).name
                      : translator.name,
                  groupId: groupRoleData.has(translator.id)
                    ? groupRoleData.get(translator.id).groupId
                    : null,
                } as TranslatorAssigneeData;
              }),
          );
        }
      } catch (e) {
        setIsTranslatorListFetchFailed(true);
        const err = extractStringValueFromError(e, 'message');
        if (err) {
          error(`Localization - Translator - loadTranslatorsData failure - ${err}`);
        } else {
          const errRes = await tryParseResponseError(e);
          if (errRes) {
            const { code, message } = errRes;
            error(`${code} - Localization - Translator - loadTranslatorsData failure - ${message}`);
          }
        }
      } finally {
        if (translatorPageLoadingShow) {
          setIsTranslatorListLoading(false);
        }
      }
    },
    [gameDetails, error, loadGroupRolesData],
  );

  const deleteTranslator = useCallback(
    async (translator: TranslatorAssigneeData) => {
      if (!gameDetails || !gameDetails.id) {
        return;
      }
      const universeId = gameDetails.id;
      setTranslatorIdInDeletion(translator.id);
      try {
        await translationRolesClient.deleteTranslator(universeId, translator.id, translator.type);
        await loadTranslatorsData(false);
      } catch (e) {
        error('Localization - Translator - Failed to delete translator');
        if (showFailureToast) {
          showFailureToast(translate('Message.TranslatorDeletionFailure'));
        }
        throw e;
      } finally {
        setTranslatorIdInDeletion(null);
      }
    },
    [gameDetails, loadTranslatorsData, showFailureToast, error, translate],
  );

  const addTranslators = useCallback(
    async (translatorIds: number[], translatorType: TranslatorType) => {
      if (!gameDetails || !gameDetails.id) {
        return;
      }
      const universeId = gameDetails.id;
      setIsAddingTranslator(true);
      try {
        for (const translatorId of translatorIds) {
          const res = await translationRolesClient.addTranslator(
            universeId,
            translatorId,
            translatorType,
          );
          if (!res) {
            throw new Error('add translator failed');
          }
        }
        await loadTranslatorsData(false);
      } catch (e) {
        error(`Localization - Translator - ${extractStringValueFromError(e, 'message')}`);
        if (showFailureToast) {
          showFailureToast(translate('Message.AddTranslatorError'));
        }
        throw e;
      } finally {
        setIsAddingTranslator(false);
      }
    },
    [gameDetails, loadTranslatorsData, error, showFailureToast, translate],
  );

  useEffect(() => {
    if (gameDetails && gameDetails.id) {
      loadTranslatorsData();
    }
  }, [gameDetails, loadTranslatorsData]);

  const contextValue = useMemo(
    () => ({
      isTranslatorListLoading,
      isTranslatorListFetchFailed,
      translatorData,
      translatorIdInDeletion,
      deleteTranslator,
      isAddingTranslator,
      addTranslators,
    }),
    [
      isTranslatorListLoading,
      isTranslatorListFetchFailed,
      translatorData,
      translatorIdInDeletion,
      deleteTranslator,
      isAddingTranslator,
      addTranslators,
    ],
  );

  return (
    <TranslatorManagementContext.Provider value={contextValue}>
      {children}
    </TranslatorManagementContext.Provider>
  );
};

export default TranslatorManagementProvider;
