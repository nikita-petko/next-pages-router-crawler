import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  CreatorSettingsAPIApi,
  GetOrCreateCreatorSettingsByUserIdAndSettingsTypeResponse,
  UpdateCreatorSettingsByUserIdAndSettingsTypeResponse,
  SettingsType,
  EmailSettings,
  PrivacySettings,
  TalentHubRestrictions,
  ValidateUnsubscribeHashResponse,
  UnsubscribeType,
  UnsubscribeByHashResponse,
  GetAllCreatorNotificationSettingsResponse,
  CreatorNotification,
  UnsubscribeChoice,
  GenericCreatorSettingType,
  GetGenericCreatorSettingsByUserIdAndSettingTypeResponse,
  V2SettingsUserUserIdSettingSettingTypePatchRequest,
  UpdateOrCreateGenericCreatorSettingsByUserIdAndSettingTypeResponse,
  GetAllGenericCreatorSettingsByUserIdResponse,
} from '@rbx/clients/creatorSettings';
import { getBEDEV2ServiceBasePath } from './utils';

const basePath = getBEDEV2ServiceBasePath('creator-settings');

type CreatorSettingsResponse = GetOrCreateCreatorSettingsByUserIdAndSettingsTypeResponse;
type CreatorSettingsUpdateResponse = UpdateCreatorSettingsByUserIdAndSettingsTypeResponse;

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const creatorSettingsApi = new CreatorSettingsAPIApi(configuration);

// Note (mbae, 03/17/23): There's a limitation in the backend that forces them to
// expose notification channel as a string instead of an enum. This type is made
// to temporarily mitigate that problem.
export type NotificationChannel = 'Email' | 'Webhook';

/**
 * This wrapper around creator settings was taken from the talent hub repo.
 */
export const talentHubCreatorSettingsClient = {
  getCreatorSettings: (
    userId: string,
    settingsType?: SettingsType,
  ): Promise<CreatorSettingsResponse> => {
    const getCreatorSettingsRequest = {
      getOrCreateCreatorSettingsByUserIdAndSettingsTypeRequest: {
        userId: Number(userId),
        settingsType: settingsType || SettingsType.TalentHub,
      },
    };
    return creatorSettingsApi.v1SettingsPost(getCreatorSettingsRequest);
  },

  updateCreatorSettings: (
    userId: string,
    settingsType: SettingsType,
    emailSettings: EmailSettings,
  ): Promise<CreatorSettingsUpdateResponse> => {
    const temporaryHardCodedPrivacySettings: PrivacySettings = {
      talentHubRestrictions: TalentHubRestrictions.Blocked,
    };
    const talentHubSettings = { emailSettings, privacySettings: temporaryHardCodedPrivacySettings };
    const updateCreatorSettingsRequest = {
      updateCreatorSettingsByUserIdAndSettingsTypeRequest: {
        userId: Number(userId),
        settingsType,
        talentHubSettings,
      },
    };
    return creatorSettingsApi.v1SettingsPatch(updateCreatorSettingsRequest);
  },
  validateUnsubscribeRequest: (
    hash: string,
    userId: string,
    unsubscribeType?: UnsubscribeType,
  ): Promise<ValidateUnsubscribeHashResponse> => {
    return creatorSettingsApi.v1UnsubscribeValidatePost({
      validateUnsubscribeHashRequest: {
        hash,
        userId: Number(userId),
        unsubscribeType,
      },
    });
  },
  unsubscribeFromNotification: (
    hash: string,
    userId: string,
    unsubscribeType?: UnsubscribeType,
  ): Promise<UnsubscribeByHashResponse> => {
    return creatorSettingsApi.v1UnsubscribeUnsubscribePost({
      unsubscribeByHashRequest: {
        hash,
        userId: Number(userId),
        unsubscribeType,
      },
    });
  },
};

/**
 * Creator Settings APIs that specifically use SENDR
 */
export const creatorSettingsClient = {
  getCreatorSettings: (
    userId: string,
    notificationChannels?: Array<NotificationChannel>,
  ): Promise<GetAllCreatorNotificationSettingsResponse> => {
    const getCreatorSettingsRequest = {
      getAllCreatorNotificationSettingsRequest: {
        userId: Number(userId),
        notificationChannels,
      },
    };

    return creatorSettingsApi.v1NotificationsSettingsPost(getCreatorSettingsRequest);
  },
  updateCreatorSettings: async (
    userId: string,
    notificationsSettings: CreatorNotification[],
  ): Promise<void> => {
    const updateCreatorSettingsRequest = {
      updateCreatorNotificationSettingsRequest: {
        userId: Number(userId),
        notificationsSettings,
      },
    };

    await creatorSettingsApi.v1NotificationsSettingsPatch(updateCreatorSettingsRequest);
  },
  validateUnsubscribeRequest: async (
    hash: string,
    userId: string,
    notificationType?: string,
  ): Promise<void> => {
    await creatorSettingsApi.v1NotificationsValidatePost({
      validateCreatorNotificationsUnsubscribeHashRequest: {
        hash,
        userId: Number(userId),
        notificationType,
      },
    });
  },
  unsubscribeFromNotification: async (
    hash: string,
    userId: string,
    unsubscribeChoice: UnsubscribeChoice,
    notificationType?: string,
  ): Promise<void> => {
    await creatorSettingsApi.v1NotificationsUnsubscribePost({
      unsubscribeFromCreatorNotificationsRequest: {
        hash,
        userId: Number(userId),
        choice: unsubscribeChoice,
        notificationType,
      },
    });
  },
};

/**
 * Creator Settings APIs for generic settings
 */
export const genericCreatorSettingsClient = {
  getGenericCreatorSetting: (
    userId: number,
    settingType: GenericCreatorSettingType,
  ): Promise<GetGenericCreatorSettingsByUserIdAndSettingTypeResponse> => {
    const v2SettingsUserUserIdSettingSettingTypeGetRequest = {
      userId,
      settingType,
    };
    return creatorSettingsApi.v2SettingsUserUserIdSettingSettingTypeGet(
      v2SettingsUserUserIdSettingSettingTypeGetRequest,
    );
  },
  getGenericCreatorSettingsByUserId: (
    userId: number,
  ): Promise<GetAllGenericCreatorSettingsByUserIdResponse> => {
    const v2SettingsUserUserIdGetRequest = {
      userId,
    };
    return creatorSettingsApi.v2SettingsUserUserIdGet(v2SettingsUserUserIdGetRequest);
  },
  updateGenericCreatorSetting: (
    userId: number,
    settingType: GenericCreatorSettingType,
    settingValue: string,
  ): Promise<UpdateOrCreateGenericCreatorSettingsByUserIdAndSettingTypeResponse> => {
    const v2SettingsUserUserIdSettingSettingTypePatchRequest: V2SettingsUserUserIdSettingSettingTypePatchRequest =
      {
        userId,
        settingType,
        updateOrCreateGenericCreatorSettingsByUserIdAndSettingTypeRequest: {
          settingValue,
        },
      };
    return creatorSettingsApi.v2SettingsUserUserIdSettingSettingTypePatch(
      v2SettingsUserUserIdSettingSettingTypePatchRequest,
    );
  },
};
