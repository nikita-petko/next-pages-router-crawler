import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  GameJoinApi,
  RobloxGameJoinApiTeamCreateRequest,
  V1TeamCreatePreemptivePostRequest,
} from '@rbx/clients/gamejoin';

import { getBEDEV1ServiceBasePath } from './utils';

export class GamejoinClient {
  private gamejoinApi: GameJoinApi;

  constructor(basePathGamejoin: string = getBEDEV1ServiceBasePath('gamejoin')) {
    const defaultConfig = new Configuration({
      robloxSiteDomain: process.env.robloxSiteDomain,
      basePath: basePathGamejoin,
      credentials: 'include',
      unifiedLogger: unifiedLoggerClient,
    });
    this.gamejoinApi = new GameJoinApi(defaultConfig);
  }

  teamCreatePreemptive(placeId: number): void {
    const tcReq: RobloxGameJoinApiTeamCreateRequest = {
      placeId,
    };
    const req: V1TeamCreatePreemptivePostRequest = {
      teamCreateRequest: tcReq,
    };
    this.gamejoinApi.v1TeamCreatePreemptivePost(req);
  }
}

const gamejoinClient = new GamejoinClient();
export default gamejoinClient;
