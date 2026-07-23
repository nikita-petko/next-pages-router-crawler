/** Auto generated API client entry file for clientsettings */
import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  ClientApplicationSettingsApi,
  V1SettingsApplicationGetRequest,
  RobloxClientSettingsApiModelsResponseClientApplicationSettingsResponse,
} from '@rbx/clients/clientSettingsApi';

import { ChannelApi, V2UserChannelGetRequest } from '@rbx/clients/clientSettingsApi/v2';

import { getBEDEV1ServiceBasePath } from './utils';

const cdnBasePath = getBEDEV1ServiceBasePath('clientsettingscdn');
const basePath = getBEDEV1ServiceBasePath('clientsettings');

const clientApplicationSettingsApi = new ClientApplicationSettingsApi(
  new Configuration({
    robloxSiteDomain: process.env.robloxSiteDomain,
    basePath: cdnBasePath,
    credentials: 'omit',
    unifiedLogger: unifiedLoggerClient,
  }),
);

const channelApi = new ChannelApi(
  new Configuration({
    robloxSiteDomain: process.env.robloxSiteDomain,
    basePath,
    credentials: 'include',
    unifiedLogger: unifiedLoggerClient,
  }),
);

export enum EClientBinaryType {
  RCCService = 'RCCService',
  WindowsPlayer = 'WindowsPlayer',
  WindowsStudio = 'WindowsStudio64',
  MacPlayer = 'MacPlayer',
  MacStudio = 'MacStudio',
  WindowsStudioCJV = 'WindowsStudio64CJV',
  MacStudioCJV = 'MacStudioCJV',
  WindowsPlayerCJV = 'WindowsPlayerCJV',
  MacPlayerCJV = 'MacPlayerCJV',
}

export type SettingsResponse =
  RobloxClientSettingsApiModelsResponseClientApplicationSettingsResponse;
export interface SettingsClient {
  getApplicationSettings(): Promise<SettingsResponse>;
}

export const settingsClient: SettingsClient = {
  getApplicationSettings() {
    const request: V1SettingsApplicationGetRequest = {
      applicationName: 'CreatorDashboard',
    };

    return clientApplicationSettingsApi.v1SettingsApplicationGet(request);
  },
};

export const channelClient = {
  getUserChannel: (binaryType: EClientBinaryType) => {
    const request: V2UserChannelGetRequest = {
      binaryType,
    };

    return channelApi.v2UserChannelGet(request);
  },
};
