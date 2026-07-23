import {
  CreatorSettingsAPIApi,
  type GenericCreatorSettingType,
  type GetGenericCreatorSettingsByUserIdAndSettingTypeResponse,
  type V2SettingsUserUserIdSettingSettingTypePatchRequest,
  type UpdateOrCreateGenericCreatorSettingsByUserIdAndSettingTypeResponse,
} from '@rbx/client-creator-settings/v1';
import { Configuration } from '@rbx/clients-core';
import { getBEDEV2ServiceBasePath } from '../utilities/getBasePaths';

export interface CreatorSettingsClient {
  getGenericCreatorSetting: (
    userId: number,
    settingType: GenericCreatorSettingType,
  ) => Promise<GetGenericCreatorSettingsByUserIdAndSettingTypeResponse>;

  updateGenericCreatorSetting: (
    userId: number,
    settingType: GenericCreatorSettingType,
    settingValue: string,
  ) => Promise<UpdateOrCreateGenericCreatorSettingsByUserIdAndSettingTypeResponse>;
}

export function createCreatorSettingsClient(robloxSiteDomain: string): CreatorSettingsClient {
  const configuration = new Configuration({
    robloxSiteDomain,
    basePath: getBEDEV2ServiceBasePath('creator-settings', robloxSiteDomain),
    credentials: 'include',
    enableMrRouter: true,
  });

  const api = new CreatorSettingsAPIApi(configuration);

  return {
    getGenericCreatorSetting(userId, settingType) {
      return api.v2SettingsUserUserIdSettingSettingTypeGet({ userId, settingType });
    },

    updateGenericCreatorSetting(userId, settingType, settingValue) {
      const request: V2SettingsUserUserIdSettingSettingTypePatchRequest = {
        userId,
        settingType,
        updateOrCreateGenericCreatorSettingsByUserIdAndSettingTypeRequest: { settingValue },
      };
      return api.v2SettingsUserUserIdSettingSettingTypePatch(request);
    },
  };
}
