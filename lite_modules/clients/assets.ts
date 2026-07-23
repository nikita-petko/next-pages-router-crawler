import BaseClient from '@clients/base';
import { GetApiSiteBaseUrl } from '@utils/url';

class AssetsClient extends BaseClient {
  protected baseURL = `${GetApiSiteBaseUrl()}/assets/user-auth/v1`;
}

const assetsClient = new AssetsClient();

export default assetsClient;
