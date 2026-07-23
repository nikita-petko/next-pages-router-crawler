import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  TeamCreatePresenceApi,
  TeamCreatePresenceMultiGetUniversesActiveSessionMembersRequest,
  MultiGetUniversesActiveSessionMembersResponse,
} from '@rbx/clients/teamCreatePresence/v1';

import { getBEDEV2ServiceBasePath } from './utils';

import GenericBEDEV1Error from './errors/GenericBEDEV1Error';
import tryParseResponseError from './utils/tryParseResponseError';

export type { ActiveUser } from '@rbx/clients/teamCreatePresence';

export class TeamCreatePresenceClient {
  private teamCreatePresenceApi: TeamCreatePresenceApi;

  constructor(basePath: string = getBEDEV2ServiceBasePath('teamcreate')) {
    const defaultConfig = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });

    this.teamCreatePresenceApi = new TeamCreatePresenceApi(defaultConfig);
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
