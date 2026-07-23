import type { RobloxApiDevelopModelsUniverseSettingsResponse } from '@rbx/client-develop/v1';
import { UniverseSettingsApi } from '@rbx/client-develop/v1';
import type {
  RobloxApiDevelopModelsUniverseSettingsRequestV2AudiencesEnum,
  RobloxApiDevelopModelsUniverseSettingsRequestV2FiatProductChangeTypeEnum,
  RobloxApiDevelopModelsUniverseSettingsRequestV2PlayableDevicesEnum,
} from '@rbx/client-develop/v2';
import { UniverseSettingsApi as UniverseSettingsApiV2 } from '@rbx/client-develop/v2';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const configuration = createClientConfiguration('develop', 'bedev1');

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
  audiences?: Array<RobloxApiDevelopModelsUniverseSettingsRequestV2AudiencesEnum>;
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
