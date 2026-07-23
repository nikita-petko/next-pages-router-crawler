import type { GroupsListGroupsRequest } from '@rbx/client-creator-home-api/v1';
import { GroupsApi } from '@rbx/client-creator-home-api/v1';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const configuration = createClientConfiguration('creator-home-api', 'bedev2');

const groupsApi = new GroupsApi(configuration);
const getGroupsList = (requestParameters?: GroupsListGroupsRequest) => {
  return groupsApi.groupsListGroups(requestParameters);
};

export default getGroupsList;
