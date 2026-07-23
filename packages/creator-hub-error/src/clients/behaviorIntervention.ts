import {
  DefaultApi,
  HttpControllerGetNotApprovedResponse,
} from '@rbx/client-behavior-intervention/v1';
import { Configuration } from '@rbx/clients-core';
import { UnifiedLogger } from '@rbx/unified-logger';

export type BehaviorInterventionResponse = HttpControllerGetNotApprovedResponse;

function getBEDEV1ServiceBasePath(serviceName: string) {
  return `https://${serviceName}.${process.env.bedev1BaseDomain}`;
}

const USER_MODERATION_SERVICE_NAME = 'usermoderation';

export class BehaviorInterventionClient {
  private behaviorInterventionApi: DefaultApi;

  constructor(unifiedLoggerClient: UnifiedLogger) {
    const configuration = new Configuration({
      basePath: getBEDEV1ServiceBasePath(USER_MODERATION_SERVICE_NAME),
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.behaviorInterventionApi = new DefaultApi(configuration);
  }

  async getNotApproved(): Promise<BehaviorInterventionResponse | null> {
    const response = await this.behaviorInterventionApi.behaviorInterventionGetNotApproved();
    return response.punishedUserId ? response : null;
  }

  async reactivateUser(): Promise<void> {
    await this.behaviorInterventionApi.behaviorInterventionNotApprovedReactivate();
  }
}

export default BehaviorInterventionClient;
