import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  GameUpdateMessageModel,
  GameUpdateNotificationsApi,
  GameUpdateNotificationsFilterGameUpdateTextRequest,
  GameUpdateNotificationsGetGameUpdateHistoryRequest,
  GameUpdateNotificationsPublishGameUpdateNotificationRequest,
  GameUpdateTextFilterResponse,
} from '@rbx/clients/gameUpdateNotifications';
import { getBEDEV2ServiceBasePath } from './utils';

export type { GameUpdateMessageModel };

export class GameUpdateNotificationsApiClient {
  private gameUpdateNotificationsApi;

  constructor(basePathAuth: string = getBEDEV2ServiceBasePath('game-update-notifications')) {
    this.gameUpdateNotificationsApi = new GameUpdateNotificationsApi(
      new Configuration({
        robloxSiteDomain: process.env.robloxSiteDomain,
        basePath: basePathAuth,
        credentials: 'include',
        unifiedLogger: unifiedLoggerClient,
      }),
    );
  }

  postGameUpdateNotifications(
    request: GameUpdateNotificationsPublishGameUpdateNotificationRequest,
  ): Promise<GameUpdateMessageModel> {
    return this.gameUpdateNotificationsApi.gameUpdateNotificationsPublishGameUpdateNotification(
      request,
    );
  }

  filterGameUpdateText(
    request: GameUpdateNotificationsFilterGameUpdateTextRequest,
  ): Promise<GameUpdateTextFilterResponse> {
    return this.gameUpdateNotificationsApi.gameUpdateNotificationsFilterGameUpdateText(request);
  }

  getGameUpdateNotifications(
    request: GameUpdateNotificationsGetGameUpdateHistoryRequest,
  ): Promise<GameUpdateMessageModel[]> {
    return this.gameUpdateNotificationsApi.gameUpdateNotificationsGetGameUpdateHistory(request);
  }
}

const gameUpdateNotificationsClient = new GameUpdateNotificationsApiClient();
export default gameUpdateNotificationsClient;
