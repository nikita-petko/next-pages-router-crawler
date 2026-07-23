import { Configuration } from '@rbx/clients';
import { getBEDEV1ServiceBasePath } from '@modules/clients/utils';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { GamesApi as GamesApiV1 } from '@rbx/clients/games/v1';

const basePath = getBEDEV1ServiceBasePath('games');

const defaultConfiguration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const gamesApiV1 = new GamesApiV1(defaultConfiguration);

export const getGameDetails = (universeIds: number[]) => {
  return gamesApiV1.v1GamesGet({ universeIds });
};

export default getGameDetails;
