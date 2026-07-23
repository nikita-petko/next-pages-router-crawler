import BaseClient from '@clients/base';
import { GetSitetestBaseUrl } from '@utils/url';

class AuthClient extends BaseClient {
  protected baseURL = `https://auth.${GetSitetestBaseUrl()}`;
}

const authClient = new AuthClient();

export default authClient;
