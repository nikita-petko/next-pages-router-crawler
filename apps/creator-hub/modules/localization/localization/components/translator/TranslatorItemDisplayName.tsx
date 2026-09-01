import type { FunctionComponent } from 'react';
import React, { useState, useCallback, useEffect } from 'react';
import { Skeleton } from '@rbx/ui';
import groupsClient from '@modules/clients/groups';
import { TranslatorType } from '@modules/clients/translationRoles';
import usersClient from '@modules/clients/users';
import { getResponseFromError } from '@modules/clients/utils';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import type { TranslatorAssigneeData } from '../../types/TranslatorInfo';

export interface TranslatorItemDisplayNameProps {
  translatorData: TranslatorAssigneeData;
}

export const TRANSLATOR_ITEM_DISPLAYNAME_SKELETON_HEIGHT = 100;

const TranslatorItemDisplayName: FunctionComponent<
  React.PropsWithChildren<TranslatorItemDisplayNameProps>
> = ({ translatorData }) => {
  const { error } = useMetricsMonitoring();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isDisplayNameLoading, setIsDisplayNameLoading] = useState<boolean>(false);

  const getUserDisplayName = useCallback(async () => {
    try {
      const res = await usersClient.getUserById(translatorData.id);
      if (res && res.displayName) {
        setDisplayName(res.displayName);
      }
    } catch (e) {
      const responseError = getResponseFromError(e);
      error(`Localization translator - getUserById failed with ${responseError?.status}`);
    }
  }, [error, translatorData]);

  const getGroupDisplayName = useCallback(
    async (id: number) => {
      try {
        const res = await groupsClient.getGroupInfo(id);
        if (res && res.name) {
          setDisplayName(res.name);
        }
      } catch (e) {
        const responseError = getResponseFromError(e);
        error(`Localization translator - getGroupInfo failed with ${responseError?.status}`);
      }
    },
    [error],
  );

  const loadDisplayName = useCallback(async () => {
    setIsDisplayNameLoading(true);
    switch (translatorData.type) {
      case TranslatorType.Group:
        await getGroupDisplayName(translatorData.id);
        break;
      case TranslatorType.GroupRole:
        await getGroupDisplayName(translatorData.groupId!);
        break;
      default:
        await getUserDisplayName();
    }
    setIsDisplayNameLoading(false);
  }, [translatorData, getUserDisplayName, getGroupDisplayName]);

  useEffect(() => {
    loadDisplayName();
  }, [loadDisplayName]);

  if (displayName === null || isDisplayNameLoading) {
    return <Skeleton variant='text' width={TRANSLATOR_ITEM_DISPLAYNAME_SKELETON_HEIGHT} animate />;
  }
  return <span>{displayName}</span>;
};

export default TranslatorItemDisplayName;
