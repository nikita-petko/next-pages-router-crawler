import { ChannelApi, V2UserChannelGetRequest } from '@rbx/client-clientsettings/v2';
import { Configuration } from '@rbx/clients-core';

import { unifiedLogger } from '@clients/unifiedLogger';
import { GetBEDEV1ServiceBasePath, GetSitetestBaseUrl } from '@utils/url';

export enum EClientBinaryType {
  MacPlayer = 'MacPlayer',
  MacPlayerCJV = 'MacPlayerCJV',
  MacStudio = 'MacStudio',
  MacStudioCJV = 'MacStudioCJV',
  RCCService = 'RCCService',
  WindowsPlayer = 'WindowsPlayer',
  WindowsPlayerCJV = 'WindowsPlayerCJV',
  WindowsStudio = 'WindowsStudio64',
  WindowsStudioCJV = 'WindowsStudio64CJV',
}

const basePath = GetBEDEV1ServiceBasePath('clientsettings');

const configuration = new Configuration({
  basePath,
  credentials: 'include',
  robloxSiteDomain: GetSitetestBaseUrl(),
  unifiedLogger,
});

const channelApi = new ChannelApi(configuration);

export const channelClient = {
  getUserChannel: (binaryType: EClientBinaryType) => {
    const request: V2UserChannelGetRequest = {
      binaryType,
    };

    return channelApi.v2UserChannelGet(request);
  },
};
