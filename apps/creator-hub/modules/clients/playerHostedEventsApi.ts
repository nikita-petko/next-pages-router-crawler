import {
  RobloxPlayerhostedeventsPlayerhostedeventsV1beta1PlayerHostedEventsAPIApi,
  UniversePlayerHostingStatus,
} from '@rbx/client-player-hosted-events-api/v1';
import { createClientConfiguration } from './utils/createClientConfiguration';

export class PlayerHostedEventsClient {
  private api: RobloxPlayerhostedeventsPlayerhostedeventsV1beta1PlayerHostedEventsAPIApi;

  constructor() {
    this.api = new RobloxPlayerhostedeventsPlayerhostedeventsV1beta1PlayerHostedEventsAPIApi(
      createClientConfiguration('player-hosted-events', 'bedev2'),
    );
  }

  async getUniverseHostingPolicy(universeId: number) {
    return this.api.v1beta1PlayerHostedEventsApiUniversePlayerHostingPolicyUniverseIdGet({
      universeId,
    });
  }

  async updateUniverseHostingPolicy(universeId: number, enabled: boolean): Promise<void> {
    await this.api.v1beta1PlayerHostedEventsApiUniversePlayerHostingPolicyPost({
      updateUniversePlayerHostingPolicyRequest: {
        universeId,
        status: enabled
          ? UniversePlayerHostingStatus.Enabled
          : UniversePlayerHostingStatus.Disabled,
      },
    });
  }
}

const playerHostedEventsClient = new PlayerHostedEventsClient();
export default playerHostedEventsClient;
