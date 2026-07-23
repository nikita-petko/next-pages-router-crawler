import { GamesApi as GamesApiV1 } from '@rbx/client-games/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const defaultConfiguration = createClientConfiguration('games', 'bedev1');

const gamesApiV1 = new GamesApiV1(defaultConfiguration);

export const getGameDetails = (universeIds: number[]) => {
  return gamesApiV1.v1GamesGet({ universeIds });
};

export default getGameDetails;
