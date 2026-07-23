import type {
  V1SettingsApplicationGetRequest,
  RobloxClientSettingsApiModelsResponseClientApplicationSettingsResponse,
} from '@rbx/client-clientsettings/v1';
import { ClientApplicationSettingsApi } from '@rbx/client-clientsettings/v1';
import type { V2UserChannelGetRequest } from '@rbx/client-clientsettings/v2';
import { ChannelApi } from '@rbx/client-clientsettings/v2';
import { createClientConfiguration } from './utils/createClientConfiguration';

const clientApplicationSettingsApi = new ClientApplicationSettingsApi(
  createClientConfiguration('clientsettingscdn', 'bedev1', { credentials: 'omit' }),
);

const channelApi = new ChannelApi(createClientConfiguration('clientsettings', 'bedev1'));

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
