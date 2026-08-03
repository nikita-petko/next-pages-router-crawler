import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  GenericCreatorSettingType,
  type GenericCreatorSettingType as TGenericCreatorSettingType,
} from '@rbx/client-creator-settings/v1';
import type { NotificationChannel } from '@modules/clients/creatorSettings';
import { genericCreatorSettingsClient } from '@modules/clients/creatorSettings';
import getCreatorSettings from './creatorSettingsRequests';

const GROUP_UNIFIED_ACKNOWLEDGEMENT_SETTING_TYPE =
  GenericCreatorSettingType.GroupUnifiedAcknowledgement;

const parseAcknowledgedGroupIds = (settingValue: string | undefined): number[] => {
  if (!settingValue) {
    return [];
  }

  const parsedValue: unknown = JSON.parse(settingValue);
  if (!Array.isArray(parsedValue)) {
    throw new TypeError('Invalid group unified acknowledgement setting');
  }

  const groupIds: number[] = [];
  for (const groupId of parsedValue) {
    if (typeof groupId !== 'number' || !Number.isSafeInteger(groupId)) {
      throw new TypeError('Invalid group unified acknowledgement setting');
    }
    groupIds.push(groupId);
  }

  return groupIds;
};

export function useGetCreatorSettings(
  userId?: number | null,
  notificationChannels?: NotificationChannel[],
) {
  return useQuery({
    queryKey: ['creatorSettings', userId],
    queryFn: async () => {
      if (userId == null) {
        throw new Error('Invalid user id');
      }

      const response = await getCreatorSettings(userId.toString(), notificationChannels);
      return response.categories ?? [];
    },
    enabled: Boolean(userId),
  });
}

export function useGetGenericCreatorSettings(userId: number | undefined) {
  return useQuery({
    queryKey: ['creatorSettings', userId],
    queryFn: async () => {
      if (userId === undefined) {
        throw new TypeError('Invalid user id');
      }

      const res = await genericCreatorSettingsClient.getGenericCreatorSettingsByUserId(userId);
      const settings: Partial<Record<TGenericCreatorSettingType, string>> = {};
      if (!res.settings) {
        return settings;
      }

      return res.settings.reduce((acc, { settingType, settingValue }) => {
        if (settingType) {
          acc[settingType] = settingValue ?? '';
        }
        return acc;
      }, settings);
    },
    enabled: Boolean(userId),
  });
}

export function useGetGenericCreatorSetting(
  userId: number | undefined,
  setting: GenericCreatorSettingType,
) {
  return useQuery({
    queryKey: ['creatorSettings', userId, setting],
    queryFn: async () => {
      if (userId === undefined) {
        throw new TypeError('Invalid user id');
      }
      const res = await genericCreatorSettingsClient.getGenericCreatorSetting(userId, setting);
      return res.settingValue ?? '';
    },
    enabled: Boolean(userId),
  });
}

type TCreateOrUpdateGenericCreatorSettingRequest = {
  userId: number | undefined;
  setting: GenericCreatorSettingType;
  settingValue: string;
};
export function useCreateOrUpdateGenericCreatorSettings() {
  return useMutation({
    mutationFn: async ({
      userId,
      setting,
      settingValue,
    }: TCreateOrUpdateGenericCreatorSettingRequest) => {
      if (userId === undefined) {
        throw new Error('Invalid user id');
      }

      return genericCreatorSettingsClient.updateGenericCreatorSetting(
        userId,
        setting,
        settingValue,
      );
    },
  });
}

type TAcknowledgeGroupUnificationRequest = {
  userId: number;
  groupId: number;
};

export function useAcknowledgeGroupUnification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, groupId }: TAcknowledgeGroupUnificationRequest) => {
      const { settingValue } = await genericCreatorSettingsClient.getGenericCreatorSetting(
        userId,
        GROUP_UNIFIED_ACKNOWLEDGEMENT_SETTING_TYPE,
      );
      const acknowledgedGroupIds = parseAcknowledgedGroupIds(settingValue);
      if (!acknowledgedGroupIds.includes(groupId)) {
        await genericCreatorSettingsClient.updateGenericCreatorSetting(
          userId,
          GROUP_UNIFIED_ACKNOWLEDGEMENT_SETTING_TYPE,
          JSON.stringify([...acknowledgedGroupIds, groupId]),
        );
      }
    },
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({
        queryKey: ['creatorSettings', userId, GROUP_UNIFIED_ACKNOWLEDGEMENT_SETTING_TYPE],
      });
    },
  });
}
