import type {
  RobloxGameJoinApiTeamCreateRequest,
  V1TeamCreatePreemptivePostRequest,
} from '@rbx/client-gamejoin/v1';
import { GameJoinApi } from '@rbx/client-gamejoin/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export class GamejoinClient {
  private gamejoinApi: GameJoinApi;

  constructor() {
    const defaultConfig = createClientConfiguration('gamejoin', 'bedev1');
    this.gamejoinApi = new GameJoinApi(defaultConfig);
  }

  teamCreatePreemptive(placeId: number): void {
    const tcReq: RobloxGameJoinApiTeamCreateRequest = {
      placeId,
    };
    const req: V1TeamCreatePreemptivePostRequest = {
      teamCreateRequest: tcReq,
    };
    void this.gamejoinApi.v1TeamCreatePreemptivePost(req);
  }
}

const gamejoinClient = new GamejoinClient();
export default gamejoinClient;
