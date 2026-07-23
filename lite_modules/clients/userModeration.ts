import BaseClient from '@clients/base';
import { GetSitetestBaseUrl } from '@utils/url';

class UserModerationClient extends BaseClient {
  protected baseURL = `https://usermoderation.${GetSitetestBaseUrl()}/v2`;
}

const userModerationClient = new UserModerationClient();

export default userModerationClient;
