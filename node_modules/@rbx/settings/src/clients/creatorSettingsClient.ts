import type {
  GenericCreatorSettingType,
  GetGenericCreatorSettingsByUserIdAndSettingTypeResponse,
  V2SettingsUserUserIdSettingSettingTypePatchRequest,
  UpdateOrCreateGenericCreatorSettingsByUserIdAndSettingTypeResponse,
} from '@rbx/client-creator-settings/v1';
import { CreatorSettingsAPIApi } from '@rbx/client-creator-settings/v1';
import { Configuration } from '@rbx/clients-core';
import getBEDEV2ServiceBasePath from './utils/getBEDEV2ServiceBasePath';

export type CreatorSettingsClient = {
  getGenericCreatorSetting: (
    userId: number,
    settingType: GenericCreatorSettingType,
  ) => Promise<GetGenericCreatorSettingsByUserIdAndSettingTypeResponse>;

  updateGenericCreatorSetting: (
    userId: number,
    settingType: GenericCreatorSettingType,
    settingValue: string,
  ) => Promise<UpdateOrCreateGenericCreatorSettingsByUserIdAndSettingTypeResponse>;
};

const createCreatorSettingsClient = (bedev2BaseUrl: string): CreatorSettingsClient => {
  const configuration = new Configuration({
    basePath: getBEDEV2ServiceBasePath('creator-settings', bedev2BaseUrl),
    credentials: 'include',
    enableMrRouter: true,
  });

  const creatorSettingsApi = new CreatorSettingsAPIApi(configuration);

  return {
    getGenericCreatorSetting(
      userId: number,
      settingType: GenericCreatorSettingType,
    ): Promise<GetGenericCreatorSettingsByUserIdAndSettingTypeResponse> {
      const request = {
        userId,
        settingType,
      };
      return creatorSettingsApi.v2SettingsUserUserIdSettingSettingTypeGet(request);
    },

    updateGenericCreatorSetting(
      userId: number,
      settingType: GenericCreatorSettingType,
      settingValue: string,
    ): Promise<UpdateOrCreateGenericCreatorSettingsByUserIdAndSettingTypeResponse> {
      const request: V2SettingsUserUserIdSettingSettingTypePatchRequest = {
        userId,
        settingType,
        updateOrCreateGenericCreatorSettingsByUserIdAndSettingTypeRequest: {
          settingValue,
        },
      };
      return creatorSettingsApi.v2SettingsUserUserIdSettingSettingTypePatch(request);
    },
  };
};

export default createCreatorSettingsClient;
