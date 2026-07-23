import BaseClient from '@clients/base';
import { GetSitetestBaseUrl } from '@utils/url';

class UsersClient extends BaseClient {
  protected baseURL = `https://users.${GetSitetestBaseUrl()}/v1`;
}

const usersClient = new UsersClient();

export default usersClient;
