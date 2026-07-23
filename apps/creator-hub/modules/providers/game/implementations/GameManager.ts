import { GamesClient, GameDetailResponse, DevelopClient } from '@modules/clients';
import { getResponseFromError } from '@modules/clients/utils';
import { StatusCodes } from '@rbx/core';

export default class GamesManager {
  private gameDetailsMap: Map<number, GameDetailResponse>;

  private gameConfigurationMap: Map<number, boolean>;

  constructor(
    private gamesClient: GamesClient,
    private developClient: DevelopClient,
  ) {
    this.gameDetailsMap = new Map();
    this.gameConfigurationMap = new Map();
  }

  async getGameDetail(
    universeId: number,
    shouldDataReload?: boolean,
  ): Promise<GameDetailResponse | null> {
    if (!shouldDataReload && this.gameDetailsMap.has(universeId)) {
      return this.gameDetailsMap.get(universeId) ?? null;
    }
    try {
      const res = await this.gamesClient.getDetails([universeId]);
      const data = res.data?.[0] ?? null;
      if (data) {
        this.gameDetailsMap.set(universeId, data);
      }
      return data;
    } catch (e) {
      // eslint-disable-next-line no-console -- Codeowners should handle this
      const resErr = getResponseFromError(e);
      if (resErr?.status === StatusCodes.BAD_REQUEST) {
        return null;
      }
      // eslint-disable-next-line no-console -- Codeowners should handle this
      console.log(`Could not fetch game details for universeId ${universeId}`);
      throw e;
    }
  }

  async getConfiguration(universeId: number, shouldDataReload?: boolean): Promise<boolean | null> {
    if (!shouldDataReload && this.gameConfigurationMap.has(universeId)) {
      return this.gameConfigurationMap.get(universeId) ?? null;
    }
    try {
      await this.developClient.getUniverseConfiguration(universeId);
      this.gameConfigurationMap.set(universeId, true);
      return true;
    } catch (e) {
      const resErr = getResponseFromError(e);
      if (resErr?.status === StatusCodes.FORBIDDEN) {
        this.gameConfigurationMap.set(universeId, false);
        return false;
      }
      // eslint-disable-next-line no-console -- Codeowners should handle this
      console.warn(`Could not fetch game details for universeId ${universeId}`);
      return null;
    }
  }
}
