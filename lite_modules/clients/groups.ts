import BaseClient from '@clients/base';
import { GetSitetestBaseUrl } from '@utils/url';

class GroupsClient extends BaseClient {
  protected baseURL = `https://groups.${GetSitetestBaseUrl()}/v1`;
}

const groupsClient = new GroupsClient();

export default groupsClient;
