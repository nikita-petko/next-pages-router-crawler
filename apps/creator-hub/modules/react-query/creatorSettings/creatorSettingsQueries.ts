import { useMutation, useQuery } from '@tanstack/react-query';
import type { GenericCreatorSettingType } from '@rbx/client-creator-settings/v1';
import type { NotificationChannel } from '@modules/clients/creatorSettings';
import { genericCreatorSettingsClient } from '@modules/clients/creatorSettings';
import getCreatorSettings from './creatorSettingsRequests';

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
      const res = await genericCreatorSettingsClient.getGenericCreatorSettingsByUserId(userId!);

      const settings = {} as Record<GenericCreatorSettingType, string>;
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
      const res = await genericCreatorSettingsClient.getGenericCreatorSetting(userId!, setting);
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
