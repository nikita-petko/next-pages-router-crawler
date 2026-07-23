import BaseClient from '@clients/base';
import { GetSitetestBaseUrl } from '@utils/url';

class EconomyClient extends BaseClient {
  protected baseURL = `https://economy.${GetSitetestBaseUrl()}/v1`;
}

const economyClient = new EconomyClient();

export default economyClient;
