import type {
  GameUpdateMessageModel,
  GameUpdateNotificationsFilterGameUpdateTextRequest,
  GameUpdateNotificationsGetGameUpdateHistoryRequest,
  GameUpdateNotificationsPublishGameUpdateNotificationRequest,
  GameUpdateTextFilterResponse,
} from '@rbx/client-game-update-notifications/v1';
import { GameUpdateNotificationsApi } from '@rbx/client-game-update-notifications/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export type { GameUpdateMessageModel };

export class GameUpdateNotificationsApiClient {
  private gameUpdateNotificationsApi;

  constructor() {
    this.gameUpdateNotificationsApi = new GameUpdateNotificationsApi(
      createClientConfiguration('game-update-notifications', 'bedev2'),
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
