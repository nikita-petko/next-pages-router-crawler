import BaseClient from '@clients/base';
import { GetSitetestBaseUrl } from '@utils/url';

class DevelopClient extends BaseClient {
  protected baseURL = `https://develop.${GetSitetestBaseUrl()}`;
}

const developClient = new DevelopClient();

export default developClient;
