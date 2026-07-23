import BaseClient from '@clients/base';
import { GetApiSiteBaseUrl } from '@utils/url';

class BrandPlatformClient extends BaseClient {
  protected baseURL = `${GetApiSiteBaseUrl()}/brand-platform`;
}

const brandPlatformClient = new BrandPlatformClient();

export default brandPlatformClient;
