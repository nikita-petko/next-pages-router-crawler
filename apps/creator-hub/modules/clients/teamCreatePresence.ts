import type {
  TeamCreatePresenceMultiGetUniversesActiveSessionMembersRequest,
  MultiGetUniversesActiveSessionMembersResponse,
} from '@rbx/client-team-create-presence/v1';
import { TeamCreatePresenceApi } from '@rbx/client-team-create-presence/v1';
import GenericBEDEV1Error from './errors/GenericBEDEV1Error';
import { createClientConfiguration } from './utils/createClientConfiguration';
import tryParseResponseError from './utils/tryParseResponseError';

export type { ActiveUser } from '@rbx/client-team-create-presence/v1';

export class TeamCreatePresenceClient {
  private teamCreatePresenceApi: TeamCreatePresenceApi;

  constructor() {
    this.teamCreatePresenceApi = new TeamCreatePresenceApi(
      createClientConfiguration('teamcreate', 'bedev2'),
    );
  }

  async getActiveUsers(
    requestParameters: TeamCreatePresenceMultiGetUniversesActiveSessionMembersRequest,
    initOverrides?: RequestInit,
  ): Promise<MultiGetUniversesActiveSessionMembersResponse> {
    try {
      return await this.teamCreatePresenceApi.teamCreatePresenceMultiGetUniversesActiveSessionMembers(
        requestParameters,
        initOverrides,
      );
    } catch (e) {
      const error = await tryParseResponseError(e);
      if (error) {
        throw new GenericBEDEV1Error(error.code, error.message);
      } else {
        throw e;
      }
    }
  }
}

const teamCreatePresenceClient = new TeamCreatePresenceClient();
export default teamCreatePresenceClient;
