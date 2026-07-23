import BaseClient from '@clients/base';
import { GetSitetestBaseUrl } from '@utils/url';

class GamesClient extends BaseClient {
  protected baseURL = `https://games.${GetSitetestBaseUrl()}/v1`;
}

const gamesClient = new GamesClient();

export default gamesClient;
