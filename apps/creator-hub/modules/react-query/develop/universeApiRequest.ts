import { getBEDEV1ServiceBasePath } from '@modules/clients/utils';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { Configuration } from '@rbx/clients';
import {
  RobloxApiDevelopModelsUniverseSettingsResponse,
  UniverseSettingsApi,
} from '@rbx/clients/develop/v1';
import {
  UniverseSettingsApi as UniverseSettingsApiV2,
  RobloxApiDevelopModelsUniverseSettingsRequestV2FiatProductChangeTypeEnum,
  RobloxApiDevelopModelsUniverseSettingsRequestV2PlayableDevicesEnum,
} from '@rbx/clients/develop/v2';

const basePath = getBEDEV1ServiceBasePath('develop');
const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const universeSettingsApi = new UniverseSettingsApi(configuration);
const universeSettingsApiV2 = new UniverseSettingsApiV2(configuration);

export const getUniverseConfiguration = (
  universeId: number,
): Promise<RobloxApiDevelopModelsUniverseSettingsResponse> => {
  return universeSettingsApi.v1UniversesUniverseIdConfigurationGet({ universeId });
};

export type TSetUniverseConfigurationArgs = {
  universeId: number;
  name?: string;
  description?: string;
  isStudioAccessToApisAllowed?: boolean;
  isMeshTextureApisAllowed?: boolean;
  allowPrivateServers?: boolean;
  privateServerPrice?: number;
  isFriendsOnly?: boolean;
  playableDevices?: Array<RobloxApiDevelopModelsUniverseSettingsRequestV2PlayableDevicesEnum>;
  isForSale?: boolean;
  price?: number;
  fiatBasePriceId?: string;
  fiatProductChangeType?: RobloxApiDevelopModelsUniverseSettingsRequestV2FiatProductChangeTypeEnum;
};

export const setUniverseConfigurationV2 = ({
  universeId,
  isStudioAccessToApisAllowed,
  isMeshTextureApisAllowed,
  ...model
}: TSetUniverseConfigurationArgs) => {
  const request = {
    universeId,
    model: {
      studioAccessToApisAllowed: isStudioAccessToApisAllowed,
      isMeshTextureApiAccessAllowed: isMeshTextureApisAllowed,
      ...model,
    },
  };
  return universeSettingsApiV2.v2UniversesUniverseIdConfigurationPatch(request);
};
