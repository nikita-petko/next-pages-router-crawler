import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  ExperienceStoreStateResponse,
  UniverseEdpStateType,
  ExperienceStoreApiApi,
  ErrorResponse,
  ErrorCode,
  ExperienceStoreApiSetExperienceStoreStateRequest,
} from '@rbx/clients/experienceStoreApi';
import { getBEDEV2ServiceBasePath } from './utils';

export type { ExperienceStoreStateResponse, UniverseEdpStateType };
export type { ErrorResponse as ExperienceStoreErrorResponse };
export type { ExperienceStoreApiSetExperienceStoreStateRequest as SetExperienceStoreStateRequest };
export { ErrorCode as ExperienceStoreErrorCodes };

export class ExperienceStoreApiClient {
  private experienceStoreApi;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('experience-store')) {
    const apiConfiguration = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathAuth,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.experienceStoreApi = new ExperienceStoreApiApi(apiConfiguration);
  }

  getUniverseReleaseState(universeId: number): Promise<ExperienceStoreStateResponse> {
    return this.experienceStoreApi.experienceStoreApiGetOrCreateExperienceStoreState({
      universeId,
    });
  }

  setUniverseReleaseState(
    request: ExperienceStoreApiSetExperienceStoreStateRequest,
  ): Promise<ExperienceStoreStateResponse> {
    // only one state can be set at a time
    if (
      (request.universeStorePageState && request.testModeState) ||
      (!request.universeStorePageState && !request.testModeState)
    ) {
      throw new Error('Only one state can be set at a time');
    }
    return this.experienceStoreApi.experienceStoreApiSetExperienceStoreState(request);
  }
}
const experienceStoreApiClient = new ExperienceStoreApiClient();
export default experienceStoreApiClient;
