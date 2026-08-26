import BaseClient from '@clients/base';
import { GetApiSiteBaseUrl } from '@utils/url';

class OrganizationsClient extends BaseClient {
  protected baseURL = `${GetApiSiteBaseUrl()}/orgs/v1`;
}

const organizationsClient = new OrganizationsClient();

export default organizationsClient;
