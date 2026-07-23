import { UniversesApi } from '@rbx/client-organizations-service-api/v1';
import organizationApiClient from '@modules/clients/organizationApi';
import { createClientConfiguration } from '@modules/clients/utils/createClientConfiguration';

const configuration = createClientConfiguration('orgs', 'bedev2');
const universeApi = new UniversesApi(configuration);

const getUniversePermissions = (universeId: string | number) => {
  return universeApi.v2UniversesUniverseIdPermissionsResolvedGet({
    universeId: String(universeId),
  });
};

const getOrganization = (groupId: number | null) => {
  return organizationApiClient.organizationClient.getOrganization(groupId?.toString() ?? '0');
};

const getUserPermissions = (organizationId: string | null, userId: number | undefined) => {
  if (!organizationId || !userId) {
    return undefined;
  }

  return organizationApiClient.userClient.getUserPermissions(organizationId, userId.toString());
};

export { getUniversePermissions, getOrganization, getUserPermissions };
