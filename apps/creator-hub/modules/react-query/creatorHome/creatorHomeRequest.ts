import { Configuration } from '@rbx/clients';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import { GroupsApi, GroupsListGroupsRequest } from '@rbx/clients/creatorHomeApi';
import { getBEDEV2ServiceBasePath } from '@modules/clients/utils';

const basePath = getBEDEV2ServiceBasePath('creator-home-api');

const configuration = new Configuration({
  robloxSiteDomain: process.env.robloxSiteDomain,
  basePath,
  credentials: 'include',
  unifiedLogger: unifiedLoggerClient,
});

const groupsApi = new GroupsApi(configuration);
const getGroupsList = (requestParameters?: GroupsListGroupsRequest) => {
  return groupsApi.groupsListGroups(requestParameters);
};

export default getGroupsList;
